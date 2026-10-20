import { Navigate } from 'react-router-dom'

function RotaProtegida({ children }) {
    const aluno = sessionStorage.getItem('aluno')

    if (!aluno) {
        return <Navigate to="/login" replace />
    }

    return children
}

export default RotaProtegida