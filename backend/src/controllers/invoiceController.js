import Invoice from "../models/Invoice.js";

// Tạo hóa đơn mới
export const createInvoice = async (req, res) => {
  try {
    const {
      recipient_info,
      items,
      payment_method,
      shipping_fee,
      total_amount,
      momoOrderId,
    } = req.body;

    const invoice = await Invoice.create({
      user: req.userID,
      recipient_info,
      items,
      payment_method,
      shipping_fee,
      total_amount,
      momoOrderId: momoOrderId || undefined,
    });

    res.status(201).json(invoice);
  } catch (error) {
    console.error("Lỗi tạo hóa đơn:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Lấy danh sách hóa đơn của người dùng (KH)
export const getMyInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find({ user: req.userID }).sort({
      createdAt: -1,
    });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Lấy tất cả hóa đơn (ADMIN)
export const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .populate("user", "username email");
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
};

// Cập nhật trạng thái (chỉ admin)
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
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("user", "name email")
      .populate("items.product_id", "name price");

    if (!invoice)
      return res.status(404).json({ message: "Không tìm thấy hóa đơn" });

    // Nếu user role là 'user', kiểm tra quyền
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
