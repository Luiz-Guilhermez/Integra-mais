import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

function RecuperarSenha() {
    const [email, setEmail] = useState('')
    const [carregando, setCarregando] = useState(false)
    const [mensagem, setMensagem] = useState('')
    const [erro, setErro] = useState('')

    async function recuperarSenha() {
        if (!email.trim()) {
            setErro('Digite seu e-mail.')
            setMensagem('')
            return
        }

        try {
            setCarregando(true)
            setErro('')
            setMensagem('')

            const resposta = await api.post('/recuperar-senha', {
                email: email.trim()
            })

            setMensagem(resposta.data.mensagem)
        } catch (erro) {
            console.error('Erro ao solicitar recuperação:', erro)

            setErro(
                erro.response?.data?.mensagem ||
                'Não foi possível solicitar a recuperação.'
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
                        Esqueci minha senha
                    </h1>

                    <p className="mt-2 text-gray-500">
                        Digite seu e-mail para recuperar sua senha.
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

                <div className="mt-8">
                    <label className="text-sm font-semibold text-gray-700">
                        E-mail
                    </label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Digite seu e-mail"
                        className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-[#a10b00]"
                    />

                    <button
                        onClick={recuperarSenha}
                        disabled={carregando}
                        className="mt-4 w-full rounded-lg bg-[#a10b00] px-5 py-3 font-semibold text-white transition hover:bg-[#850900] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {carregando
                            ? 'Enviando...'
                            : 'Enviar link de recuperação'
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

export default RecuperarSenha