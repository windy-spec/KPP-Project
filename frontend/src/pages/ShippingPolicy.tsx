import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const ShippingPolicy = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary uppercase">
          Giao Hàng và Vận Chuyển
        </h1>

        <p className="mb-4 text-xl">
          <strong>KPPaint</strong> cam kết mang đến dịch vụ giao hàng nhanh
          chóng, an toàn để sản phẩm đến tay Quý khách hàng trong tình trạng tốt
          nhất.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            1. Phạm vi giao hàng
          </h2>
          <p className="text-xl">
            Chúng tôi hỗ trợ giao hàng trên <strong>toàn quốc</strong>. Dù Quý
            khách ở bất kỳ tỉnh thành nào, KPPaint đều có thể gửi sản phẩm đến
            tận nơi thông qua các đơn vị vận chuyển uy tín (Viettel Post, Giao
            Hàng Tiết Kiệm, Ahamove...).
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            2. Thời gian giao hàng
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-xl">
            <li>
              <strong>Khu vực TP. Hồ Chí Minh:</strong> Giao trong ngày hoặc 1-2
              ngày làm việc. Có hỗ trợ giao hỏa tốc theo yêu cầu (có tính phí).
            </li>
            <li>
              <strong>Các tỉnh thành khác:</strong> Thời gian giao hàng từ 2-5
              ngày làm việc tùy thuộc vào khoảng cách địa lý và đơn vị vận
              chuyển.
            </li>
          </ul>
          <p className="mt-2 text-xl italic text-gray-600">
            * Lưu ý: Thời gian giao hàng có thể bị ảnh hưởng bởi các yếu tố
            khách quan như thiên tai, dịch bệnh hoặc các dịp Lễ, Tết.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            3. Phí vận chuyển
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-xl">
            <li>
              Phí vận chuyển sẽ được tính toán dựa trên trọng lượng đơn hàng và
              địa chỉ nhận hàng của Quý khách theo biểu phí của đơn vị vận
              chuyển.
            </li>
            <li>
              <strong>Miễn phí vận chuyển:</strong> Áp dụng cho các đơn hàng có
              giá trị lớn (theo chính sách khuyến mãi từng thời điểm) hoặc trong
              bán kính quy định tại TP. HCM.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            4. Chính sách kiểm hàng
          </h2>
          <p className="text-xl">
            KPPaint khuyến khích Quý khách <strong>kiểm tra hàng hóa</strong>{" "}
            ngay khi nhận hàng từ nhân viên vận chuyển.
            <br />
            - Nếu sản phẩm bị lỗi, hư hỏng, đổ vỡ hoặc sai mẫu mã, vui lòng từ
            chối nhận hàng và liên hệ ngay với chúng tôi để được đổi trả/gửi bù.
            <br />- Sau khi đã ký nhận, chúng tôi chỉ hỗ trợ đổi trả đối với các
            lỗi kỹ thuật từ nhà sản xuất.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ShippingPolicy;
