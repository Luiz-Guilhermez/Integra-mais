import { Link, useNavigate } from 'react-router-dom'

function NavFeed() {
    const navigate = useNavigate()
    const aluno = JSON.parse(sessionStorage.getItem('aluno'))

    function sair() {
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('aluno')

        navigate('/login')
    }

    return (
        <nav className="fixed w-full z-30 flex h-24 items-center justify-between bg-white px-10 lg:px-16">
            <Link to="/">
                <h2 className="text-2xl font-bold text-black">
                    Integra<span className="text-[#a10b00]">+</span>
                </h2>
            </Link>

            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
                <Link
                    to="/"
                    className="text-lg text-black transition hover:text-[#a10b00]"
                >
                    Home
                </Link>

                <Link
                    to="/feed"
                    className="text-lg text-black transition hover:text-[#a10b00]"
                >
                    Feed
                </Link>

                {aluno?.tipo === 'admin' && (
                    <Link
                        to="/admin"
                        className="text-lg text-black transition hover:text-[#a10b00]"
                    >
                        Painel Admin
                    </Link>
                )}
            </div>

            <div className="flex items-center gap-6">
                <Link
                    to="/perfil"
                    className="font-bold text-[#a10b00]"
                >
                    Meu perfil
                </Link>

                <button
                    onClick={sair}
                    className="rounded-full bg-[#a10b00] px-7 py-3.5 font-bold text-white transition hover:bg-[#850900]"
                >
                    Sair
                </button>
            </div>
        </nav>
    )
}

export default NavFeed