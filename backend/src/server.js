import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
// call env port

dotenv.config();

// Set port 5001
const app = express();
// Lấy biến PORT từ .env, nếu không có thì mặc định là 5001
const PORT = process.env.PORT || 5001;

app.use(express.json());

// public routes

app.use("/api/auth", authRoute);
// private routes
connectDB().then(() => {
  //
  app.listen(PORT, () => {
    console.log(`Server đã bắt đầu ở cổng ${PORT}`);
  });
});
