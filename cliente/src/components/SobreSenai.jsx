import ImagemSenai from '../assets/ImagemSenai.jpg'

function SobreSenai() {
    return (
        <section
            id="senai"
            className="bg-[#a10b00] px-10 py-16 md:px-16 lg:px-20"
        >
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-20">
                <div className="relative h-[600px] overflow-hidden rounded-t-[35px] rounded-br-[35px]">
                    <img
                        src={ImagemSenai}
                        alt="Estudante do SENAI"
                        className="h-full w-full object-cover"
                    />

                    <div className="absolute bottom-5 left-5 text-white">
                        <span className="text-sm">
                            DESDE
                        </span>

                        <span className="ml-2 text-2xl">
                            1942
                        </span>
                    </div>
                </div>

                <div className="flex flex-col justify-center text-white">
                    <div className="mb-4 flex items-center gap-3">
                        <span className="h-[2px] w-6 bg-white"></span>

                        <span className="text-sm font-bold">
                            SOBRE A INSTITUIÇÃO
                        </span>
                    </div>

                    <h2 className="max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
                        Infraestrutura moderna e aprendizado
                        prático que transformam futuros.
                    </h2>

                    <div className="mt-8 space-y-4 text-lg leading-relaxed">
                        <p>
                            Da recepção dos estudantes à formação
                            profissional, o SENAI oferece laboratórios
                            modernos e apoio docente qualificado,
                            garantindo um ensino prático e alinhado ao mercado.
                        </p>

                        <p>
                            Docentes qualificados acompanham o aprendizado
                            dos estudantes, garantindo conteúdos alinhados
                            às demandas do mercado e com as diretrizes
                            educacionais em vigor.
                        </p>
                    </div>

                    <div className="my-8 h-px w-full bg-white/40"></div>

                    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
                        <h3 className="font-bold">
                            Etapas pedagógicas
                        </h3>

                        <p className="text-sm leading-relaxed">
                            Teoria, prática em laboratório e
                            preparação direta para o mercado.
                        </p>
                    </div>

                    <div className="h-px w-full bg-white/40"></div>

                    <div className="grid grid-cols-1 gap-4 py-4 md:grid-cols-2">
                        <h3 className="font-bold">
                            Estrutura dedicada
                        </h3>

                        <p className="text-sm leading-relaxed">
                            Ambientes modernos focados no
                            aprendizado prático e na segurança.
                        </p>
                    </div>

                    <div className="h-px w-full bg-white/40"></div>
                </div>
            </div>
        </section>
    )
}

export default SobreSenai