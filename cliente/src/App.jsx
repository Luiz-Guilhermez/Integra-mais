import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/home/Home'
import Feed from './pages/feed/Feed'
import Login from './pages/login/Login'
import Cadastro from './pages/cadastro/Cadastro'
import Perfil from './pages/perfil/Perfil'
import RotaProtegida from './routes/RotaProtegida'
import Admin from './pages/admin/Admin'
import RotaAdmin from './routes/RotaAdmin'
import RecuperarSenha from './pages/recuperarSenha/RecuperarSenha'
import RedefinirSenha from './pages/redefinirSenha/RedefinirSenha'
import './App.css'

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Home />} />
                <Route
                    path='/feed'
                    element={
                        <RotaProtegida>
                            <Feed />
                        </RotaProtegida>
                    }
                />
                <Route
                    path='/perfil'
                    element={
                        <RotaProtegida>
                            <Perfil />
                        </RotaProtegida>
                    }
                />
                <Route 
                    path='/admin' 
                    element={
                        <RotaAdmin>
                            <Admin />
                        </RotaAdmin>
                    }
                />
                <Route path='/cadastro' element={<Cadastro />} />
                <Route path='/login' element={<Login />} />
                <Route path='/recuperar-senha' element={<RecuperarSenha />}/>
                <Route path='/redefinir-senha' element={<RedefinirSenha />}/>
            </Routes>
        </BrowserRouter>
    )
}

export default App