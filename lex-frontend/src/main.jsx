import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import AppRoutes from './routes/AppRoutes.jsx'
import { iniciarTema } from './utils/tema.js'
import registrarSW from './registrarSW.js'

iniciarTema();
registrarSW();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <AppRoutes />
    </StrictMode>,
)
