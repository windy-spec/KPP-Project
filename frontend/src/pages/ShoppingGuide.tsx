import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const ShoppingGuide = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary uppercase">
          Hướng Dẫn Mua Hàng
        </h1>

        <p className="mb-4 text-xl">
          Mua sắm tại <strong>KPPaint</strong> thật đơn giản và tiện lợi. Quý
          khách chỉ cần làm theo các bước sau đây để đặt hàng nhanh chóng:
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            Bước 1: Tìm kiếm sản phẩm
          </h2>
          <p className="text-xl">
            Quý khách có thể tìm kiếm sản phẩm theo 2 cách:
            <br />- Gõ tên sản phẩm vào thanh tìm kiếm ở đầu trang web.
            <br />- Duyệt qua "Danh mục sản phẩm" (Sơn nước, Sơn xịt, Dụng
            cụ...) để chọn sản phẩm phù hợp.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            Bước 2: Thêm vào giỏ hàng
          </h2>
          <p className="text-xl">
            Tại trang chi tiết sản phẩm, Quý khách chọn{" "}
            <strong>Số lượng</strong> mong muốn và nhấn nút{" "}
            <strong>"Thêm vào giỏ hàng"</strong>. Quý khách có thể tiếp tục mua
            sắm các sản phẩm khác hoặc chuyển sang bước thanh toán.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            Bước 3: Kiểm tra giỏ hàng
          </h2>
          <p className="text-xl">
            Nhấn vào biểu tượng <strong>Giỏ hàng</strong> ở góc trên bên phải.
            Tại đây, Quý khách có thể điều chỉnh số lượng, xóa bớt sản phẩm hoặc
            nhập mã giảm giá (nếu có). Sau đó nhấn <strong>"Thanh toán"</strong>
            .
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            Bước 4: Nhập thông tin và thanh toán
          </h2>
          <p className="text-xl mb-2">
            - <strong>Đăng nhập:</strong> Nếu đã có tài khoản (lưu lịch sử).
            <br />- <strong>Mua ngay:</strong> Điền đầy đủ thông tin: Họ tên, Số
            điện thoại, Địa chỉ nhận hàng.
          </p>
          <p className="text-xl">
            Chọn phương thức thanh toán phù hợp (COD, Chuyển khoản...) và nhấn{" "}
            <strong>"Đặt hàng"</strong>.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            Bước 5: Xác nhận đơn hàng
          </h2>
          <p className="text-xl">
            Hệ thống sẽ cập nhật đơn hàng vào trong mục Quản lý đơn hàng của quý
            khách, người dùng có thể truy cập vào đó để kiểm tra.
          </p>
        </section>

        <section className="mt-8 pt-4 border-t">
          <p className="text-xl italic">
            Cần hỗ trợ đặt hàng nhanh? Gọi ngay Hotline:{" "}
            <strong className="text-orange-500">07xx xxx xxx</strong>
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ShoppingGuide;
