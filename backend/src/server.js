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

// 1. PUBLIC ROUTES: Tất cả các routes trong authRoute (signIn, signUp, forgot-password)
// đều được xử lý ở đây. Chúng không cần token vì chúng nằm trước protectedRoute.
app.use("/api/auth", authRoute);

// 2. MIDDLEWARE BẢO VỆ: Middleware này sẽ chặn mọi request đến CÁC ROUTES ĐƯỢC ĐỊNH NGHĨA PHÍA DƯỚI.
app.use(protectedRoute);

// 3. PRIVATE ROUTES: Các routes này yêu cầu token vì chúng nằm sau protectedRoute.
app.use("/api/users", userRoute);

connectDB().then(() => {
  //
  app.listen(PORT, () => {
    console.log(`Server đã bắt đầu ở cổng ${PORT}`);
  });
});
