import { Link } from 'react-router-dom'
import NavHome from '../../components/NavHome'
import GloboDigital from '../../components/GloboDigital'
import SobreSenai from '../../components/SobreSenai'

function Home() {
    return (
        <main className="bg-white">
            <div className="absolute right-0 top-0 z-0 h-[750px] w-[750px]">
                <GloboDigital />
            </div>

            <div className="relative z-20">
                <NavHome />
            </div>

            <section className="relative z-10 min-h-[calc(100vh-100px)]">
                <div className="flex min-h-[calc(100vh-100px)] flex-col justify-center px-10 md:px-20 lg:px-28">
                    <h1 className="max-w-2xl text-5xl font-bold leading-[1.05] md:text-6xl lg:text-7xl">
                        Aprenda, compartilhe
                        <br />
                        e cresça junto.
                    </h1>

                    <p className="mt-7 max-w-xl text-xl leading-relaxed md:text-2xl">
                        O espaço ideal para aprender com o
                        <br />
                        SENAI e compartilhar ideias.
                    </p>

                    <button className="mt-8 w-fit rounded-3xl bg-[#a10b00] px-7 py-4 text-lg font-bold text-white">
                        <Link
                            to="/login"
                        >
                            Começar agora
                        </Link>
                    </button>
                </div>
            </section>

            <SobreSenai />
        </main>
    )
}

export default Home