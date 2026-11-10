import { useEffect, useState } from 'react'
import NavFeed from '../../components/NavFeed'
import api from '../../services/api'

function Chat() {
    const alunoLogado = JSON.parse(sessionStorage.getItem('aluno') || 'null')
    const [conversas, setConversas] = useState([])
    const [carregando, setCarregando] = useState(true)
    const [pesquisa, setPesquisa] = useState('')
    const [alunosEncontrados, setAlunosEncontrados] = useState([])
    const [pesquisando, setPesquisando] = useState(false)
    const [conversaSelecionada, setConversaSelecionada] = useState(null)
    const [mensagens, setMensagens] = useState([])
    const [carregandoMensagens, setCarregandoMensagens] = useState(false)
    const [textoMensagem, setTextoMensagem] = useState('')
    const [enviandoMensagem, setEnviandoMensagem] = useState(false)
    const [mensagemEditando, setMensagemEditando] = useState(null)
    const [textoEdicao, setTextoEdicao] = useState('')
    const [salvandoEdicao, setSalvandoEdicao] = useState(false)
    const [mensagemExcluindo, setMensagemExcluindo] = useState(null)

    async function buscarConversas() {
        try {
            const resposta = await api.get('/conversas')
            setConversas(resposta.data)
        } catch (erro) {
            console.error('Erro ao buscar conversas:', erro)
        } finally {
            setCarregando(false)
        }
    }

    useEffect(() => {
        buscarConversas()
    }, [])

    async function buscarAlunos(nome) {
        if (!nome.trim()) {
            setAlunosEncontrados([])
            setPesquisando(false)
            return
        }

        try {
            setPesquisando(true)

            const resposta = await api.get('/alunos/buscar', {
                params: { nome }
            })

            setAlunosEncontrados(resposta.data)
        } catch (erro) {
            console.error('Erro ao pesquisar alunos:', erro)
            setAlunosEncontrados([])
        } finally {
            setPesquisando(false)
        }
    }

    async function carregarMensagens(conversaId) {
        const resposta = await api.get(
            `/conversas/${conversaId}/mensagens`
        )

        setMensagens(resposta.data)

        await api.patch(
            `/conversas/${conversaId}/mensagens/lidas`
        )
    }

    async function abrirConversa(aluno) {
        try {
            setCarregandoMensagens(true)
            setMensagens([])
            setTextoMensagem('')
            setMensagemEditando(null)

            const resposta = await api.post(`/conversas/${aluno.id}`)

            const conversaId = resposta.data.conversaId

            setConversaSelecionada({
                id: conversaId,
                outroAluno: resposta.data.outroAluno
            })

            await carregarMensagens(conversaId)
            await buscarConversas()

        } catch (erro) {
            console.error('Erro ao abrir conversa:', erro)
        } finally {
            setCarregandoMensagens(false)
        }
    }

    async function selecionarConversa(conversa) {
        try {
            setCarregandoMensagens(true)
            setMensagens([])
            setTextoMensagem('')
            setMensagemEditando(null)

            setConversaSelecionada({
                id: conversa.conversa_id,
                outroAluno: {
                    id: conversa.outro_aluno_id,
                    nome: conversa.outro_aluno_nome
                }
            })

            await carregarMensagens(conversa.conversa_id)
            await buscarConversas()

        } catch (erro) {
            console.error('Erro ao selecionar conversa:', erro)
        } finally {
            setCarregandoMensagens(false)
        }
    }

    async function enviarMensagem(e) {
        e.preventDefault()

        const conteudo = textoMensagem.trim()

        if (!conteudo || !conversaSelecionada || enviandoMensagem) {
            return
        }

        try {
            setEnviandoMensagem(true)

            await api.post(
                `/conversas/${conversaSelecionada.id}/mensagens`,
                { conteudo }
            )

            setTextoMensagem('')

            const resposta = await api.get(
                `/conversas/${conversaSelecionada.id}/mensagens`
            )

            setMensagens(resposta.data)
            await buscarConversas()

        } catch (erro) {
            console.error('Erro ao enviar mensagem:', erro)
        } finally {
            setEnviandoMensagem(false)
        }
    }

    function iniciarEdicao(mensagem) {
        setMensagemEditando(mensagem.id)
        setTextoEdicao(mensagem.conteudo)
    }

    function cancelarEdicao() {
        setMensagemEditando(null)
        setTextoEdicao('')
    }

    async function salvarEdicao(mensagemId) {
        const conteudo = textoEdicao.trim()

        if (!conteudo || salvandoEdicao) {
            return
        }

        try {
            setSalvandoEdicao(true)

            await api.put(
                `/conversas/${conversaSelecionada.id}/mensagens/${mensagemId}`,
                { conteudo }
            )

            const resposta = await api.get(
                `/conversas/${conversaSelecionada.id}/mensagens`
            )

            setMensagens(resposta.data)
            cancelarEdicao()

            await buscarConversas()

        } catch (erro) {
            console.error('Erro ao editar mensagem:', erro)
            alert('Não foi possível editar a mensagem.')
        } finally {
            setSalvandoEdicao(false)
        }
    }

    async function excluirMensagem(mensagemId) {
        const confirmar = window.confirm(
            'Tem certeza que deseja excluir esta mensagem?'
        )

        if (!confirmar || mensagemExcluindo) {
            return
        }

        try {
            setMensagemExcluindo(mensagemId)

            await api.delete(
                `/conversas/${conversaSelecionada.id}/mensagens/${mensagemId}`
            )

            setMensagens((anteriores) =>
                anteriores.filter((mensagem) => mensagem.id !== mensagemId)
            )

            await buscarConversas()

        } catch (erro) {
            console.error('Erro ao excluir mensagem:', erro)
            alert('Não foi possível excluir a mensagem.')
        } finally {
            setMensagemExcluindo(null)
        }
    }

    function formatarHorario(data) {
        if (!data) return ''

        return new Date(data).toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="min-h-screen bg-[#f4f5f7]">
            <NavFeed />

            <main className="mx-auto max-w-7xl px-4 pb-10 pt-32 sm:px-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Mensagens
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Converse e compartilhe ideias com outros alunos.
                    </p>
                </div>

                <div className="grid min-h-[650px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm md:grid-cols-[330px_1fr]">
                    <aside className="flex flex-col border-b border-gray-200 md:border-b-0 md:border-r">

                        <div className="border-b border-gray-100 p-5">
                            <h2 className="mb-4 font-semibold text-gray-800">
                                Suas conversas
                            </h2>

                            <div className="flex items-center gap-3 rounded-xl bg-gray-100 px-4 py-3 transition focus-within:ring-2 focus-within:ring-red-700/20">
                                <span className="text-xl text-gray-400">
                                    ⌕
                                </span>

                                <input
                                    type="text"
                                    placeholder="Buscar alunos..."
                                    value={pesquisa}
                                    onChange={(e) => {
                                        const nome = e.target.value
                                        setPesquisa(nome)
                                        buscarAlunos(nome)
                                    }}
                                    className="w-full bg-transparent text-sm outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3">

                            {pesquisa.trim() ? (
                                <>
                                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Resultados
                                    </p>

                                    {pesquisando ? (
                                        <p className="p-3 text-sm text-gray-500">
                                            Pesquisando alunos...
                                        </p>
                                    ) : alunosEncontrados.length === 0 ? (
                                        <p className="p-3 text-sm text-gray-500">
                                            Nenhum aluno encontrado.
                                        </p>
                                    ) : (
                                        alunosEncontrados.map((aluno) => (
                                            <button
                                                key={aluno.id}
                                                onClick={() => abrirConversa(aluno)}
                                                className="flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-gray-100"
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-100 font-bold text-red-800">
                                                    {aluno.nome?.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate font-semibold text-gray-800">
                                                        {aluno.nome}
                                                    </p>

                                                    <p className="text-xs text-gray-500">
                                                        RM: {aluno.rm}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </>
                            ) : (
                                <>
                                    <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                        Recentes
                                    </p>

                                    {carregando ? (
                                        <p className="p-3 text-sm text-gray-500">
                                            Carregando conversas...
                                        </p>
                                    ) : conversas.length === 0 ? (
                                        <p className="p-3 text-sm text-gray-500">
                                            Você ainda não possui conversas.
                                        </p>
                                    ) : (
                                        conversas.map((conversa) => (
                                            <button
                                                key={conversa.conversa_id}
                                                onClick={() => selecionarConversa(conversa)}
                                                className={`mb-1 flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                                                    conversaSelecionada?.id === conversa.conversa_id
                                                        ? 'bg-red-50'
                                                        : 'hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-200 font-bold text-gray-600">
                                                    {conversa.outro_aluno_nome?.charAt(0).toUpperCase()}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className="truncate font-semibold text-gray-800">
                                                            {conversa.outro_aluno_nome}
                                                        </p>

                                                        {Number(conversa.mensagens_nao_lidas) > 0 && (
                                                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-700 px-1.5 text-xs font-semibold text-white">
                                                                {conversa.mensagens_nao_lidas}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <p className="mt-1 truncate text-xs text-gray-500">
                                                        {conversa.ultima_mensagem || 'Nenhuma mensagem ainda'}
                                                    </p>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </>
                            )}
                        </div>
                    </aside>

                    <section className="flex min-h-[550px] flex-col bg-[#fafafa]">
                        {conversaSelecionada ? (
                            <>
                                <header className="flex items-center gap-3 border-b border-gray-200 bg-white px-6 py-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 font-bold text-red-800">
                                        {conversaSelecionada.outroAluno.nome?.charAt(0).toUpperCase()}
                                    </div>

                                    <div>
                                        <h2 className="font-semibold text-gray-800">
                                            {conversaSelecionada.outroAluno.nome}
                                        </h2>

                                        <p className="text-xs text-gray-500">
                                            Aluno Integra+
                                        </p>
                                    </div>
                                </header>

                                <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-6 sm:px-8">

                                    {carregandoMensagens ? (
                                        <p className="m-auto text-sm text-gray-500">
                                            Carregando mensagens...
                                        </p>
                                    ) : mensagens.length === 0 ? (
                                        <div className="m-auto text-center">
                                            <div className="mb-3 text-5xl text-gray-300">
                                                ✉
                                            </div>

                                            <h3 className="font-semibold text-gray-700">
                                                Inicie uma conversa
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Envie a primeira mensagem!
                                            </p>
                                        </div>
                                    ) : (
                                        mensagens.map((mensagem) => {
                                            const minhaMensagem =
                                                Number(mensagem.remetente_id) ===
                                                Number(alunoLogado?.id)

                                            const editando =
                                                mensagemEditando === mensagem.id

                                            return (
                                                <div
                                                    key={mensagem.id}
                                                    className={`flex w-full ${
                                                        minhaMensagem
                                                            ? 'justify-end'
                                                            : 'justify-start'
                                                    }`}
                                                >
                                                    <div
                                                        className={`group max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[70%] ${
                                                            minhaMensagem
                                                                ? 'rounded-br-sm bg-red-700 text-white'
                                                                : 'rounded-bl-sm border border-gray-200 bg-white text-gray-800'
                                                        }`}
                                                    >
                                                        {!minhaMensagem && (
                                                            <p className="mb-1 text-xs font-semibold text-red-700">
                                                                {mensagem.remetente_nome}
                                                            </p>
                                                        )}

                                                        {editando ? (
                                                            <div className="min-w-[200px]">
                                                                <textarea
                                                                    value={textoEdicao}
                                                                    onChange={(e) => setTextoEdicao(e.target.value)}
                                                                    maxLength={5000}
                                                                    rows={3}
                                                                    className="w-full resize-none rounded-lg border border-white/30 bg-white p-2 text-sm text-gray-800 outline-none"
                                                                />

                                                                <div className="mt-2 flex justify-end gap-2">
                                                                    <button
                                                                        onClick={cancelarEdicao}
                                                                        className="rounded-lg px-3 py-1 text-xs text-white/80 transition hover:bg-white/10"
                                                                    >
                                                                        Cancelar
                                                                    </button>

                                                                    <button
                                                                        onClick={() => salvarEdicao(mensagem.id)}
                                                                        disabled={!textoEdicao.trim() || salvandoEdicao}
                                                                        className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-gray-100 disabled:opacity-50"
                                                                    >
                                                                        {salvandoEdicao ? 'Salvando...' : 'Salvar'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                                                                    {mensagem.conteudo}
                                                                </p>

                                                                <div className={`mt-2 flex items-center justify-between gap-4 ${
                                                                    minhaMensagem
                                                                        ? 'text-red-100'
                                                                        : 'text-gray-400'
                                                                }`}>
                                                                    <span className="text-[10px]">
                                                                        {formatarHorario(mensagem.criada_em)}
                                                                    </span>

                                                                    {minhaMensagem && (
                                                                        <div className="flex items-center gap-2 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                                                                            <button
                                                                                onClick={() => iniciarEdicao(mensagem)}
                                                                                className="text-xs transition hover:underline"
                                                                                title="Editar mensagem"
                                                                            >
                                                                                Editar
                                                                            </button>

                                                                            <button
                                                                                onClick={() => excluirMensagem(mensagem.id)}
                                                                                disabled={mensagemExcluindo === mensagem.id}
                                                                                className="text-xs transition hover:underline disabled:opacity-50"
                                                                                title="Excluir mensagem"
                                                                            >
                                                                                {mensagemExcluindo === mensagem.id ? 'Excluindo...' : 'Excluir'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })
                                    )}
                                </div>

                                <form
                                    onSubmit={enviarMensagem}
                                    className="border-t border-gray-200 bg-white p-4 sm:px-6"
                                >
                                    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-2 transition focus-within:border-red-700">
                                        <input
                                            type="text"
                                            placeholder="Escreva sua mensagem..."
                                            value={textoMensagem}
                                            onChange={(e) => setTextoMensagem(e.target.value)}
                                            maxLength={5000}
                                            disabled={enviandoMensagem || carregandoMensagens}
                                            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                                        />

                                        <button
                                            type="submit"
                                            disabled={
                                                !textoMensagem.trim() ||
                                                enviandoMensagem ||
                                                carregandoMensagens
                                            }
                                            className="rounded-lg bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {enviandoMensagem ? 'Enviando...' : 'Enviar'}
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="flex flex-1 items-center justify-center p-6">
                                <div className="text-center">
                                    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-4xl text-red-700">
                                        ✉
                                    </div>

                                    <h2 className="text-xl font-bold text-gray-800">
                                        Suas mensagens
                                    </h2>

                                    <p className="mt-2 max-w-xs text-sm leading-relaxed text-gray-500">
                                        Escolha uma conversa ou pesquise um aluno para começar a trocar ideias.
                                    </p>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </div>
    )
}

export default Chat