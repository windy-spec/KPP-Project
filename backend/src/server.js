import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import cors from "cors";
import categoryRoute from "./routes/categoryRoute.js";
import productRoute from "./routes/productRoute.js";
import path from "path";
// call env port

dotenv.config();

// Set port 5001
const app = express();
// Lấy biến PORT từ .env, nếu không có thì mặc định là 5001
const PORT = process.env.PORT || 5001;

// cors
app.use(express.static("public")); // để multer upload ảnh có thể truy cập
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
app.use("/public", express.static(path.join(process.cwd(), "public")));

app.use("/api/category", categoryRoute);
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));

app.use("/api/product", productRoute);
console.log("✅ Mounted /api/product route");
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);

connectDB().then(() => {
  //
  app.listen(PORT, () => {
    console.log(`Server đã bắt đầu ở cổng ${PORT}`);
  });
});
