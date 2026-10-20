import { useEffect, useState } from 'react'
import api from '../../services/api'
import MyPosts from '../../components/MyPosts'
import NavFeed from '../../components/NavFeed'

function Perfil() {
    const [aluno, setAluno] = useState(null)
    const [carregandoPerfil, setCarregandoPerfil] = useState(true)

    useEffect(() => {
        async function buscarPerfil() {
            try {
                const resposta = await api.get('/perfil')

                setAluno(resposta.data)

                sessionStorage.setItem(
                    'aluno',
                    JSON.stringify(resposta.data)
                )
            } catch (erro) {
                console.error('Erro ao buscar perfil:', erro)
            } finally {
                setCarregandoPerfil(false)
            }
        }

        buscarPerfil()
    }, [])

    const [email, setEmail] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')
    const [senhaAtual, setSenhaAtual] = useState('')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [alterandoSenha, setAlterandoSenha] = useState(false)
    const [mensagemSenha, setMensagemSenha] = useState('')
    const [erroSenha, setErroSenha] = useState('')

    useEffect(() => {
        if (aluno) {
            setEmail(aluno.email)
        }
    }, [aluno])

    if (carregandoPerfil) {
        return (
            <>
                <NavFeed />

                <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
                    <p className="text-gray-500">
                        Carregando perfil...
                    </p>
                </main>
            </>
        )
    }

    if (!aluno) {
        return (
            <>
                <NavFeed />

                <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
                    <p className="text-gray-500">
                        Não foi possível carregar o perfil.
                    </p>
                </main>
            </>
        )
    }

    async function alterarEmail() {
        if (!email.trim()) {
            setErro('Digite um e-mail.')
            setMensagem('')
            return
        }

        try {
            setCarregando(true)
            setMensagem('')
            setErro('')

            const resposta = await api.put('/perfil/email', {
                email: email.trim()
            })

            const alunoAtualizado = resposta.data.aluno

            setAluno(alunoAtualizado)

            sessionStorage.setItem(
                'aluno',
                JSON.stringify(alunoAtualizado)
            )

            setMensagem(resposta.data.mensagem)
        } catch (erro) {
            console.error('Erro ao alterar e-mail:', erro)

            setErro(
                erro.response?.data?.mensagem ||
                'Não foi possível alterar o e-mail.'
            )
        } finally {
            setCarregando(false)
        }
    }

    async function alterarSenha() {
        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setErroSenha('Preencha todos os campos.')
            setMensagemSenha('')
            return
        }

        if (novaSenha !== confirmarSenha) {
            setErroSenha('A nova senha e a confirmação não são iguais.')
            setMensagemSenha('')
            return
        }

        try {
            setAlterandoSenha(true)
            setMensagemSenha('')
            setErroSenha('')

            const resposta = await api.put('/perfil/senha', {
                senhaAtual,
                novaSenha,
                confirmarSenha
            })

            setMensagemSenha(resposta.data.mensagem)

            setSenhaAtual('')
            setNovaSenha('')
            setConfirmarSenha('')
        } catch (erro) {
            console.error('Erro ao alterar senha:', erro)

            setErroSenha(
                erro.response?.data?.mensagem ||
                'Não foi possível alterar a senha.'
            )
        } finally {
            setAlterandoSenha(false)
        }
    }

    return (
        <>
            <NavFeed />

            <main className="min-h-screen bg-[#f8f8f8] pt-20">
                <section className="mx-auto max-w-5xl px-6 py-10">

                    {/* Cabeçalho */}
                    <div className="mb-8">
                        <p className="text-sm font-semibold uppercase tracking-wider text-[#a10b00]">
                            Conta
                        </p>

                        <h1 className="mt-1 text-3xl font-bold text-gray-900">
                            Meu perfil
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Gerencie suas informações e acompanhe suas publicações.
                        </p>
                    </div>

                    {/* Informações da conta */}
                    <div className="rounded-2xl bg-white p-8 shadow-sm">
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                Informações da conta
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Algumas informações são somente para visualização.
                            </p>
                        </div>

                        {/* Dados principais */}
                        <div className="mt-8 grid gap-6 md:grid-cols-2">

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">
                                    Nome
                                </p>

                                <p className="mt-2 text-lg font-medium text-gray-900">
                                    {aluno.nome}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">
                                    RM
                                </p>

                                <p className="mt-2 text-lg font-medium text-gray-900">
                                    {aluno.rm}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">
                                    Publicações
                                </p>

                                <p className="mt-2 text-2xl font-bold text-[#a10b00]">
                                    {aluno.quantidade_posts}
                                </p>
                            </div>

                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
                                <p className="text-sm font-semibold text-gray-500">
                                    Tipo de conta
                                </p>

                                <p className="mt-2 text-lg font-medium text-gray-900">
                                    {aluno.tipo === 'admin'
                                        ? 'Administrador'
                                        : 'Aluno'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* E-mail */}
                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <h2 className="text-xl font-bold text-gray-900">
                                E-mail
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Altere o endereço de e-mail associado à sua conta.
                            </p>

                            {mensagem && (
                                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {mensagem}
                                </div>
                            )}

                            {erro && (
                                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {erro}
                                </div>
                            )}

                            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00] focus:ring-2 focus:ring-[#a10b00]/10"
                                />

                                <button
                                    onClick={alterarEmail}
                                    disabled={carregando}
                                    className="rounded-lg bg-[#a10b00] px-6 py-3 font-semibold text-white transition hover:bg-[#850900] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {carregando
                                        ? 'Salvando...'
                                        : `Alterar email`
                                    }
                                </button>
                            </div>
                        </div>

                        <div className="mt-8 border-t border-gray-200 pt-8">
                            <h2 className="text-xl font-bold text-gray-900">
                                Segurança
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Altere sua senha para manter sua conta protegida.
                            </p>

                            {mensagemSenha && (
                                <div className="mt-5 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                                    {mensagemSenha}
                                </div>
                            )}

                            {erroSenha && (
                                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {erroSenha}
                                </div>
                            )}

                            <div className="mt-5 grid gap-4 md:grid-cols-3">
                                <input
                                    type="password"
                                    placeholder="Senha atual"
                                    value={senhaAtual}
                                    onChange={(e) => setSenhaAtual(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00] focus:ring-2 focus:ring-[#a10b00]/10"
                                />

                                <input
                                    type="password"
                                    placeholder="Nova senha"
                                    value={novaSenha}
                                    onChange={(e) => setNovaSenha(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00] focus:ring-2 focus:ring-[#a10b00]/10"
                                />

                                <input
                                    type="password"
                                    placeholder="Confirmar nova senha"
                                    value={confirmarSenha}
                                    onChange={(e) => setConfirmarSenha(e.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00] focus:ring-2 focus:ring-[#a10b00]/10"
                                />
                            </div>

                            <button
                                onClick={alterarSenha}
                                disabled={alterandoSenha}
                                className="mt-4 rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {alterandoSenha
                                    ? 'Alterando...'
                                    : 'Alterar senha'
                                }
                            </button>
                        </div>
                    </div>

                    <div className="mt-8 rounded-2xl bg-white p-8 shadow-sm">
                        <div className="border-b border-gray-200 pb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                Suas publicações
                            </h2>

                            <p className="mt-1 text-sm text-gray-500">
                                Veja e gerencie as publicações que você fez no Integra+.
                            </p>
                        </div>

                        <div className="mt-6">
                            <MyPosts />
                        </div>
                    </div>
                </section>
            </main>
        </>
    )
}

export default Perfil