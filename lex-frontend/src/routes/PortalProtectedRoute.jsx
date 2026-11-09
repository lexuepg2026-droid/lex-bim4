import { Navigate, Outlet } from "react-router-dom";
import { usePortalAuth } from "../contexts/PortalAuthContext";

function PortalProtectedRoute() {
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

    if (senhaProvisoria) {
        return <Navigate to="/portal/senha/temporaria" replace />;
    }

    return <Outlet />;
}

export default PortalProtectedRoute;