import express from "express";
import { signIn, signUp } from "../controllers/authControllers.js";
const router = express.Router();

// get API:

// API signUp
router.post("/signUp", signUp);

// API signIn
router.post("/signIn", signIn);
export default router;
