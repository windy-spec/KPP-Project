import express from "express";
import dotenv from "dotenv";
import { connectDB } from "./libs/db.js";
import authRoute from "./routes/authRoute.js";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import cors from "cors";
import categoryRoute from "./routes/categoryRoute.js";
import productRoute from "./routes/productRoute.js";
import cartRoute from "./routes/cartRoute.js";
import momoRoute from "./routes/momoRoute.js";
import invoiceRoute from "./routes/invoiceRoute.js";
import path from "path";
import discountRoute from "./routes/discountRoute.js";
import SaleProgram from "./routes/saleProgramRoute.js";
import cron from "node-cron";
import { autoUpdateOrderStatus } from "./controllers/CronController.js";
import adminRoute from "./routes/adminRoute.js";
import chatRoutes from "./routes/chatRoute.js";
dotenv.config();
// Set port
const app = express();
const PORT = process.env.PORT || 5001;
// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(cookieParser());
// Static Files
app.use("/public", express.static(path.join(process.cwd(), "public")));
app.use("/uploads", express.static(path.join(process.cwd(), "public/uploads")));
// Routes
app.use("/api/category", categoryRoute);
app.use("/api/saleprogram", SaleProgram);
app.use("/api/discount", discountRoute);
app.use("/api/product", productRoute);
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/cart", cartRoute);
app.use("/api/payments", momoRoute);
app.use("/api/invoice", invoiceRoute);
app.use("/api/admin", adminRoute);
app.use("/api/chat", chatRoutes);
//  2. Cấu hình Cron Job (Chạy mỗi 1 tiếng)
// Cú pháp: 'phút giờ ngày tháng thứ'
// '0 * * * *' nghĩa là chạy vào phút thứ 0 của mỗi giờ (1h00, 2h00...)
cron.schedule("0 * * * *", () => {
  console.log(" [CRON] Đang quét đơn hàng để cập nhật trạng thái...");
  autoUpdateOrderStatus();
});

// TEST
// cron.schedule("* * * * *", () => {
//   console.log(" [CRON] Đang quét đơn hàng để cập nhật trạng thái...");
//   autoUpdateOrderStatus();
// });

// Connect DB & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server đã bắt đầu ở cổng ${PORT}`);
    console.log("✅ Cron Job đã được kích hoạt.");
  });
});
