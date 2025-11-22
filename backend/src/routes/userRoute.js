import express from "express";
import { authMe, updateUser } from "../controllers/userControllers.js";
import { checkRole, protectedRoute } from "../middlewares/authMiddlewares.js";
const router = express.Router();

router.get("/me", protectedRoute, authMe);
router.put("/me", protectedRoute, updateUser);
router.post("/admin", protectedRoute, checkRole(["admin"]), (req, res) => {});
router.get("/orders", protectedRoute, checkRole(["user", "admin"]));
export default router;
