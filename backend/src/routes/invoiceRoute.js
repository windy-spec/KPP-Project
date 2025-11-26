import express from "express";
import { createOrder } from "../controllers/invoiceController.js";
import { protectedRoute as protect } from "../middlewares/authMiddlewares.js";

const router = express.Router();

// Frontend gọi vào: /api/orders
router.post("/", protect, createOrder);

export default router;
