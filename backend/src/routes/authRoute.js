import express from "express";
import { signUp } from "../controllers/authControllers.js";
const router = express.Router();

// get API
router.post("/signUp", signUp);

export default router;
