import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    // do o day la ham bat dong bo async nen minh phai dung await de
    await mongoose.connect(process.env.MONGODB_CONNECTIONSTRING);
    console.log("Liên kết cơ sở dữ liệu thành công!");
  } catch (error) {
    console.log("Liên kết cơ sở dữ liệu thất bại:", error);
    process.exit(1);
  }
};
