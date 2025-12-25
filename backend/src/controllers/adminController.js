import Invoice from "../models/Invoice.js";
import Product from "../models/Product.js";
import User from "../models/User.js";

export const getDashboardStats = async (req, res) => {
  try {
    // --- BƯỚC 1: TÍNH TỔNG DOANH THU ---
    // Sử dụng aggregate để tính tổng trực tiếp trên Database cho nhanh
    const revenueStats = await Invoice.aggregate([
      // Chỉ lấy những hóa đơn đã thanh toán xong (payment_status: "PAID")
      { $match: { payment_status: "PAID" } },
      // Gom tất cả lại thành 1 nhóm (_id: null) và cộng dồn trường total_amount
      { $group: { _id: null, total: { $sum: "$total_amount" } } },
    ]);
    // Nếu có dữ liệu thì lấy số tổng, nếu không có hóa đơn nào thì trả về 0
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // --- BƯỚC 2: ĐẾM SỐ LƯỢNG TỔNG QUÁT ---
    // Sử dụng Promise.all để chạy song song 3 lệnh đếm, giúp giảm thời gian phản hồi của server
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      Invoice.countDocuments(), // Đếm tổng số hóa đơn
      Product.countDocuments(), // Đếm tổng số sản phẩm trong kho
      User.countDocuments({ role: "user" }), // Chỉ đếm những tài khoản là khách hàng (bỏ qua admin)
    ]);

    // --- BƯỚC 3: DỮ LIỆU BIỂU ĐỒ 7 NGÀY GẦN NHẤT ---
    // Thiết lập mốc thời gian là 7 ngày trước tính từ thời điểm hiện tại
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const chartDataRaw = await Invoice.aggregate([
      {
        // Lọc hóa đơn đã thanh toán và được tạo trong vòng 7 ngày qua
        $match: {
          payment_status: "PAID",
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        // Nhóm theo ngày. Hàm $dateToString sẽ chuyển ngày giờ phức tạp thành dạng "Ngày/Tháng"
        $group: {
          _id: { $dateToString: { format: "%d/%m", date: "$createdAt" } },
          revenue: { $sum: "$total_amount" }, // Tổng tiền theo từng ngày đó
        },
      },
      // Sắp xếp ngày tăng dần để biểu đồ chạy từ trái sang phải
      { $sort: { _id: 1 } },
    ]);

    // --- BƯỚC 4: TÌM TOP 5 SẢN PHẨM BÁN CHẠY ---
    const topProductsRaw = await Invoice.aggregate([
      { $match: { payment_status: "PAID" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product_id",
          sales: { $sum: "$items.quantity" },
          // ✅ Fix: Nếu total_price bị rỗng (do đơn cũ) thì mặc định là 0
          revenue: { $sum: { $ifNull: ["$items.total_price", 0] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    // ✅ FIX: Truy vấn thêm tên sản phẩm từ bảng Product
    const topProducts = await Promise.all(
      topProductsRaw.map(async (item) => {
        const productInfo = await Product.findById(item._id).select(
          "name quantity"
        );
        return {
          ...item,
          // Nếu có tên trong DB thì lấy, không thì báo "Sản phẩm không tên"
          name: productInfo ? productInfo.name : "Sản phẩm không tên",
          stock: productInfo ? productInfo.quantity : 0,
        };
      })
    );

    // --- BƯỚC 5: TRẢ KẾT QUẢ ---
    res.status(200).json({
      success: true,
      stats: { totalRevenue, totalOrders, totalProducts, totalUsers },
      chartData: chartDataRaw.map((item) => ({
        name: item._id,
        revenue: item.revenue,
        stock: "$product_details",
      })),
      topProducts, // Trả về danh sách đã được bổ sung tên
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
