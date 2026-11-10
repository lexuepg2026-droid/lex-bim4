import { Router } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import {
  createInstallment,
  getAllInstallments,
  getInstallmentById,
  updateInstallment,
  deleteInstallment
} from "../controllers/installmentController.js";
import { atualizarVencidas } from "../services/vencimentoService.js";

const router = Router();

router.use(authMiddleware);

router.post("/", createInstallment);
router.get("/", atualizarVencidas, getAllInstallments);
// A rota `PATCH /:id/reativar` MORREU na Fase F-1a (DEC-034) e passa a
// responder 404 pelo `notFoundMiddleware`. Ver o registro no fim de
// `installmentService.js` — e o teste que trava as duas rotas de reativação.

// Fase 4a3 (DEC-174): as duas leituras gravam antes o `vencido` que já passou.
router.get("/:id", atualizarVencidas, getInstallmentById);
// PATCH é o verbo de update do projeto; PUT fica como alias depreciado, no
// mesmo padrão de `/clients`, `/processes` e `/documents`.
router.patch("/:id", updateInstallment);
router.put("/:id", updateInstallment);
router.delete("/:id", deleteInstallment);

export default router;