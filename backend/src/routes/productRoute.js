import express from "express";
import { upload } from "../middlewares/upload.js";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getProdcutById,
  partitionPageProduct,
  updateProduct,
} from "../controllers/productControllers.js";

const router = express.Router();

// multer storage (save to public/uploads)

const productUploadMiddleware = upload.fields([
  { name: "avatar", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

router.get("/partition", partitionPageProduct);
router.get("/", getAllProduct);

// Áp dụng middleware chấp nhận nhiều trường cho POST
router.post("/", productUploadMiddleware, createProduct);

// Áp dụng middleware chấp nhận nhiều trường cho PUT
router.put("/:id", productUploadMiddleware, updateProduct);

router.delete("/:id", deleteProduct);
router.get("/:id", getProdcutById);

export default router;
