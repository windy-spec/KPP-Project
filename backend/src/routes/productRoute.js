import express from "express";
import multer from "multer";
import path from "path";
import {
  createProduct,
  deleteProduct,
  getAllProduct,
  getProdcutById,
  partionPageProdcut,
  updateProduct,
} from "../controllers/productControllers.js";

const router = express.Router();

// multer storage (save to public/uploads)
const storage = multer.diskStorage({
  destination: (req, file, cb) =>
    cb(null, path.join(process.cwd(), "public", "uploads")),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

router.get("/partition", partionPageProdcut);
router.get("/", getAllProduct);
// accept multipart/form-data with field name 'image'
router.post("/", upload.single("image"), createProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.delete("/:id", deleteProduct);
router.get("/:id", getProdcutById);

export default router;
