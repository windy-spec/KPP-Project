import express from "express";
import dotenv from "dotenv";

// call env port

dotenv.config();

// Set port 5001
const app = express();
// Lấy biến PORT từ .env, nếu không có thì mặc định là 5001
const PORT = process.env.PORT || 5001;

//
app.listen(PORT, () => {
  console.log(`Server đã bắt đầu ở cổng ${PORT}`);
});
