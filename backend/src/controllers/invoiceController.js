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
  const id = req.params.id;
  console.log("REQ.PARAMS.ID:", id);

  try {
    // Kiểm tra xem ID có hợp lệ ObjectId không
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "ID không hợp lệ" });
    }

    // Tìm invoice
    const invoice = await Invoice.findById(id)
      .populate("user", "name email")
      .populate("items.product_id", "name price");

    console.log("FIND INVOICE RESULT:", invoice);

    if (!invoice) {
      return res.status(404).json({ message: "Không tìm thấy hoá đơn" });
    }

    // Nếu là user thường, chỉ được xem hoá đơn của mình
    if (
      req.user.role !== "admin" &&
      invoice.user._id.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: "Bạn không có quyền xem hoá đơn này" });
    }

    res.json(invoice);
  } catch (error) {
    console.error("ERROR GET INVOICE:", error);
    res.status(500).json({ message: "Lỗi server", detail: error.message });
  }
};
