import Invoice from "../models/Invoice.js";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js"; // 👈 QUAN TRỌNG: Phải import Product

// 1. TẠO HÓA ĐƠN VÀ TRỪ TỒN KHO
export const createInvoice = async (req, res) => {
  try {
    const {
      recipient_info,
      items, // Mảng sản phẩm: [{ product_id, quantity, ... }]
      payment_method,
      shipping_fee,
      total_amount,
      momoOrderId,
    } = req.body;

    // ---------------------------------------------------------
    // BƯỚC 1: KIỂM TRA TỒN KHO TRƯỚC (VALIDATION)
    // ---------------------------------------------------------
    // Duyệt qua từng sản phẩm khách mua để xem kho còn đủ không
    for (const item of items) {
      const product = await Product.findById(item.product_id);

      if (!product) {
        return res.status(404).json({
          message: `Sản phẩm có ID ${item.product_id} không tồn tại`,
        });
      }

      // Giả sử field lưu số lượng trong DB là 'stock' (hoặc 'countInStock')
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Sản phẩm "${product.name}" chỉ còn ${product.stock}, bạn mua ${item.quantity} là không đủ.`,
        });
      }
    }

    // ---------------------------------------------------------
    // BƯỚC 2: TẠO HÓA ĐƠN (Nếu bước 1 ok)
    // ---------------------------------------------------------
    const invoice = await Invoice.create({
      user: req.user._id,
      recipient_info,
      items,
      payment_method: payment_method || "COD",
      shipping_fee: shipping_fee || 0,
      total_amount,
      momoOrderId: momoOrderId || undefined,
    });

    // ---------------------------------------------------------
    // BƯỚC 3: TRỪ TỒN KHO (BULK WRITE)
    // ---------------------------------------------------------
    if (invoice) {
      // Tạo danh sách các lệnh update để chạy 1 lần (tối ưu hiệu năng)
      const bulkOps = items.map((item) => ({
        updateOne: {
          filter: { _id: item.product_id },
          update: {
            $inc: {
              stock: -item.quantity, // Trừ số lượng tồn kho
              sold: +item.quantity, // Cộng số lượng đã bán (để tính best seller)
            },
          },
        },
      }));

      await Product.bulkWrite(bulkOps);
    }

    // ---------------------------------------------------------
    // BƯỚC 4: DỌN DẸP GIỎ HÀNG & PHẢN HỒI
    // ---------------------------------------------------------
    await Cart.findOneAndDelete({ user: req.user._id });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Lỗi tạo hóa đơn:", error);
    res.status(500).json({ message: "Lỗi hệ thống", error: error.message });
  }
};

// 2. LẤY DANH SÁCH CỦA TÔI (USER)
export const getMyInvoices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find({ user: req.user._id })
        .populate("user", "name email")
        .populate("items.product_id", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Invoice.countDocuments({ user: req.user._id }),
    ]);

    res.status(200).json({
      invoices,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy hóa đơn của bạn" });
  }
};

// 3. LẤY TẤT CẢ (ADMIN)
export const getAllInvoices = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find()
        .populate("user", "name email")
        .populate("items.product_id", "name price")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Invoice.countDocuments(),
    ]);

    res.status(200).json({
      invoices,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy toàn bộ hóa đơn" });
  }
};

// 4. CẬP NHẬT TRẠNG THÁI (ADMIN)
export const updateInvoiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    invoice.status = status;
    await invoice.save();

    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// 5. XEM CHI TIẾT 1 ĐƠN (Cả Admin và User)
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("items.product_id", "name price avatar");

    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    // 🔥 LOGIC PHÂN QUYỀN 🔥
    if (
      req.user.role !== "admin" &&
      invoice.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem hóa đơn này" });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};

// 6. API CHUNG: User thấy đơn của họ, Admin thấy toàn bộ
export const getInvoices = async (req, res) => {
  try {
    let invoices;

    if (req.user.role === "admin") {
      invoices = await Invoice.find()
        .sort({ createdAt: -1 })
        .populate("user", "name email phone")
        .populate("items.product_id", "name price avatar");
    } else {
      invoices = await Invoice.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .populate("items.product_id", "name price avatar");
    }

    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
};

// 7. HÀM XÓA HÓA ĐƠN
export const deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);
    if (!invoice) {
      return res.status(404).json({ message: "Hóa đơn không tồn tại" });
    }

    await Invoice.findByIdAndDelete(id);

    return res.status(200).json({ message: "Đã xóa hóa đơn thành công" });
  } catch (error) {
    console.error("Lỗi xóa hóa đơn:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa hóa đơn" });
  }
};
