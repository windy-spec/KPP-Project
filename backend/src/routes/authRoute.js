import express from "express";
import {
  signIn,
  signOut,
  signUp,
  forgotPassword,
} from "../controllers/authControllers.js";
const router = express.Router();

// get API:

// API signUp
router.post("/signUp", signUp);

// API signIn
router.post("/signIn", signIn);

// API signOut
router.post("/signOut", signOut);

router.post("/forgot-password", forgotPassword);
// API sendEmail

export default router;
