import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../../services/api'

function RedefinirSenha() {
    const [searchParams] = useSearchParams()
    const token = searchParams.get('token')
    const [novaSenha, setNovaSenha] = useState('')
    const [confirmarSenha, setConfirmarSenha] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')

    async function redefinirSenha() {

        if (!token) {
            setErro('Token de recuperação não encontrado.')
            setMensagem('')
            return
        }

        if (!novaSenha || !confirmarSenha) {
            setErro('Preencha todos os campos.')
            setMensagem('')
            return
        }

        if (novaSenha !== confirmarSenha) {
            setErro('A nova senha e a confirmação não são iguais.')
            setMensagem('')
            return
        }

        try {
            setCarregando(true)
            setErro('')
            setMensagem('')

            const resposta = await api.post('/redefinir-senha', {
                token,
                novaSenha,
                confirmarSenha
            })

            setMensagem(resposta.data.mensagem)

            setNovaSenha('')
            setConfirmarSenha('')
        } catch (erro) {
            console.error('Erro ao redefinir senha:', erro)

            setErro(
                erro.response?.data?.mensagem ||
                'Não foi possível redefinir sua senha.'
            )
        } finally {
            setCarregando(false)
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8] px-6">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Redefinir senha
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Digite sua nova senha abaixo.
                    </p>
                </div>

                {mensagem && (
                    <div className="mt-6 rounded-lg bg-green-100 px-4 py-3 text-green-700">
                        {mensagem}
                    </div>
                )}

                {erro && (
                    <div className="mt-6 rounded-lg bg-red-100 px-4 py-3 text-red-700">
                        {erro}
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-gray-700">
                            Nova senha
                        </label>

                        <input
                            type="password"
                            value={novaSenha}
                            onChange={(e) => setNovaSenha(e.target.value)}
                            placeholder="Digite sua nova senha"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00]"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700">
                            Confirmar nova senha
                        </label>

                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={(e) => setConfirmarSenha(e.target.value)}
                            placeholder="Digite novamente sua senha"
                            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00]"
                        />
                    </div>

                    <button
                        onClick={redefinirSenha}
                        disabled={carregando}
                        className="w-full rounded-lg bg-[#a10b00] px-5 py-3 font-semibold text-white transition hover:bg-[#850900] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {carregando
                            ? 'Alterando...'
                            : 'Alterar senha'
                        }
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        to="/login"
                        className="text-sm font-semibold text-[#a10b00] hover:underline"
                    >
                        Voltar para o login
                    </Link>
                </div>
            </div>
        </main>
    )
}

export default RedefinirSenha