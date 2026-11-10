import { Router } from "express";
import {
  getDashboardSummary,
  getDashboardStatus,
  getDashboardFeesByMonth
} from "../controllers/dashboardController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { atualizarVencidas } from "../services/vencimentoService.js";

const router = Router();

router.use(authMiddleware);
// Fase 4a3 (DEC-174): antes de ler, grava `vencido` nas parcelas pendentes
// cujo vencimento já passou (com freio de 10 minutos por advogada).
router.use(atualizarVencidas);
router.get("/", getDashboardSummary);
router.get("/status", getDashboardStatus);
router.get("/honorarios-por-mes", getDashboardFeesByMonth);

export default router;
