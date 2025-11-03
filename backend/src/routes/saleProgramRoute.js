import express from "express";
import {
  createSaleProgram,
  getAllSaleProgram, // <--- Sửa tên hàm này cho khớp
  getSaleProgramById,
  updateSaleProgram,
  deleteSaleProgram,
} from "../controllers/saleProgramControllers.js";
import { protectedRoute, checkRole } from "../middlewares/authMiddlewares.js";

const router = express.Router();
router
  .route("/")
  .post(protectedRoute, checkRole(["admin"]), createSaleProgram)
  .get(getAllSaleProgram);

router
  .route("/:id")
  .get(getSaleProgramById)
  .put(protectedRoute, checkRole(["admin"]), updateSaleProgram)
  .delete(protectedRoute, checkRole(["admin"]), deleteSaleProgram);

export default router;
