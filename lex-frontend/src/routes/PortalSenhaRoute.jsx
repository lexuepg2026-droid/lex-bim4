import { Navigate, Outlet } from "react-router-dom";
import { usePortalAuth } from "../contexts/PortalAuthContext";

function PortalSenhaRoute() {
    const {
        autenticado,
        carregando,
        senhaProvisoria,
    } = usePortalAuth();

    if (carregando) {
        return <div>Carregando...</div>;
    }

    if (!autenticado) {
        return <Navigate to="/portal" replace />;
    }

    if (!senhaProvisoria) {
        return <Navigate to="/portal/processo" replace />;
    }

    return <Outlet />;
}

export default PortalSenhaRoute;