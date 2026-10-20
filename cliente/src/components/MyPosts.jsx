
import { useEffect, useState } from 'react'
import api from '../services/api'

function MyPosts() {
    const [posts, setPosts] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')
    const [excluindo, setExcluindo] = useState(null)
    const [postEditando, setPostEditando] = useState(null)
    const [novoConteudo, setNovoConteudo] = useState('')
    const [salvando, setSalvando] = useState(false)
    const [curtidas, setCurtidas] = useState({})
    const [comentarios, setComentarios] = useState({})
    const [comentariosAbertos, setComentariosAbertos] = useState({})
    const [comentariosCarregando, setComentariosCarregando] = useState({})
    const [textoComentario, setTextoComentario] = useState({})
    const [comentarioEnviando, setComentarioEnviando] = useState({})
    const [comentarioExcluindo, setComentarioExcluindo] = useState({})

    const aluno = JSON.parse(
        sessionStorage.getItem('aluno') || 'null'
    )

    async function buscarCurtidas(postId) {
        try {
            const resposta = await api.get(
                `/posts/${postId}/curtidas`,
                {
                    params: aluno?.id
                        ? { aluno_id: aluno.id }
                        : {}
                }
            )

            setCurtidas((estadoAtual) => ({
                ...estadoAtual,
                [postId]: resposta.data
            }))
        } catch (erro) {
            console.error('Erro ao buscar curtidas:', erro)
        }
    }

    async function buscarComentarios(postId) {
        try {
            setComentariosCarregando((estadoAtual) => ({
                ...estadoAtual,
                [postId]: true
            }))

            const resposta = await api.get(
                `/posts/${postId}/comentarios`
            )

            setComentarios((estadoAtual) => ({
                ...estadoAtual,
                [postId]: resposta.data
            }))
        } catch (erro) {
            console.error('Erro ao buscar comentários:', erro)

            setErro('Não foi possível carregar os comentários.')
        } finally {
            setComentariosCarregando((estadoAtual) => ({
                ...estadoAtual,
                [postId]: false
            }))
        }
    }

    async function buscarMinhasPostagens() {
        if (!aluno?.id) {
            setErro('Não foi possível identificar o aluno.')
            setCarregando(false)
            return
        }

        try {
            setCarregando(true)
            setErro('')

            const resposta = await api.get(
                `/minhas-postagens`
            )

            setPosts(resposta.data)

            await Promise.all(
                resposta.data.map((post) =>
                    buscarCurtidas(post.id)
                )
            )
        } catch (erro) {
            console.error(erro)

            setErro(
                erro.response?.data?.mensagem ||
                'Não foi possível carregar suas publicações.'
            )
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        buscarMinhasPostagens()
    }, [aluno?.id])

    function iniciarEdicao(post) {
        setPostEditando(post.id)
        setNovoConteudo(post.conteudo)
        setErro('')
        setMensagem('')
    }

    function cancelarEdicao() {
        setPostEditando(null)
        setNovoConteudo('')
        setErro('')
    }

    async function salvarEdicao(postId) {
        if (!novoConteudo.trim()) {
            setErro('A publicação não pode ficar vazia.')
            return
        }

        try {
            setSalvando(true)
            setErro('')
            setMensagem('')

            const resposta = await api.put(
                `/posts/${postId}`,
                {
                    conteudo: novoConteudo.trim()
                }
            )

            setPosts((postsAtuais) =>
                postsAtuais.map((post) =>
                    String(post.id) === String(postId)
                        ? resposta.data.post
                        : post
                )
            )

            setPostEditando(null)
            setNovoConteudo('')
            setMensagem('Publicação editada com sucesso!')
        } catch (erro) {
            console.error(erro)

            setErro(
                erro.response?.data?.mensagem ||
                erro.response?.data?.erro ||
                'Não foi possível editar a publicação.'
            )
        } finally {
            setSalvando(false)
        }
    }

    async function excluirPost(postId) {
        const confirmar = window.confirm(
            'Tem certeza que deseja excluir esta publicação?'
        )

        if (!confirmar) return

        try {
            setExcluindo(postId)
            setErro('')
            setMensagem('')

            await api.delete(`/posts/${postId}`)

            setPosts((postsAtuais) =>
                postsAtuais.filter(
                    (post) => String(post.id) !== String(postId)
                )
            )

            setCurtidas((atual) => {
                const copia = { ...atual }
                delete copia[postId]
                return copia
            })

            setComentarios((atual) => {
                const copia = { ...atual }
                delete copia[postId]
                return copia
            })

            setComentariosAbertos((atual) => {
                const copia = { ...atual }
                delete copia[postId]
                return copia
            })

            setMensagem('Publicação excluída com sucesso!')
        } catch (erro) {
            console.error(erro)

            setErro(
                erro.response?.data?.mensagem ||
                erro.response?.data?.erro ||
                'Não foi possível excluir a publicação.'
            )
        } finally {
            setExcluindo(null)
        }
    }

    async function alternarCurtida(postId) {
        if (!aluno?.id) {
            setErro('Faça login para curtir uma publicação.')
            return
        }

        try {
            setErro('')

            const jaCurtiu = curtidas[postId]?.curtido

            if (jaCurtiu) {
                await api.delete(
                    `/posts/${postId}/curtidas`,
                    {
                        data: {
                            aluno_id: aluno.id
                        }
                    }
                )
            } else {
                await api.post(
                    `/posts/${postId}/curtidas`,
                    {
                        aluno_id: aluno.id
                    }
                )
            }

            await buscarCurtidas(postId)
        } catch (erro) {
            console.error('Erro ao alterar curtida:', erro)

            setErro(
                erro.response?.data?.erro ||
                erro.response?.data?.mensagem ||
                'Não foi possível atualizar a curtida.'
            )
        }
    }

    async function alternarComentarios(postId) {
        const estaAberto = comentariosAbertos[postId]

        setComentariosAbertos((atual) => ({
            ...atual,
            [postId]: !estaAberto
        }))

        if (!estaAberto) {
            await buscarComentarios(postId)
        }
    }

    async function publicarComentario(e, postId) {
        e.preventDefault()

        const texto = textoComentario[postId]?.trim()

        if (!texto) return

        if (!aluno?.id) {
            setErro('Faça login para comentar.')
            return
        }

        try {
            setErro('')

            setComentarioEnviando((atual) => ({
                ...atual,
                [postId]: true
            }))

            await api.post(
                `/posts/${postId}/comentarios`,
                {
                    aluno_id: aluno.id,
                    conteudo: texto
                }
            )

            setTextoComentario((atual) => ({
                ...atual,
                [postId]: ''
            }))

            await buscarComentarios(postId)
        } catch (erro) {
            console.error('Erro ao publicar comentário:', erro)

            setErro(
                erro.response?.data?.erro ||
                erro.response?.data?.mensagem ||
                'Não foi possível publicar o comentário.'
            )
        } finally {
            setComentarioEnviando((atual) => ({
                ...atual,
                [postId]: false
            }))
        }
    }

    async function excluirComentario(comentarioId, postId) {
        if (!aluno?.id) {
            setErro('Faça login para excluir um comentário.')
            return
        }

        const confirmar = window.confirm(
            'Tem certeza que deseja excluir este comentário?'
        )

        if (!confirmar) return

        try {
            setErro('')
            setMensagem('')

            setComentarioExcluindo((atual) => ({
                ...atual,
                [comentarioId]: true
            }))

            await api.delete(
                `/comentarios/${comentarioId}`,
                {
                    data: {
                        aluno_id: aluno.id
                    }
                }
            )

            setComentarios((estadoAtual) => ({
                ...estadoAtual,
                [postId]: (estadoAtual[postId] || []).filter(
                    (comentario) =>
                        String(comentario.id) !== String(comentarioId)
                )
            }))

            setMensagem('Comentário excluído com sucesso!')
        } catch (erro) {
            console.error('Erro ao excluir comentário:', erro)

            setErro(
                erro.response?.data?.erro ||
                erro.response?.data?.mensagem ||
                'Não foi possível excluir o comentário.'
            )
        } finally {
            setComentarioExcluindo((atual) => ({
                ...atual,
                [comentarioId]: false
            }))
        }
    }

    function formatarData(data) {
        return new Date(data).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        })
    }

    return (
        <div className="mx-auto max-w-3xl">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Minhas postagens
                </h1>

                <p className="mt-1 text-gray-500">
                    Veja o que você compartilhou.
                </p>
            </div>

            {erro && (
                <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {erro}
                </p>
            )}

            {mensagem && (
                <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    {mensagem}
                </p>
            )}

            {carregando ? (
                <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
                    <p className="text-gray-500">
                        Carregando suas postagens...
                    </p>
                </div>
            ) : posts.length === 0 ? (
                <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
                    <h2 className="font-bold text-gray-800">
                        Você ainda não publicou nada
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        Suas postagens aparecerão aqui quando você publicar.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <article
                            key={post.id}
                            className="rounded-2xl bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a10b00] font-bold text-white">
                                    {aluno?.nome?.charAt(0)?.toUpperCase() || 'U'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="font-bold text-gray-900">
                                                {aluno?.nome}
                                            </h2>

                                            <span className="text-xs text-gray-400">
                                                {formatarData(post.criado_em)}
                                            </span>
                                        </div>

                                        {postEditando !== post.id && (
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => iniciarEdicao(post)}
                                                    disabled={excluindo === post.id}
                                                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => excluirPost(post.id)}
                                                    disabled={excluindo === post.id}
                                                    className="rounded-full border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                                >
                                                    {excluindo === post.id
                                                        ? 'Excluindo...'
                                                        : 'Excluir'}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {postEditando === post.id ? (
                                        <div className="mt-4">
                                            <textarea
                                                value={novoConteudo}
                                                onChange={(e) =>
                                                    setNovoConteudo(e.target.value)
                                                }
                                                maxLength={2000}
                                                disabled={salvando}
                                                className="min-h-[100px] w-full resize-y rounded-xl border border-gray-200 p-4 text-sm outline-none transition focus:border-[#a10b00] disabled:opacity-60"
                                            />

                                            <div className="mt-3 flex flex-wrap justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={cancelarEdicao}
                                                    disabled={salvando}
                                                    className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                                                >
                                                    Cancelar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => salvarEdicao(post.id)}
                                                    disabled={salvando || !novoConteudo.trim()}
                                                    className="rounded-full bg-[#a10b00] px-5 py-2 text-sm font-bold text-white transition hover:bg-[#850900] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {salvando
                                                        ? 'Salvando...'
                                                        : 'Salvar alterações'}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                            {post.conteudo}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {postEditando !== post.id && (
                                <>
                                    <div className="mt-4 flex items-center gap-6 border-t border-gray-100 pt-3">
                                        <button
                                            type="button"
                                            onClick={() => alternarCurtida(post.id)}
                                            className={`flex items-center gap-2 text-sm transition ${
                                                curtidas[post.id]?.curtido
                                                    ? 'font-semibold text-[#a10b00]'
                                                    : 'text-gray-500 hover:text-[#a10b00]'
                                            }`}
                                        >
                                            <span>
                                                {curtidas[post.id]?.curtido
                                                    ? '❤️'
                                                    : '🤍'}
                                            </span>

                                            <span>
                                                {curtidas[post.id]?.total ?? 0}{' '}

                                                {(curtidas[post.id]?.total ?? 0) === 1
                                                    ? 'curtida'
                                                    : 'curtidas'}
                                            </span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => alternarComentarios(post.id)}
                                            className="flex items-center gap-2 text-sm text-gray-500 transition hover:text-[#a10b00]"
                                        >
                                            <span>💬</span>

                                            <span>
                                                {comentariosAbertos[post.id]
                                                    ? 'Fechar comentários'
                                                    : 'Comentários'}
                                            </span>
                                        </button>
                                    </div>

                                    {comentariosAbertos[post.id] && (
                                        <div className="mt-4 border-t border-gray-100 pt-4">
                                            {comentariosCarregando[post.id] ? (
                                                <p className="text-sm text-gray-500">
                                                    Carregando comentários...
                                                </p>
                                            ) : (
                                                <div className="space-y-4">
                                                    {(comentarios[post.id] || []).length === 0 ? (
                                                        <p className="text-sm text-gray-500">
                                                            Ainda não há comentários. Seja o primeiro!
                                                        </p>
                                                    ) : (
                                                        comentarios[post.id].map((comentario) => (
                                                            <div
                                                                key={comentario.id}
                                                                className="flex gap-3"
                                                            >
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-600">
                                                                    {comentario.autor
                                                                        ?.charAt(0)
                                                                        ?.toUpperCase() || 'U'}
                                                                </div>

                                                                <div className="min-w-0 flex-1 rounded-xl bg-gray-50 p-3">
                                                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                                        <span className="text-sm font-semibold text-gray-800">
                                                                            {comentario.autor}
                                                                        </span>

                                                                        <span className="text-xs text-gray-400">
                                                                            {formatarData(comentario.criado_em)}
                                                                        </span>

                                                                        {String(comentario.aluno_id) === String(aluno?.id) && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={() =>
                                                                                    excluirComentario(
                                                                                        comentario.id,
                                                                                        post.id
                                                                                    )
                                                                                }
                                                                                disabled={comentarioExcluindo[comentario.id]}
                                                                                className="text-xs text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                                            >
                                                                                {comentarioExcluindo[comentario.id]
                                                                                    ? 'Excluindo...'
                                                                                    : 'Excluir'}
                                                                            </button>
                                                                        )}
                                                                    </div>

                                                                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-700">
                                                                        {comentario.conteudo}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}

                                            <form
                                                onSubmit={(e) =>
                                                    publicarComentario(e, post.id)
                                                }
                                                className="mt-4 flex items-center gap-2"
                                            >
                                                <input
                                                    type="text"
                                                    value={textoComentario[post.id] || ''}
                                                    onChange={(e) =>
                                                        setTextoComentario((atual) => ({
                                                            ...atual,
                                                            [post.id]: e.target.value
                                                        }))
                                                    }
                                                    placeholder="Escreva um comentário..."
                                                    maxLength={1000}
                                                    className="min-w-0 flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none transition focus:border-[#a10b00]"
                                                />

                                                <button
                                                    type="submit"
                                                    disabled={
                                                        comentarioEnviando[post.id] ||
                                                        !textoComentario[post.id]?.trim()
                                                    }
                                                    className="rounded-full bg-[#a10b00] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#850900] disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {comentarioEnviando[post.id]
                                                        ? 'Enviando...'
                                                        : 'Enviar'}
                                                </button>
                                            </form>
                                        </div>
                                    )}
                                </>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyPosts