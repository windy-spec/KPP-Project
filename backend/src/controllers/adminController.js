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
      { $group: { _id: null, total: { $sum: "$total_amount" } } }
    ]);
    // Nếu có dữ liệu thì lấy số tổng, nếu không có hóa đơn nào thì trả về 0
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // --- BƯỚC 2: ĐẾM SỐ LƯỢNG TỔNG QUÁT ---
    // Sử dụng Promise.all để chạy song song 3 lệnh đếm, giúp giảm thời gian phản hồi của server
    const [totalOrders, totalProducts, totalUsers] = await Promise.all([
      Invoice.countDocuments(), // Đếm tổng số hóa đơn
      Product.countDocuments(), // Đếm tổng số sản phẩm trong kho
      User.countDocuments({ role: "user" }) // Chỉ đếm những tài khoản là khách hàng (bỏ qua admin)
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
          createdAt: { $gte: sevenDaysAgo }
        }
      },
      {
        // Nhóm theo ngày. Hàm $dateToString sẽ chuyển ngày giờ phức tạp thành dạng "Ngày/Tháng"
        $group: {
          _id: { $dateToString: { format: "%d/%m", date: "$createdAt" } },
          revenue: { $sum: "$total_amount" } // Tổng tiền theo từng ngày đó
        }
      },
      // Sắp xếp ngày tăng dần để biểu đồ chạy từ trái sang phải
      { $sort: { "_id": 1 } }
    ]);

    // --- BƯỚC 4: TÌM TOP 5 SẢN PHẨM BÁN CHẠY ---
    const topProducts = await Invoice.aggregate([
      { $match: { payment_status: "PAID" } },
      // Vì mỗi hóa đơn có mảng 'items', lệnh này sẽ tách mảng đó ra. 
      // VD: 1 hóa đơn có 3 món sẽ tách thành 3 dòng dữ liệu riêng biệt để dễ đếm.
      { $unwind: "$items" }, 
      {
        // Nhóm theo mã sản phẩm (product_id)
        $group: {
          _id: "$items.product_id",
          name: { $first: "$items.product_name" }, // Lấy tên sản phẩm đầu tiên tìm thấy
          sales: { $sum: "$items.quantity" },      // Cộng dồn số lượng đã bán
          revenue: { $sum: "$items.total_price" }  // Cộng dồn số tiền thu được từ sản phẩm đó
        }
      },
      // Sắp xếp theo số lượng bán (sales) từ cao xuống thấp
      { $sort: { sales: -1 } },
      // Chỉ lấy 5 sản phẩm đầu bảng
      { $limit: 5 }
    ]);

    // --- BƯỚC 5: TRẢ KẾT QUẢ VỀ CHO FRONTEND ---
    res.status(200).json({
      success: true,
      stats: {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalUsers
      },
      // Map lại dữ liệu biểu đồ để Frontend (Recharts) dễ đọc hơn
      chartData: chartDataRaw.map(item => ({
        name: item._id,     // Tên cột (VD: 25/12)
        revenue: item.revenue // Chiều cao cột (Số tiền)
      })),
      topProducts
    });

  } catch (error) {
    // Nếu có bất kỳ lỗi nào (sai Database, lỗi mạng...), in ra log và báo lỗi về client
    console.error("Lỗi Thống Kê Dashboard:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};