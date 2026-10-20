 import { useEffect, useState } from 'react'
import api from '../services/api'

function Posts() {
    const [conteudo, setConteudo] = useState('')
    const [posts, setPosts] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [publicando, setPublicando] = useState(false)
    const [erro, setErro] = useState('')
    const [mensagem, setMensagem] = useState('')
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
                `/posts/${postId}/curtidas`
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

    async function buscarPosts() {
        try {
            setCarregando(true)
            setErro('')

            const resposta = await api.get('/posts')

            setPosts(resposta.data)

            await Promise.all(
                resposta.data.map((post) =>
                    buscarCurtidas(post.id)
                )
            )
        } catch (erro) {
            console.error(erro)

            setErro('Não foi possível carregar as publicações.')
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        buscarPosts()
    }, [])

    async function publicarPost(e) {
        e.preventDefault()

        if (!conteudo.trim()) {
            setErro('Digite algo antes de publicar.')
            return
        }

        if (!aluno) {
            setErro('Faça login para publicar.')
            return
        }

        try {
            setPublicando(true)
            setErro('')
            setMensagem('')

            await api.post('/posts', {
                conteudo: conteudo.trim()
            })

            setConteudo('')
            setMensagem('Publicação criada com sucesso!')

            await buscarPosts()
        } catch (erro) {
            console.error(erro)

            setErro(
                erro.response?.data?.mensagem ||
                erro.response?.data?.erro ||
                'Não foi possível publicar.'
            )
        } finally {
            setPublicando(false)
        }
    }

    async function alternarCurtida(postId) {
        if (!aluno) {
            setErro('Faça login para curtir uma publicação.')
            return
        }

        try {
            setErro('')

            const jaCurtiu = curtidas[postId]?.curtido

            if (jaCurtiu) {
                await api.delete(
                    `/posts/${postId}/curtidas`
                )
            } else {
                await api.post(
                    `/posts/${postId}/curtidas`
                )
            }

            await buscarCurtidas(postId)
        } catch (erro) {
            console.error('Erro ao alterar curtida:', erro)

            setErro(
                erro.response?.data?.erro ||
                'Não foi possível atualizar a curtida.'
            )
        }
    }

    async function alternarComentarios(postId) {
        const estaAberto = comentariosAbertos[postId]

        setComentariosAbertos((estadoAtual) => ({
            ...estadoAtual,
            [postId]: !estaAberto
        }))

        if (!estaAberto) {
            await buscarComentarios(postId)
        }
    }

    async function publicarComentario(e, postId) {
        e.preventDefault()

        const texto = textoComentario[postId]?.trim()

        if (!texto) {
            return
        }

        if (!aluno) {
            setErro('Faça login para comentar.')
            return
        }

        try {
            setErro('')

            setComentarioEnviando((estadoAtual) => ({
                ...estadoAtual,
                [postId]: true
            }))

            await api.post(
                `/posts/${postId}/comentarios`,
                {
                    conteudo: texto
                }
            )

            setTextoComentario((estadoAtual) => ({
                ...estadoAtual,
                [postId]: ''
            }))

            await buscarComentarios(postId)
        } catch (erro) {
            console.error('Erro ao publicar comentário:', erro)

            setErro(
                erro.response?.data?.erro ||
                'Não foi possível publicar o comentário.'
            )
        } finally {
            setComentarioEnviando((estadoAtual) => ({
                ...estadoAtual,
                [postId]: false
            }))
        }
    }

    async function excluirComentario(comentarioId, postId) {
        if (!aluno) {
            setErro('Faça login para excluir um comentário.')
            return
        }

        const confirmar = window.confirm(
            'Tem certeza que deseja excluir este comentário?'
        )

        if (!confirmar) {
            return
        }

        try {
            setErro('')

            setComentarioExcluindo((estadoAtual) => ({
                ...estadoAtual,
                [comentarioId]: true
            }))

            await api.delete(
                `/comentarios/${comentarioId}`,
            )

            setComentarios((estadoAtual) => ({
                ...estadoAtual,
                [postId]: estadoAtual[postId].filter(
                    (comentario) =>
                        String(comentario.id) !== String(comentarioId)
                )
            }))
        } catch (erro) {
            console.error('Erro ao excluir comentário:', erro)

            setErro(
                erro.response?.data?.erro ||
                'Não foi possível excluir o comentário.'
            )
        } finally {
            setComentarioExcluindo((estadoAtual) => ({
                ...estadoAtual,
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
                    Feed
                </h1>

                <p className="mt-1 text-gray-500">
                    Veja o que está sendo compartilhado pela comunidade.
                </p>
            </div>

            <form
                onSubmit={publicarPost}
                className="rounded-2xl bg-white p-5 shadow-sm"
            >
                <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a10b00] font-bold text-white">
                        {aluno?.nome?.charAt(0)?.toUpperCase() || 'U'}
                    </div>

                    <div className="flex-1">
                        <textarea
                            value={conteudo}
                            onChange={(e) => setConteudo(e.target.value)}
                            placeholder="Compartilhe uma ideia, dúvida ou projeto..."
                            maxLength={2000}
                            className="min-h-[90px] w-full resize-none rounded-xl border border-gray-200 p-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#a10b00]"
                        />

                        <div className="mt-3 flex justify-end">
                            <button
                                type="submit"
                                disabled={publicando || !conteudo.trim()}
                                className="rounded-full bg-[#a10b00] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#850900] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {publicando ? 'Publicando...' : 'Publicar'}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {erro && (
                <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                    {erro}
                </p>
            )}

            {mensagem && (
                <p className="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-700">
                    {mensagem}
                </p>
            )}

            <div className="mt-6 space-y-4">
                {carregando ? (
                    <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
                        <p className="text-gray-500">
                            Carregando publicações...
                        </p>
                    </div>
                ) : posts.length === 0 ? (
                    <div className="rounded-2xl bg-white px-6 py-12 text-center shadow-sm">
                        <h2 className="font-bold text-gray-800">
                            Ainda não há postagens
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Seja o primeiro a compartilhar alguma coisa com a comunidade.
                        </p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <article
                            key={post.id}
                            className="rounded-2xl bg-white p-5 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a10b00] font-bold text-white">
                                    {post.autor?.charAt(0)?.toUpperCase() || 'U'}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <h2 className="font-bold text-gray-900">
                                            {post.autor}
                                        </h2>

                                        <span className="text-xs text-gray-400">
                                            {formatarData(post.criado_em)}
                                        </span>
                                    </div>

                                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
                                        {post.conteudo}
                                    </p>
                                </div>
                            </div>

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

                                        {curtidas[post.id]?.total === 1
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
                                            {comentarios[post.id]?.length === 0 ? (
                                                <p className="text-sm text-gray-500">
                                                    Ainda não há comentários. Seja o primeiro!
                                                </p>
                                            ) : (
                                                comentarios[post.id]?.map((comentario) => (
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
                                        onSubmit={(e) => publicarComentario(e, post.id)}
                                        className="mt-4 flex items-center gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={textoComentario[post.id] || ''}
                                            onChange={(e) =>
                                                setTextoComentario((estadoAtual) => ({
                                                    ...estadoAtual,
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
                        </article>
                    ))
                )}
            </div>
        </div>
    )
}

export default Posts