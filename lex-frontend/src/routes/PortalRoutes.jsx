import { Routes, Route } from "react-router-dom";

import { PortalAuthProvider } from "../contexts/PortalAuthContext";

import PortalProtectedRoute from "./PortalProtectedRoute";
import PortalSenhaRoute from "./PortalSenhaRoute";

import LayoutPortal from "../layouts/LayoutPortal/LayoutPortal";

import Portal from "../pages/PortalClientes/Portal/Portal";
import ProcessosPortal from "../pages/PortalClientes/Processos/ProcessosPortal";
import ProcessoPortal from "../pages/PortalClientes/Processo/ProcessoPortal";
import SenhaTemporaria from "../pages/PortalClientes/SenhaTemporaria/SenhaTemporaria";
import ResetSenhaPortal from "../pages/PortalClientes/ResetSenhaPortal/ResetSenhaPortal";
import ResetSenhaPortalSolicitado from "../pages/PortalClientes/ResetSenhaPortalSolicitado/ResetSenhaPortalSolicitado";

function PortalRoutes() {
    return (
        <PortalAuthProvider>
            <Routes>
                <Route element={<LayoutPortal />}>

                    <Route index element={<Portal />} />

                    <Route element={<PortalSenhaRoute />}>
                        <Route
                            path="senha/temporaria"
                            element={<SenhaTemporaria />}
                        />
                    </Route>

                    <Route element={<PortalProtectedRoute />}>
                        <Route
                            path="processo"
                            element={<ProcessosPortal />}
                        />
                        <Route
                            path="processo/:processoId"
                            element={<ProcessoPortal />}
                        />
                    </Route>

                    <Route
                        path="senha/reset"
                        element={<ResetSenhaPortal />}
                    />

                    <Route
                        path="senha/reset/solicitado"
                        element={<ResetSenhaPortalSolicitado />}
                    />

                </Route>
            </Routes>
        </PortalAuthProvider>
    );
}

export default PortalRoutes;