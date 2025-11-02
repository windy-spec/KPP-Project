import express from "express";
import {
  createDiscount,
  getAllDiscounts,
  getDiscountById,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discountControllers.js";
import { verifyAdmin } from "../middlewares/authMiddlewares.js";

const router = express.Router();
console.log("✅ Discount route loaded");
router.get("/", async (req, res) => {
  res.json({ message: "Discount API hoạt động!" });
});
router.get("/:id", getDiscountById);

// Protect create/update/delete
router.post("/", verifyAdmin, createDiscount);
router.put("/:id", verifyAdmin, updateDiscount);
router.delete("/:id", verifyAdmin, deleteDiscount);

export default router;
