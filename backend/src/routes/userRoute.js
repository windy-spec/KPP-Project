import express from "express";
import { authMe } from "../controllers/userControllers.js";
import { checkRole, protectedRoute } from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/me", protectedRoute, authMe);
router.post("/admin", protectedRoute, checkRole(["admin"]), (req, res) => {});
router.get("/orders", protectedRoute, checkRole(["user", "admin"]));
export default router;
