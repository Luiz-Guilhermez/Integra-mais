require('dotenv').config()
const express = require('express');
const cors = require('cors')
const bcrypt = require('bcrypt');
const db = require('./src/db');
const jwt = require('jsonwebtoken');
const auth = require('./src/middleware/auth');
const admin = require('./src/middleware/admin');
const crypto = require('crypto')
const enviarEmail = require('./src/services/email')
const upload = require('./src/config/multer');
const fs = require('fs');
const path = require('path');

const app = express();

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

//Rotas de Cadastro e Login
//Cadastro
app.post('/alunos', async (req, res) => {
    try {
        const { nome, email, rm, senha } = req.body;

        if (!nome || !email || !rm || !senha) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos.'
            });
        }

        const senhaHash = await bcrypt.hash(senha, 10);

        const resultado = await db.query(
            `INSERT INTO alunos (nome, email, rm, senha_hash)
             VALUES ($1, $2, $3, $4)
             RETURNING id, nome, email, rm, criado_em`,
            [nome, email, rm, senhaHash]
        );

        res.status(201).json({
            mensagem: 'Aluno cadastrado com sucesso!',
            aluno: resultado.rows[0]
        });

    } catch (erro) {
        console.error(erro);

        if (erro.code === '23505') {
            return res.status(409).json({
                mensagem: 'Este e-mail ou RM já está cadastrado.'
            });
        }

        res.status(500).json({
            mensagem: 'Erro interno ao cadastrar aluno.'
        });
    }
});

//Login
app.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        const resultado = await db.query(
            'SELECT * FROM alunos WHERE email = $1',
            [email]
        );

        const aluno = resultado.rows[0];

        if (!aluno) {
            return res.status(401).json({
                mensagem: 'Email ou senha incorretos.'
            });
        }

        const senhaCorreta = await bcrypt.compare(
            senha,
            aluno.senha_hash
        );

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: 'Email ou senha incorretos.'
            });
        }

        const token = jwt.sign(
            {
                id: aluno.id,
                tipo: aluno.tipo
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '1h'
            }
        );

        return res.status(200).json({
            mensagem: 'Login realizado com sucesso.',
            token,
            aluno: {
                id: aluno.id,
                nome: aluno.nome,
                email: aluno.email,
                rm: aluno.rm,
                tipo: aluno.tipo
            }
        });

    } catch (erro) {
        console.error('Erro ao realizar login:', erro);

        return res.status(500).json({
            mensagem: 'Erro interno do servidor.'
        });
    }
});

//Rotas de Postagem
//Fazer Postagem
app.post('/posts', auth,(req, res, next) => {
        upload.array('midias', 5)(req, res, (erro) => {
            if (erro) {
                return res.status(400).json({
                    mensagem: erro.message || 'Erro ao enviar arquivos.'
                });
            }

            next();
        });
    },
    async (req, res) => {
        const arquivos = req.files || [];
        const removerArquivos = async () => {
            await Promise.all(
                arquivos.map(arquivo =>
                    fs.promises.unlink(arquivo.path).catch(() => {})
                )
            );
        };

        let client;
        let transacaoIniciada = false;

        try {
            const alunoId = req.alunoId;
            const { conteudo } = req.body;

            if (!conteudo || !conteudo.trim()) {
                await removerArquivos();

                return res.status(400).json({
                    mensagem: 'O conteúdo da publicação é obrigatório.'
                });
            }

            if (conteudo.trim().length > 2000) {
                await removerArquivos();

                return res.status(400).json({
                    mensagem: 'A publicação não pode ter mais de 2000 caracteres.'
                });
            }

            client = await db.connect();

            await client.query('BEGIN');
            transacaoIniciada = true;

            const resultado = await client.query(
                `INSERT INTO posts (aluno_id, conteudo)
                 VALUES ($1, $2)
                 RETURNING id, aluno_id, conteudo, criado_em`,
                [alunoId, conteudo.trim()]
            );

            const post = resultado.rows[0];
            const midiasSalvas = [];

            for (const arquivo of arquivos) {
                const tipo = arquivo.mimetype.startsWith('image/')
                    ? 'imagem'
                    : 'video';

                const caminhoArquivo =
                    `uploads/posts/${arquivo.filename}`;

                const resultadoMidia = await client.query(
                    `INSERT INTO midias_posts
                        (post_id, caminho_arquivo, tipo, nome_original)
                     VALUES ($1, $2, $3, $4)
                     RETURNING id, post_id, caminho_arquivo, tipo, nome_original, criado_em`,
                    [
                        post.id,
                        caminhoArquivo,
                        tipo,
                        arquivo.originalname
                    ]
                );

                midiasSalvas.push(resultadoMidia.rows[0]);
            }

            await client.query('COMMIT');
            transacaoIniciada = false;

            return res.status(201).json({
                mensagem: 'Publicação criada com sucesso!',
                post: {
                    ...post,
                    midias: midiasSalvas
                }
            });

        } catch (erro) {

            console.error('Erro ao criar publicação:', erro);

            if (client && transacaoIniciada) {
                await client.query('ROLLBACK').catch(console.error);
                transacaoIniciada = false;
            }

            await removerArquivos();

            return res.status(500).json({
                mensagem: 'Erro ao criar publicação.'
            });

        } finally {
            
            if (client) {
                client.release();
            }

        }
    }
);

//Mostrar Postagens
app.get('/posts', async (req, res) => {
    try {
        const resultado = await db.query(
            `SELECT
                posts.id,
                posts.conteudo,
                posts.criado_em,
                alunos.id AS aluno_id,
                alunos.nome AS autor,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', midias_posts.id,
                            'caminho_arquivo', midias_posts.caminho_arquivo,
                            'tipo', midias_posts.tipo,
                            'nome_original', midias_posts.nome_original
                        )
                        ORDER BY midias_posts.criado_em
                    ) FILTER (WHERE midias_posts.id IS NOT NULL),
                    '[]'::json
                ) AS midias

             FROM posts

             INNER JOIN alunos
                ON posts.aluno_id = alunos.id

             LEFT JOIN midias_posts
                ON posts.id = midias_posts.post_id

             GROUP BY posts.id, alunos.id

             ORDER BY posts.criado_em DESC`
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao buscar publicações:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao buscar publicações.'
        });
    }
});

//Mostrar Minhas Postagens
app.get('/minhas-postagens', auth, async (req, res) => {
    try {
        const alunoId = req.alunoId;

        const resultado = await db.query(
            `SELECT
                posts.id,
                posts.conteudo,
                posts.criado_em,
                alunos.id AS aluno_id,
                alunos.nome AS autor,

                COALESCE(
                    json_agg(
                        json_build_object(
                            'id', midias_posts.id,
                            'caminho_arquivo', midias_posts.caminho_arquivo,
                            'tipo', midias_posts.tipo,
                            'nome_original', midias_posts.nome_original
                        )
                        ORDER BY midias_posts.criado_em
                    ) FILTER (WHERE midias_posts.id IS NOT NULL),
                    '[]'::json
                ) AS midias

             FROM posts

             INNER JOIN alunos
                ON posts.aluno_id = alunos.id

             LEFT JOIN midias_posts
                ON posts.id = midias_posts.post_id

             WHERE posts.aluno_id = $1

             GROUP BY posts.id, alunos.id

             ORDER BY posts.criado_em DESC`,
            [alunoId]
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao buscar suas publicações:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao buscar suas publicações.'
        });
    }
});

//Excluir Minha Postagem
app.delete('/posts/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.alunoId;

        const resultado = await db.query(
            `DELETE FROM posts
             WHERE id = $1 AND aluno_id = $2`,
            [id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Publicação não encontrada ou você não tem permissão para excluí-la.'
            });
        }

        return res.status(200).json({
            mensagem: 'Publicação excluída com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao excluir publicação:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao excluir publicação.'
        });
    }
});

//Editar Minha Postagem
app.put('/posts/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { conteudo } = req.body;
        const alunoId = req.alunoId;

        if (!conteudo || !conteudo.trim()) {
            return res.status(400).json({
                mensagem: 'O conteúdo da publicação é obrigatório.'
            });
        }

        if (conteudo.trim().length > 2000) {
            return res.status(400).json({
                mensagem: 'A publicação não pode ter mais de 2000 caracteres.'
            });
        }

        const resultado = await db.query(
            `UPDATE posts
             SET conteudo = $1
             WHERE id = $2 AND aluno_id = $3
             RETURNING id, aluno_id, conteudo, criado_em`,
            [conteudo.trim(), id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Publicação não encontrada ou você não tem permissão para editá-la.'
            });
        }

        return res.status(200).json({
            mensagem: 'Publicação atualizada com sucesso!',
            post: resultado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao editar publicação:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao editar publicação.'
        });
    }
});

//Rotas de Curtidas
//Mostrar Curtidas
app.get('/posts/:id/curtidas', auth, async (req, res) => {
    const { id } = req.params;
    const alunoId = req.alunoId;

    try {
        const resultado = await db.query(
            `SELECT
                COUNT(*) AS total,
                COALESCE(
                    BOOL_OR(aluno_id = $2),
                    false
                ) AS curtido
             FROM curtidas
             WHERE post_id = $1`,
            [id, alunoId]
        );

        return res.status(200).json({
            total: Number(resultado.rows[0].total),
            curtido: resultado.rows[0].curtido
        });

    } catch (erro) {
        console.error('Erro ao consultar curtidas:', erro);

        return res.status(500).json({
            erro: 'Erro ao consultar curtidas.'
        });
    }
});

//Curtir Postagem
app.post('/posts/:id/curtidas', auth, async (req, res) => {
    const { id } = req.params;
    const alunoId = req.alunoId;

    try {
        const resultado = await db.query(
            `INSERT INTO curtidas (post_id, aluno_id)
             VALUES ($1, $2)
             ON CONFLICT (post_id, aluno_id) DO NOTHING
             RETURNING id`,
            [id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(200).json({
                mensagem: 'Esta publicação já foi curtida.'
            });
        }

        return res.status(201).json({
            mensagem: 'Publicação curtida com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao curtir publicação:', erro);

        if (erro.code === '23503') {
            return res.status(404).json({
                erro: 'Publicação não encontrada.'
            });
        }

        return res.status(500).json({
            erro: 'Erro ao curtir publicação.'
        });
    }
});

//Descurtir Postagem
app.delete('/posts/:id/curtidas', auth, async (req, res) => {
    const { id } = req.params;
    const alunoId = req.alunoId;

    try {
        const resultado = await db.query(
            `DELETE FROM curtidas
             WHERE post_id = $1
             AND aluno_id = $2
             RETURNING id`,
            [id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                erro: 'Curtida não encontrada.'
            });
        }

        return res.status(200).json({
            mensagem: 'Curtida removida com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao remover curtida:', erro);

        return res.status(500).json({
            erro: 'Erro ao remover curtida.'
        });
    }
});

//Rotas de Comentarios
//Mostrar Comentario
app.get('/posts/:id/comentarios', async (req, res) => {
    const { id } = req.params;

    try {
        const resultado = await db.query(
            `SELECT
                comentarios.id,
                comentarios.conteudo,
                comentarios.criado_em,
                alunos.id AS aluno_id,
                alunos.nome AS autor
             FROM comentarios
             INNER JOIN alunos
                ON comentarios.aluno_id = alunos.id
             WHERE comentarios.post_id = $1
             ORDER BY comentarios.criado_em ASC`,
            [id]
        );

        res.json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao buscar comentários:', erro);

        res.status(500).json({
            erro: 'Erro ao buscar comentários.'
        });
    }
});

//Fazer um Comentario
app.post('/posts/:id/comentarios', auth, async (req, res) => {
    const { id } = req.params;
    const alunoId = req.alunoId;
    const { conteudo } = req.body;

    if (!conteudo || !conteudo.trim()) {
        return res.status(400).json({
            mensagem: 'O comentário não pode estar vazio.'
        })
    }       

    if (conteudo.trim().length > 500) {
        return res.status(400).json({
            mensagem: 'O comentário não pode ter mais de 500 caracteres.'
        })
    }

    try {
        const resultado = await db.query(
            `INSERT INTO comentarios
                (post_id, aluno_id, conteudo)
             VALUES ($1, $2, $3)
             RETURNING id, post_id, aluno_id, conteudo, criado_em`,
            [id, alunoId, conteudo.trim()]
        );

        return res.status(201).json({
            mensagem: 'Comentário publicado com sucesso!',
            comentario: resultado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao adicionar comentário:', erro);

        if (erro.code === '23503') {
            return res.status(404).json({
                erro: 'Publicação não encontrada.'
            });
        }

        return res.status(500).json({
            erro: 'Erro ao adicionar comentário.'
        });
    }
});

//Excluir Comentario
app.delete('/comentarios/:id', auth, async (req, res) => {
    const { id } = req.params;
    const alunoId = req.alunoId;

    try {
        const resultado = await db.query(
            `DELETE FROM comentarios
             WHERE id = $1
             AND aluno_id = $2
             RETURNING id`,
            [id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                erro: 'Comentário não encontrado ou você não pode excluí-lo.'
            });
        }

        return res.status(200).json({
            mensagem: 'Comentário excluído com sucesso!'
        });

    } catch (erro) {
        console.error('Erro ao excluir comentário:', erro);

        return res.status(500).json({
            erro: 'Erro ao excluir comentário.'
        });
    }
});

//Perfil
//Mostrar Perfil
app.get('/perfil', auth, async (req, res) => {
    try {
        const resultado = await db.query(
            `SELECT
                alunos.id,
                alunos.nome,
                alunos.email,
                alunos.rm,
                alunos.tipo,
                alunos.criado_em,
                COUNT(posts.id) AS quantidade_posts
             FROM alunos
             LEFT JOIN posts
                ON posts.aluno_id = alunos.id
             WHERE alunos.id = $1
             GROUP BY
                alunos.id,
                alunos.nome,
                alunos.email,
                alunos.rm,
                alunos.tipo,
                alunos.criado_em`,
            [req.alunoId]
        )

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado.'
            })
        }

        return res.status(200).json(resultado.rows[0])

    } catch (erro) {
        console.error('Erro ao buscar perfil:', erro)

        return res.status(500).json({
            mensagem: 'Erro ao buscar perfil.'
        })
    }
})

//Editar Email
app.put('/perfil/email', auth, async (req, res) => {
    try {

        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                mensagem: 'O e-mail é obrigatório.'
            })
        }

        const emailExiste = await db.query(
            `SELECT id
             FROM alunos
             WHERE email = $1
             AND id <> $2`,
            [email, req.alunoId]
        )

        if (emailExiste.rowCount > 0) {
            return res.status(409).json({
                mensagem: 'Este e-mail já está sendo utilizado.'
            })
        }

        const resultado = await db.query(
            `UPDATE alunos
             SET email = $1
             WHERE id = $2
             RETURNING id, nome, email, rm, tipo`,
            [email, req.alunoId]
        )

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado.'
            })
        }

        return res.status(200).json({
            mensagem: 'E-mail alterado com sucesso.',
            aluno: resultado.rows[0]
        })

    } catch (erro) {

        console.error('Erro ao alterar e-mail:', erro)

        return res.status(500).json({
            mensagem: 'Erro ao alterar e-mail.'
        })
    }
})

//Editar Senha
app.put('/perfil/senha', auth, async (req, res) => {
    try {

        const {
            senhaAtual,
            novaSenha,
            confirmarSenha
        } = req.body

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos.'
            })
        }

        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({
                mensagem: 'A nova senha e a confirmação não são iguais.'
            })
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                mensagem: 'A nova senha deve ter pelo menos 6 caracteres.'
            })
        }

        const resultado = await db.query(
            `SELECT senha_hash
             FROM alunos
             WHERE id = $1`,
            [req.alunoId]
        )

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Aluno não encontrado.'
            })
        }

        const senhaCorreta = await bcrypt.compare(
            senhaAtual,
            resultado.rows[0].senha_hash
        )

        if (!senhaCorreta) {
            return res.status(401).json({
                mensagem: 'A senha atual está incorreta.'
            })
        }

        const novaSenhaHash = await bcrypt.hash(
            novaSenha,
            10
        )

        await db.query(
            `UPDATE alunos
             SET senha_hash = $1
             WHERE id = $2`,
            [novaSenhaHash, req.alunoId]
        )

        return res.status(200).json({
            mensagem: 'Senha alterada com sucesso.'
        })

    } catch (erro) {

        console.error('Erro ao alterar senha:', erro)

        return res.status(500).json({
            mensagem: 'Erro ao alterar senha.'
        })
    }
})

//Admin
//Admin - Deletar Postagem
app.delete('/admin/posts/:id', auth, admin, async (req, res) => {
    try {
        const { id } = req.params;

        const resultado = await db.query(
            `DELETE FROM posts
             WHERE id = $1
             RETURNING id`,
            [id]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Publicação não encontrada.'
            });
        }

        return res.status(200).json({
            mensagem: 'Publicação excluída pelo administrador.'
        });

    } catch (erro) {
        console.error('Erro ao administrador excluir publicação:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao excluir publicação.'
        });
    }
});

//Admin - Mostrar Postagens
app.get('/admin/posts', auth, admin, async (req, res) => {
    try {
        const resultado = await db.query(
            `SELECT
                posts.id,
                posts.conteudo,
                posts.criado_em,
                alunos.id AS aluno_id,
                alunos.nome AS autor,
                alunos.email AS email,
                alunos.rm AS rm
             FROM posts
             INNER JOIN alunos
                ON posts.aluno_id = alunos.id
             ORDER BY posts.criado_em DESC`
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao buscar postagens administrativas:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao buscar postagens.'
        });
    }
});

//Mostrar Alunos
app.get('/admin/alunos', auth, admin, async (req, res) => {
    try {
        const resultado = await db.query(
            `SELECT
                id,
                nome,
                email,
                rm,
                tipo,
                criado_em
             FROM alunos
             ORDER BY criado_em DESC`
        )

        return res.status(200).json(resultado.rows)

    } catch (erro) {
        console.error('Erro ao buscar alunos:', erro)

        return res.status(500).json({
            mensagem: 'Erro ao buscar alunos.'
        })
    }
})

//Senha
//Recuperar Senha - Cria Token
app.post('/recuperar-senha', async (req, res) => {
    try {
        const { email } = req.body

        if (!email) {
            return res.status(400).json({
                mensagem: 'O e-mail é obrigatório.'
            })
        }

        const resultado = await db.query(
            `SELECT id
             FROM alunos
             WHERE email = $1`,
            [email]
        )

        if (resultado.rowCount === 0) {
            return res.status(200).json({
                mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
            })
        }

        const alunoId = resultado.rows[0].id

        const token = crypto.randomBytes(32).toString('hex')

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')

        const expiraEm = new Date(
            Date.now() + 30 * 60 * 1000
        )

        await db.query(
            `INSERT INTO recuperacao_senha
                (aluno_id, token_hash, expira_em)
             VALUES
                ($1, $2, $3)`,
            [
                alunoId,
                tokenHash,
                expiraEm
            ]
        )

        const linkRecuperacao =
            `http://localhost:5173/redefinir-senha?token=${token}`

        await enviarEmail(
            email,
            'Recuperação de senha - Integra+',
            `Olá!

        Recebemos uma solicitação para redefinir sua senha do Integra+.

        Clique no link abaixo para criar uma nova senha:

        ${linkRecuperacao}

        Este link é válido por 30 minutos.

        Se você não solicitou a recuperação da senha, ignore este e-mail.

        Atenciosamente,
        Equipe Integra+`
        )

        return res.status(200).json({
            mensagem: 'Se o e-mail estiver cadastrado, você receberá um link para redefinir sua senha.'
        })
    } catch (erro) {
        console.error('Erro ao solicitar recuperação:', erro)

        return res.status(500).json({
            mensagem: 'Erro ao solicitar recuperação de senha.'
        })
    }
})

//Redefinir Senha - Consome Token
app.post('/redefinir-senha', async (req, res) => {
    try {
        const {
            token,
            novaSenha,
            confirmarSenha
        } = req.body

        if (!token || !novaSenha || !confirmarSenha) {
            return res.status(400).json({
                mensagem: 'Preencha todos os campos.'
            })
        }

        if (novaSenha !== confirmarSenha) {
            return res.status(400).json({
                mensagem: 'A nova senha e a confirmação não são iguais.'
            })
        }

        if (novaSenha.length < 6) {
            return res.status(400).json({
                mensagem: 'A nova senha deve ter pelo menos 6 caracteres.'
            })
        }

        const tokenHash = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex')

        const resultado = await db.query(
            `SELECT id, aluno_id
             FROM recuperacao_senha
             WHERE token_hash = $1
             AND usado = FALSE
             AND expira_em > NOW()`,
            [tokenHash]
        )

        if (resultado.rowCount === 0) {
            return res.status(400).json({
                mensagem: 'Token inválido, expirado ou já utilizado.'
            })
        }

        const recuperacao = resultado.rows[0]

        const novaSenhaHash = await bcrypt.hash(
            novaSenha,
            10
        )

        await db.query(
            `UPDATE alunos
             SET senha_hash = $1
             WHERE id = $2`,
            [
                novaSenhaHash,
                recuperacao.aluno_id
            ]
        )

        await db.query(
            `UPDATE recuperacao_senha
             SET usado = TRUE
             WHERE id = $1`,
            [recuperacao.id]
        )

        return res.status(200).json({
            mensagem: 'Senha redefinida com sucesso.'
        })

    } catch (erro) {
        console.error('Erro ao redefinir senha:', erro)

        return res.status(500).json({
            mensagem: 'Erro ao redefinir senha.'
        })
    }
})

//Chat
//Pesquisar Alunos
app.get('/alunos/buscar', auth, async (req, res) => {
    try {
        const { nome } = req.query;
        const alunoId = req.alunoId;

        if (!nome || !nome.trim()) {
            return res.status(400).json({
                mensagem: 'Informe o nome do aluno que deseja pesquisar.'
            });
        }

        const resultado = await db.query(
            `SELECT
                id,
                nome,
                rm
             FROM alunos
             WHERE nome ILIKE $1
             AND id <> $2
             ORDER BY nome ASC
             LIMIT 20`,
            [`%${nome.trim()}%`, alunoId]
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao pesquisar alunos:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao pesquisar alunos.'
        });
    }
});

//Entrar em Conversa Privada
app.post('/conversas/:outroAlunoId', auth, async (req, res) => {
    let client;

    try {
        const { outroAlunoId } = req.params;
        const alunoId = String(req.alunoId);

        if (!/^\d+$/.test(outroAlunoId) || BigInt(outroAlunoId) <= 0n) {
            return res.status(400).json({
                mensagem: 'ID do aluno inválido.'
            });
        }

        if (BigInt(outroAlunoId) === BigInt(alunoId)) {
            return res.status(400).json({
                mensagem: 'Você não pode iniciar uma conversa consigo mesmo.'
            });
        }

        client = await db.connect();

        await client.query('BEGIN');

        const alunoExiste = await client.query(
            `SELECT id, nome
             FROM alunos
             WHERE id = $1`,
            [outroAlunoId]
        );

        if (alunoExiste.rowCount === 0) {
            await client.query('ROLLBACK');

            return res.status(404).json({
                mensagem: 'Aluno não encontrado.'
            });
        }

        const idsOrdenados = [alunoId, outroAlunoId]
            .sort((a, b) => BigInt(a) < BigInt(b) ? -1 : 1);

        const chaveConversa = `${idsOrdenados[0]}:${idsOrdenados[1]}`;

        await client.query(
            `SELECT pg_advisory_xact_lock(hashtext($1)::bigint)`,
            [chaveConversa]
        );

        const conversaExistente = await client.query(
            `SELECT c.id
             FROM conversas c
             WHERE
                (SELECT COUNT(*)
                 FROM participantes_conversa pc
                 WHERE pc.conversa_id = c.id) = 2

                AND EXISTS (
                    SELECT 1
                    FROM participantes_conversa pc
                    WHERE pc.conversa_id = c.id
                    AND pc.aluno_id = $1
                )

                AND EXISTS (
                    SELECT 1
                    FROM participantes_conversa pc
                    WHERE pc.conversa_id = c.id
                    AND pc.aluno_id = $2
                )

             LIMIT 1`,
            [alunoId, outroAlunoId]
        );

        if (conversaExistente.rowCount > 0) {
            await client.query('COMMIT');

            return res.status(200).json({
                mensagem: 'Conversa encontrada.',
                conversaId: conversaExistente.rows[0].id,
                criada: false
            });
        }

        const novaConversa = await client.query(
            `INSERT INTO conversas
             DEFAULT VALUES
             RETURNING id, criado_em`
        );

        const conversaId = novaConversa.rows[0].id;

        await client.query(
            `INSERT INTO participantes_conversa
                (conversa_id, aluno_id)
             VALUES
                ($1, $2),
                ($1, $3)`,
            [conversaId, alunoId, outroAlunoId]
        );

        await client.query('COMMIT');

        return res.status(201).json({
            mensagem: 'Conversa criada com sucesso!',
            conversaId,
            criada: true,
            outroAluno: alunoExiste.rows[0]
        });

    } catch (erro) {
        if (client) {
            await client.query('ROLLBACK').catch(() => {});
        }

        console.error('Erro ao iniciar conversa:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao iniciar conversa.'
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});


//Mostrar Conversas Privadas
app.get('/conversas', auth, async (req, res) => {
    try {
        const alunoId = req.alunoId;

        const resultado = await db.query(
            `SELECT
                c.id AS conversa_id,
                c.criado_em,

                outro.id AS outro_aluno_id,
                outro.nome AS outro_aluno_nome,

                ultima_mensagem.id AS ultima_mensagem_id,
                ultima_mensagem.conteudo AS ultima_mensagem,
                ultima_mensagem.remetente_id AS ultima_mensagem_remetente,
                ultima_mensagem.criada_em AS ultima_mensagem_data,

                (
                    SELECT COUNT(*)
                    FROM mensagens m
                    WHERE m.conversa_id = c.id
                        AND m.remetente_id <> $1
                        AND m.lida_em IS NULL
                ) AS mensagens_nao_lidas

            FROM conversas c

            INNER JOIN participantes_conversa meu
                ON meu.conversa_id = c.id

            INNER JOIN participantes_conversa participante
                ON participante.conversa_id = c.id
                AND participante.aluno_id <> $1

            INNER JOIN alunos outro
                ON outro.id = participante.aluno_id

            LEFT JOIN LATERAL (
                SELECT
                    m.id,
                    m.conteudo,
                    m.remetente_id,
                    m.criada_em
                FROM mensagens m
                WHERE m.conversa_id = c.id
                ORDER BY m.criada_em DESC, m.id DESC
                LIMIT 1
            ) ultima_mensagem ON TRUE

            WHERE meu.aluno_id = $1

            AND (
                SELECT COUNT(*)
                FROM participantes_conversa pc
                WHERE pc.conversa_id = c.id
            ) = 2

            ORDER BY
                ultima_mensagem.criada_em DESC NULLS LAST,
                c.criado_em DESC`,
            [alunoId]
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao listar conversas:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao listar conversas.'
        });
    }
});



//Enviar Mensagem - Chat
app.post('/conversas/:id/mensagens', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { conteudo } = req.body;
        const alunoId = req.alunoId;

        if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
            return res.status(400).json({
                mensagem: 'ID da conversa inválido.'
            });
        }

        if (typeof conteudo !== 'string' || !conteudo.trim()) {
            return res.status(400).json({
                mensagem: 'Digite uma mensagem.'
            });
        }

        if (conteudo.trim().length > 5000) {
            return res.status(400).json({
                mensagem: 'A mensagem deve ter no máximo 5000 caracteres.'
            });
        }

        const conversa = await db.query(
            `SELECT c.id
             FROM conversas c
             INNER JOIN participantes_conversa pc
                ON pc.conversa_id = c.id
             WHERE c.id = $1
                AND pc.aluno_id = $2
                AND (
                    SELECT COUNT(*)
                    FROM participantes_conversa
                    WHERE conversa_id = c.id
                ) = 2`,
            [id, alunoId]
        );

        if (conversa.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Conversa não encontrada.'
            });
        }

        const resultado = await db.query(
            `INSERT INTO mensagens
                (conversa_id, remetente_id, conteudo)
             VALUES ($1, $2, $3)
             RETURNING id, conversa_id, remetente_id, conteudo, criada_em, lida_em`,
            [id, alunoId, conteudo.trim()]
        );

        return res.status(201).json({
            mensagem: 'Mensagem enviada com sucesso!',
            dados: resultado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao enviar mensagem:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao enviar mensagem.'
        });
    }
});


//Buscar Mensagens - Chat
app.get('/conversas/:id/mensagens', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.alunoId;

        if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
            return res.status(400).json({
                mensagem: 'ID da conversa inválido.'
            });
        }

        const conversa = await db.query(
            `SELECT c.id
             FROM conversas c
             INNER JOIN participantes_conversa pc
                ON pc.conversa_id = c.id
             WHERE c.id = $1
                AND pc.aluno_id = $2
                AND (
                    SELECT COUNT(*)
                    FROM participantes_conversa
                    WHERE conversa_id = c.id
                ) = 2`,
            [id, alunoId]
        );

        if (conversa.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Conversa não encontrada.'
            });
        }

        const resultado = await db.query(
            `SELECT
                m.id,
                m.conversa_id,
                m.remetente_id,
                a.nome AS remetente_nome,
                m.conteudo,
                m.criada_em,
                m.lida_em
             FROM mensagens m
             INNER JOIN alunos a
                ON a.id = m.remetente_id
             WHERE m.conversa_id = $1
             ORDER BY m.criada_em ASC, m.id ASC
             LIMIT 100`,
            [id]
        );

        return res.status(200).json(resultado.rows);

    } catch (erro) {
        console.error('Erro ao buscar mensagens:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao buscar mensagens.'
        });
    }
});


//Marcar Mensagens como Lidas - Chat
app.patch('/conversas/:id/mensagens/lidas', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const alunoId = req.alunoId;

        if (!/^\d+$/.test(id) || BigInt(id) <= 0n) {
            return res.status(400).json({
                mensagem: 'ID da conversa inválido.'
            });
        }

        const conversa = await db.query(
            `SELECT c.id
             FROM conversas c
             INNER JOIN participantes_conversa pc
                ON pc.conversa_id = c.id
             WHERE c.id = $1
                AND pc.aluno_id = $2
                AND (
                    SELECT COUNT(*)
                    FROM participantes_conversa
                    WHERE conversa_id = c.id
                ) = 2`,
            [id, alunoId]
        );

        if (conversa.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Conversa não encontrada.'
            });
        }

        const resultado = await db.query(
            `UPDATE mensagens
             SET lida_em = CURRENT_TIMESTAMP
             WHERE conversa_id = $1
                AND remetente_id <> $2
                AND lida_em IS NULL
             RETURNING id`,
            [id, alunoId]
        );

        return res.status(200).json({
            mensagem: 'Mensagens marcadas como lidas!',
            quantidade: resultado.rowCount
        });

    } catch (erro) {
        console.error('Erro ao marcar mensagens como lidas:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao marcar mensagens como lidas.'
        });
    }
});


//Excluir Mensagens - Chat
app.delete('/conversas/:id/mensagens/:mensagemId', auth, async (req, res) => {
    try {
        const { id, mensagemId } = req.params;
        const alunoId = req.alunoId;

        if (
            !/^\d+$/.test(id) ||
            !/^\d+$/.test(mensagemId) ||
            BigInt(id) <= 0n ||
            BigInt(mensagemId) <= 0n
        ) {
            return res.status(400).json({
                mensagem: 'ID da conversa ou mensagem inválido.'
            });
        }

        const resultado = await db.query(
            `DELETE FROM mensagens AS m
             USING conversas c
             WHERE m.id = $1
                AND m.conversa_id = c.id
                AND c.id = $2
                AND m.remetente_id = $3

                AND EXISTS (
                    SELECT 1
                    FROM participantes_conversa pc
                    WHERE pc.conversa_id = c.id
                        AND pc.aluno_id = $3
                )

                AND (
                    SELECT COUNT(*)
                    FROM participantes_conversa pc
                    WHERE pc.conversa_id = c.id
                ) = 2

             RETURNING m.id`,
            [mensagemId, id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Mensagem não encontrada ou você não tem permissão para apagá-la.'
            });
        }

        return res.status(200).json({
            mensagem: 'Mensagem apagada com sucesso!',
            mensagemId: resultado.rows[0].id
        });

    } catch (erro) {
        console.error('Erro ao apagar mensagem:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao apagar mensagem.'
        });
    }
});

//Editar Mensagens - Chat
app.put('/conversas/:id/mensagens/:mensagemId', auth, async (req, res) => {
    try {
        const { id, mensagemId } = req.params;
        const { conteudo } = req.body;
        const alunoId = req.alunoId;

        if (
            !/^\d+$/.test(id) ||
            !/^\d+$/.test(mensagemId) ||
            BigInt(id) <= 0n ||
            BigInt(mensagemId) <= 0n
        ) {
            return res.status(400).json({
                mensagem: 'ID da conversa ou mensagem inválido.'
            });
        }

        if (typeof conteudo !== 'string' || !conteudo.trim()) {
            return res.status(400).json({
                mensagem: 'A mensagem não pode ficar vazia.'
            });
        }

        if (conteudo.trim().length > 5000) {
            return res.status(400).json({
                mensagem: 'A mensagem deve ter no máximo 5000 caracteres.'
            });
        }

        const resultado = await db.query(
            `UPDATE mensagens AS m
             SET conteudo = $1
             FROM conversas c
             WHERE m.id = $2
                AND m.conversa_id = c.id
                AND c.id = $3
                AND m.remetente_id = $4

                AND EXISTS (
                    SELECT 1
                    FROM participantes_conversa pc
                    WHERE pc.conversa_id = c.id
                        AND pc.aluno_id = $4
                )

                AND (
                    SELECT COUNT(*)
                    FROM participantes_conversa pc
                    WHERE pc.conversa_id = c.id
                ) = 2

             RETURNING
                m.id,
                m.conversa_id,
                m.remetente_id,
                m.conteudo,
                m.criada_em,
                m.lida_em`,
            [conteudo.trim(), mensagemId, id, alunoId]
        );

        if (resultado.rowCount === 0) {
            return res.status(404).json({
                mensagem: 'Mensagem não encontrada ou você não tem permissão para editá-la.'
            });
        }

        return res.status(200).json({
            mensagem: 'Mensagem editada com sucesso!',
            dados: resultado.rows[0]
        });

    } catch (erro) {
        console.error('Erro ao editar mensagem:', erro);

        return res.status(500).json({
            mensagem: 'Erro ao editar mensagem.'
        });
    }
});

app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
});