// routes/chatRoutes.js
import express from "express";
import { chatWithBot } from "../controllers/chatController.js";

const router = express.Router();

// Định nghĩa đường dẫn POST để gửi tin nhắn
router.post("/", chatWithBot);

export default router;
