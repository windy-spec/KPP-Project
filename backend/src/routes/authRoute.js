import express from "express";
import {
  signIn,
  signOut,
  signUp,
  forgotPassword,
  resetPassword,
} from "../controllers/authControllers.js";
const router = express.Router();

// get API:

// API signUp
router.post("/signUp", signUp);
// API signIn
router.post("/signIn", signIn);
// API signOut
router.post("/signOut", signOut);
// API forgotPassword
router.post("/forgot-password", forgotPassword);

//API resetPassword
router.post("/reset-password", resetPassword);
export default router;
