import express from "express";
import {
  createSaleProgram,
  getAllSalePrograms,
  getSaleProgramById,
  updateSaleProgram,
  deleteSaleProgram,
} from "../controllers/saleProgramControllers.js";

const router = express.Router();

router.post("/", createSaleProgram);
router.get("/", getAllSalePrograms);
router.get("/:id", getSaleProgramById);
router.put("/:id", updateSaleProgram);
router.delete("/:id", deleteSaleProgram);

export default router;
