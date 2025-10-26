import express from "express";
import { authMe } from "../controllers/userControllers.js";
import { protectedRoute } from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/me", protectedRoute, authMe);

export default router;
