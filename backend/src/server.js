import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import { protectedRoute } from "./middlewares/authMiddlewares.js";
// call env port

dotenv.config();

// Set port 5001
const app = express();
// Lấy biến PORT từ .env, nếu không có thì mặc định là 5001
const PORT = process.env.PORT || 5001;

app.use(express.json());
app.use(cookieParser());
// public routes

app.use("/api/auth", authRoute);
// private routes
app.use(protectedRoute);
app.use("/api/users", userRoute);

connectDB().then(() => {
  //
  app.listen(PORT, () => {
    console.log(`Server đã bắt đầu ở cổng ${PORT}`);
  });
});
