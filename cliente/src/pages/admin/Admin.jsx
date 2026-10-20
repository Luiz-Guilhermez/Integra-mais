import { useEffect, useState } from 'react'
import api from '../../services/api'
import NavFeed from '../../components/NavFeed'

function Admin() {
    const [posts, setPosts] = useState([])
    const [alunos, setAlunos] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [carregandoAlunos, setCarregandoAlunos] = useState(true)
    const [erro, setErro] = useState('')
    const [erroAlunos, setErroAlunos] = useState('')
    const [excluindo, setExcluindo] = useState(null)

    async function buscarPosts() {
        try {
            setCarregando(true)
            setErro('')

            const resposta = await api.get('/admin/posts')

            setPosts(resposta.data)
        } catch (erro) {
            console.error('Erro ao buscar postagens:', erro)

            setErro(
                erro.response?.data?.mensagem ||
                'Não foi possível carregar as postagens.'
            )
        } finally {
            setCarregando(false)
        }
    }

    async function buscarAlunos() {
        try {
            setCarregandoAlunos(true)
            setErroAlunos('')

            const resposta = await api.get('/admin/alunos')

            setAlunos(resposta.data)
        } catch (erro) {
            console.error('Erro ao buscar alunos:', erro)

            setErroAlunos(
                erro.response?.data?.mensagem ||
                'Não foi possível carregar os alunos.'
            )
        } finally {
            setCarregandoAlunos(false)
        }
    }

    async function excluirPost(id) {
        const confirmar = window.confirm(
            'Tem certeza que deseja excluir esta publicação?'
        )

        if (!confirmar) {
            return
        }

        try {
            setExcluindo(id)
            setErro('')

            await api.delete(`/admin/posts/${id}`)

            setPosts((postsAtuais) =>
                postsAtuais.filter((post) => post.id !== id)
            )
        } catch (erro) {
            console.error('Erro ao excluir postagem:', erro)

            setErro(
                erro.response?.data?.mensagem ||
                'Não foi possível excluir a publicação.'
            )
        } finally {
            setExcluindo(null)
        }
    }

    useEffect(() => {
        buscarPosts()
        buscarAlunos()
    }, [])

    function formatarData(data) {
        return new Date(data).toLocaleString('pt-BR', {
            dateStyle: 'short',
            timeStyle: 'short'
        })
    }

    function formatarTipo(tipo) {
        return tipo === 'admin'
            ? 'Administrador'
            : 'Aluno'
    }

    return (
        <>
            <NavFeed />

            <main className="min-h-screen bg-[#f8f8f8] pt-20">
                <section className="mx-auto max-w-5xl px-6 py-10">
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-wider text-[#a10b00]">
                            Administração
                        </p>

                        <div className="mt-1">
                            <h1 className="text-3xl font-bold text-gray-900">
                                Painel Administrativo
                            </h1>

                            <p className="mt-2 text-gray-500">
                                Gerencie as publicações e os alunos do Integra+.
                            </p>
                        </div>
                    </div>

                    <div className="mb-8 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Publicações
                            </p>

                            <p className="mt-2 text-3xl font-bold text-[#a10b00]">
                                {carregando ? '—' : posts.length}
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                                Publicações na plataforma
                            </p>
                        </div>

                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">
                                Alunos cadastrados
                            </p>

                            <p className="mt-2 text-3xl font-bold text-[#a10b00]">
                                {carregandoAlunos ? '—' : alunos.length}
                            </p>

                            <p className="mt-1 text-sm text-gray-400">
                                Contas cadastradas
                            </p>
                        </div>
                    </div>

                    {erro && (
                        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                            {erro}
                        </div>
                    )}

                    <div>
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Publicações
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Gerencie as publicações realizadas pelos alunos.
                            </p>
                        </div>

                        {carregando && (
                            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                                <p className="text-gray-500">
                                    Carregando publicações...
                                </p>
                            </div>
                        )}

                        {!carregando && posts.length === 0 && !erro && (
                            <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                                    <span className="text-xl text-gray-400">
                                        —
                                    </span>
                                </div>

                                <h2 className="mt-5 text-xl font-semibold text-gray-800">
                                    Nenhuma publicação
                                </h2>

                                <p className="mx-auto mt-2 max-w-md text-gray-500">
                                    Ainda não existem publicações na plataforma.
                                </p>
                            </div>
                        )}

                        {!carregando && posts.length > 0 && (
                            <div className="space-y-5">
                                {posts.map((post) => (
                                    <article
                                        key={post.id}
                                        className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md"
                                    >
                                        <div className="flex flex-col justify-between gap-4 border-b border-gray-100 px-6 py-5 sm:flex-row sm:items-start">
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#a10b00] text-sm font-bold text-white">
                                                    {post.autor
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h2 className="font-semibold text-gray-900">
                                                        {post.autor}
                                                    </h2>

                                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                                                        <span>
                                                            RM: {post.rm}
                                                        </span>

                                                        <span className="hidden sm:inline">
                                                            •
                                                        </span>

                                                        <span>
                                                            {post.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <span className="text-sm text-gray-400 sm:text-right">
                                                {formatarData(post.criado_em)}
                                            </span>
                                        </div>

                                        <div className="px-6 py-6">
                                            <p className="whitespace-pre-wrap leading-7 text-gray-700">
                                                {post.conteudo}
                                            </p>
                                        </div>

                                        <div className="flex justify-end border-t border-gray-100 bg-gray-50 px-6 py-4">
                                            <button
                                                onClick={() => excluirPost(post.id)}
                                                disabled={excluindo === post.id}
                                                className="rounded-lg bg-[#a10b00] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#870900] disabled:cursor-not-allowed disabled:opacity-50"
                                            >
                                                {excluindo === post.id
                                                    ? 'Excluindo...'
                                                    : 'Excluir publicação'
                                                }
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-12">
                        <div className="mb-5">
                            <h2 className="text-2xl font-bold text-gray-900">
                                Alunos cadastrados
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Visualize as contas cadastradas no Integra+.
                            </p>
                        </div>

                        {erroAlunos && (
                            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                                {erroAlunos}
                            </div>
                        )}

                        {carregandoAlunos && (
                            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
                                <p className="text-gray-500">
                                    Carregando alunos...
                                </p>
                            </div>
                        )}

                        {!carregandoAlunos &&
                            alunos.length === 0 &&
                            !erroAlunos && (
                                <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
                                    <h2 className="text-xl font-semibold text-gray-800">
                                        Nenhum aluno cadastrado
                                    </h2>

                                    <p className="mt-2 text-gray-500">
                                        Ainda não existem contas cadastradas.
                                    </p>
                                </div>
                            )}

                        {!carregandoAlunos && alunos.length > 0 && (
                            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                                <div className="divide-y divide-gray-100">
                                    {alunos.map((aluno) => (
                                        <div
                                            key={aluno.id}
                                            className="flex flex-col gap-4 px-6 py-5 transition hover:bg-gray-50 md:flex-row md:items-center md:justify-between"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                                                    {aluno.nome
                                                        ?.charAt(0)
                                                        .toUpperCase()}
                                                </div>

                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {aluno.nome}
                                                    </h3>

                                                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                                                        <span>
                                                            RM: {aluno.rm}
                                                        </span>

                                                        <span className="hidden sm:inline">
                                                            •
                                                        </span>

                                                        <span>
                                                            {aluno.email}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-start gap-1 md:items-end">
                                                <span
                                                    className={
                                                        aluno.tipo === 'admin'
                                                            ? 'rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-[#a10b00]'
                                                            : 'rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600'
                                                    }
                                                >
                                                    {formatarTipo(aluno.tipo)}
                                                </span>

                                                <span className="text-xs text-gray-400">
                                                    Cadastro:{' '}
                                                    {formatarData(aluno.criado_em)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </>
    )
}

export default Admin