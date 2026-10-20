import { Link } from 'react-router-dom'

function NavHome() {
    return (
        <nav className="relative z-30 flex items-center justify-between px-10 py-7 lg:px-16">
            <div>
                <Link to="/">
                    <h2 className="text-2xl font-bold">
                        Integra<span className="text-red-500">+</span>
                    </h2>
                </Link>
            </div>
            
            <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
                <a 
                    href="#senai"
                    className="text-lg transition hover:text-[#a10b00]"
                >
                    SENAI
                </a>

                <a 
                    href="#cursos"
                    className="text-lg transition hover:text-[#a10b00]"
                >
                    Cursos
                </a>

                <a 
                    href="#sobre"
                    className="text-lg transition hover:text-[#a10b00]"
                >
                    Sobre
                </a>
            </div>

            <div className="flex items-center gap-6">
                <Link
                    to="/login"
                    className="font-bold text-[#a10b00]"
                >
                    Entrar
                </Link>

                <Link
                    to="/cadastro"
                    className="rounded-full bg-[#a10b00] px-7 py-4 font-bold text-white transition hover:bg-[#850900]"
                >
                    Cadastrar
                </Link>
            </div>
        </nav>
    )
}

export default NavHome