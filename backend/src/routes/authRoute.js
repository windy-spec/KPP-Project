import express from "express";
import {
  signIn,
  signOut,
  signUp,
  testSendEmail,
} from "../controllers/authControllers.js";
const router = express.Router();

// get API:

// API signUp
router.post("/signUp", signUp);

// API signIn
router.post("/signIn", signIn);

// API signOut
router.post("/signOut", signOut);

// API sendEmail
router.post("/test-email", testSendEmail);
export default router;
