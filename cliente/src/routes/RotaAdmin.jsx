import { Navigate } from 'react-router-dom'

function RotaAdmin({ children }) {
    const token = sessionStorage.getItem('token')
    const alunoSalvo = sessionStorage.getItem('aluno')

    if (!token || !alunoSalvo) {
        return <Navigate to="/login" replace />
    }

    const aluno = JSON.parse(alunoSalvo)

    if (aluno.tipo !== 'admin') {
        return <Navigate to="/feed" replace />
    }

    return children
}

export default RotaAdmin