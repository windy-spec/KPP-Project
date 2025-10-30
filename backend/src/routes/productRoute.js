import express from "express";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getProdcutById,
  partionPageProdcut,
  updateProduct,
} from "../controllers/productControllers.js";

const router = express.Router();
router.get("/partition", partionPageProdcut);
router.get("/", getAllProduct);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);
router.get("/:id", getProdcutById);

export default router;
