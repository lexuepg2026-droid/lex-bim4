import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from "../contexts/AuthContext"
import { OutboxProvider } from "../contexts/OutboxContext"

import ProtectedRoute from "./ProtectedRoute"
import PortalRoutes from "./PortalRoutes"

import ScrollToTop from "../components/ScrollToTop/ScrollToTop";
import ToastContainer from "../components/ToastContainer/ToastContainer";

import LayoutAutenticacao from "../layouts/LayoutAutenticacao/LayoutAutenticacao"
import LayoutAdvogada from "../layouts/LayoutAdvogada/LayoutAdvogada";

import NotFound from "../pages/NotFound/NotFound"

import Inicio from "../pages/AreaPublica/Inicio/Inicio"

import Login from "../pages/AreaPublica/Login/Login"
import EsqueciSenha from "../pages/AreaPublica/EsqueciSenha/EsqueciSenha"
import RedefinirSenha from "../pages/AreaPublica/RedefinirSenha/RedefinirSenha"
import ConfirmarEmail from "../pages/AreaPublica/ConfirmarEmail/ConfirmarEmail"

import Cadastrar from "../pages/AreaPublica/Cadastrar/Cadastrar"

import Home from "../pages/PortalAdvogada/Home/Home"

import Processos from "../pages/PortalAdvogada/Processos/Processos"
import ProcessosForm from "../pages/PortalAdvogada/Processos/ProcessosForm"
import ProcessosDetalhes from "../pages/PortalAdvogada/Processos/ProcessosDetalhes"

import Clientes from "../pages/PortalAdvogada/Clientes/Clientes"
import ClientesForm from "../pages/PortalAdvogada/Clientes/ClientesForm";
import ClientesDetalhes from "../pages/PortalAdvogada/Clientes/ClientesDetalhes";

import MeusModelos from "../pages/PortalAdvogada/Documentos/MeusModelos"
import SecoesLista from "../pages/PortalAdvogada/Documentos/SecoesLista"
import DocumentosLista from "../pages/PortalAdvogada/Documentos/DocumentosLista"
import DocumentoDetalhes from "../pages/PortalAdvogada/Documentos/DocumentoDetalhes"

import Calendario from "../pages/PortalAdvogada/Calendario/Calendario"
import Financeiro from "../pages/PortalAdvogada/Financeiro/Financeiro"
import Configuracoes from "../pages/PortalAdvogada/Configuracoes/Configuracoes"
import Pendencias from "../pages/PortalAdvogada/Pendencias/Pendencias"

function AppRoutes() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastContainer />
      <AuthProvider>
        <OutboxProvider>
        <Routes>

          <Route element={<LayoutAutenticacao />}>
            <Route path="/" element={<Inicio />} />
            <Route path="/login" element={<Login />} />
            <Route path="/senha/reset" element={<EsqueciSenha />} />
            <Route path="/senha/redefinir" element={<RedefinirSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />
            <Route path="/confirmar-email" element={<ConfirmarEmail />} />
          </Route>

          <Route path="/cadastrar" element={<Cadastrar />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<LayoutAdvogada />}>
              <Route path="/home" element={<Home />} />

              <Route path="/processos" element={<Processos />} />
              <Route path="/processos/novo" element={<ProcessosForm />} />
              <Route path="/processos/editar/:id" element={<ProcessosForm />} />
              <Route path="/processos/detalhes/:id" element={<ProcessosDetalhes />} />

              <Route path="/modelos" element={<MeusModelos />} />
              <Route path="/secoes" element={<SecoesLista />} />
              <Route path="/documentos" element={<DocumentosLista />} />
              <Route path="/documentos/:id" element={<DocumentoDetalhes />} />

              <Route path="/clientes" element={<Clientes />} />
              <Route path="/clientes/novo" element={<ClientesForm />} />
              <Route path="/clientes/editar/:id" element={<ClientesForm />} />
              <Route path="/clientes/detalhes/:id" element={<ClientesDetalhes />} />

              <Route path="/calendario" element={<Calendario />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/pendencias" element={<Pendencias />} />
            </Route>

            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          <Route path="/portal/*" element={<PortalRoutes />} />

          <Route path="*" element={<NotFound />} />

        </Routes>
        </OutboxProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default AppRoutes