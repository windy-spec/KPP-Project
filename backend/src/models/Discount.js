import mongoose from "mongoose";

const DiscountSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // chi co 2 loai discount la mua le va dai ly
  type: {
    type: String,
    enum: ["SALE", "AGENCY"],
    required: true,
  },
  // Giup nhan vien biet duoc dang can tinh sale tren sanpham, danh muc, hay tong hoa don
  target_type: {
    type: String,
    enum: ["PRODUCT", "CATEGORY", "ORDER_TOTAL"],
    required: true,
  },
  target_id: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
  },
  discount_percent: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  min_quantity: {
    type: Number,
    default: 1,
  },
  start_sale: {
    type: Date,
    default: Date.now,
    required: true,
  },
  end_sale: {
    type: Date,
    default: function () {
      const getDateSale = this.start_sale;
      const upOneDay = new Date(getDateSale() + 1);
      return upOneDay;
    },
    required: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// ĐẠI LÝ THÌ NẾU TẠO CHƯƠNG TRÌNH SALE SẼ LUÔN MẶC ĐỊNH ĐÓ LÀ 30 NGÀY, TRỪ CÁC GIÁ TRỊ ĐÃ SET SẴN
DiscountSchema.pre(
  "save",
  function (next) {
    // 1. Chỉ chạy khi Document là AGENCY và chưa có end_date
    if (this.type === "AGENCY" && !this.end_sale) {
      // Lấy ngày bắt đầu (sẽ là Date.now nếu không được nhập)
      const startDate = this.start_sale || new Date();

      // Tính toán ngày kết thúc: 30 ngày sau ngày bắt đầu
      const defaultEndDate = new Date(startDate.getTime());
      defaultEndDate.setDate(startDate.getDate() + 30);

      // Gán lại giá trị cho Document
      this.end_sale = defaultEndDate;
      console.log(
        `[Discount] AGENCY created with default 30-day end_sale: ${this.end_sale.toISOString()}`
      );
    }

    // 2. Đối với SALE: Nếu end_date bị thiếu, nó sẽ là NULL.
    // Việc này sẽ được kiểm tra ở tầng Controller để buộc nhân viên phải nhập thời hạn tùy chỉnh.

    next();
  },
  {
    timestamps: true,
  }
);

const Discount = mongoose.Schema("Discount", DiscountSchema);
export default Discount;
