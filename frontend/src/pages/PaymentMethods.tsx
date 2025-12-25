import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const PaymentMethods = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary uppercase">
          Hình Thức Thanh Toán
        </h1>

        <p className="mb-4 text-xl">
          Để thuận tiện cho Quý khách hàng khi mua sắm tại{" "}
          <strong>KPPaint</strong>, chúng tôi hỗ trợ các phương thức thanh toán
          linh hoạt và an toàn sau đây:
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            1. Thanh toán tiền mặt khi nhận hàng (COD)
          </h2>
          <p className="text-xl mb-2">
            Đây là hình thức được nhiều khách hàng lựa chọn nhất. Quý khách sẽ
            thanh toán trực tiếp cho nhân viên giao hàng ngay khi nhận được sản
            phẩm.
          </p>
          <ul className="list-disc pl-6 space-y-1 text-xl">
            <li>Áp dụng cho tất cả các đơn hàng trên toàn quốc.</li>
            <li>
              Quý khách vui lòng kiểm tra kỹ hàng hóa trước khi thanh toán.
            </li>
          </ul>
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            2. Thanh toán qua Ví điện tử / QR Code
          </h2>
          <p className="text-xl">
            Tại bước thanh toán trên website, Quý khách có thể lựa chọn thanh
            toán qua cổng <strong>MOMO</strong> hoặc quét mã{" "}
            <strong>QR Ngân hàng</strong> để giao dịch được xử lý tự động và
            nhanh chóng.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">Lưu ý</h2>
          <p className="text-xl">
            Mọi giao dịch thanh toán đều được bảo mật. Nếu sau khi chuyển khoản
            mà đơn hàng chưa được xác nhận, Quý khách vui lòng liên hệ Hotline:{" "}
            <strong>07xx xxx xxx</strong> để được hỗ trợ kiểm tra ngay lập tức.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default PaymentMethods;
