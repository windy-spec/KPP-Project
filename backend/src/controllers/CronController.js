import Invoice from "../models/Invoice.js";

export const autoUpdateOrderStatus = async () => {
  try {
    // Chỉ tìm đơn hàng đang giao (SHIPPING) và có thời gian bắt đầu giao (shipped_at)
    const shippingOrders = await Invoice.find({
      order_status: "SHIPPING",
      shipped_at: { $ne: null },
    });

    if (shippingOrders.length === 0) return; // Không có đơn thì thoát luôn cho nhẹ

    const now = new Date();

    for (const order of shippingOrders) {
      // Tính thời gian đã trôi qua (đổi ra ngày)
      const timeDiff = now - new Date(order.shipped_at);
      const daysPassed = timeDiff / (1000 * 60 * 60 * 24);

      // Lấy địa chỉ và chuyển về chữ thường để so sánh chuẩn xác
      const address = order.recipient_info?.address?.toLowerCase() || "";
      let shouldComplete = false;

      // --- LOGIC NHẬN DIỆN CHUẨN VỚI FRONTEND ---

      // 1. Trường hợp: TP. Hồ Chí Minh (Frontend gửi "TP. Hồ Chí Minh")
      // Logic: 3 ngày
      if (address.includes("hồ chí minh")) {
        if (daysPassed >= 1) shouldComplete = true;
      }

      // 2. Trường hợp: Hà Nội (Frontend gửi "Hà Nội")
      // Logic: 7 ngày
      else if (address.includes("hà nội")) {
        if (daysPassed >= 2) shouldComplete = true;
      }

      // 3. Fallback (Dự phòng)
      // Nếu vì lý do gì đó địa chỉ không khớp cả 2 (VD: dữ liệu cũ), ta để mặc định an toàn là 7 ngày
      else {
        if (daysPassed >= 7) shouldComplete = true;
      }

      // --- CẬP NHẬT NẾU ĐỦ ĐIỀU KIỆN ---
      if (shouldComplete) {
        order.order_status = "COMPLETED";

        // Nếu là COD và chưa thanh toán -> Tự động set PAID (giả định shipper đã thu tiền)
        if (
          order.payment_method === "COD" &&
          order.payment_status === "UNPAID"
        ) {
          order.payment_status = "PAID";
        }

        await order.save();
        console.log(`✅ [AUTO] Đơn hàng ${order._id} đã tự động hoàn thành.`);
      }
    }
  } catch (error) {
    console.error("❌ Lỗi Cron Job:", error);
  }
};

// TEST
// import Invoice from "../models/Invoice.js";

// export const autoUpdateOrderStatus = async () => {
//   try {
//     const shippingOrders = await Invoice.find({
//       order_status: "SHIPPING",
//       shipped_at: { $ne: null },
//     });

//     if (shippingOrders.length === 0) return;

//     const now = new Date();

//     for (const order of shippingOrders) {
//       // 🔥 [CHẾ ĐỘ TEST] Tính chênh lệch theo PHÚT
//       const timeDiff = now - new Date(order.shipped_at);
//       const minutesPassed = timeDiff / (1000 * 60); // Chia cho 60.000 để ra phút

//       const address = order.recipient_info?.address?.toLowerCase() || "";
//       let shouldComplete = false;

//       // 1. HCM: 5 phút
//       if (address.includes("hồ chí minh")) {
//         if (minutesPassed >= 5) shouldComplete = true;
//       }

//       // 2. Hà Nội: 7 phút
//       else if (address.includes("hà nội")) {
//         if (minutesPassed >= 7) shouldComplete = true;
//       }

//       // 3. Khác: 7 phút (Fallback)
//       else {
//         if (minutesPassed >= 7) shouldComplete = true;
//       }

//       if (shouldComplete) {
//         order.order_status = "COMPLETED";

//         if (
//           order.payment_method === "COD" &&
//           order.payment_status === "UNPAID"
//         ) {
//           order.payment_status = "PAID";
//         }

//         await order.save();
//         console.log(
//           `✅ [TEST SUCCESS] Đơn ${order._id} đã tự hoàn thành sau ${Math.floor(
//             minutesPassed
//           )} phút.`
//         );
//       }
//     }
//   } catch (error) {
//     console.error("❌ Lỗi Cron Job:", error);
//   }
// };
