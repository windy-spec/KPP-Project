import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const GeneralPolicy = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary uppercase">
          Chính Sách và Quy Định Chung
        </h1>

        <p className="mb-4 text-xl">
          Chào mừng Quý khách đến với <strong>KPPaint</strong>. Dưới đây là
          những quy định chung nhằm đảm bảo quyền lợi của khách hàng cũng như
          trách nhiệm của chúng tôi trong quá trình cung cấp sản phẩm và dịch
          vụ.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            1. Trách nhiệm của KPPaint
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-xl">
            <li>
              Đảm bảo cung cấp sản phẩm chính hãng, đúng chất lượng, đúng mẫu mã
              như đã mô tả trên website.
            </li>
            <li>
              Tư vấn trung thực, chính xác về tính năng, công dụng của các loại
              sơn và dụng cụ.
            </li>
            <li>
              Bảo mật thông tin khách hàng theo Chính sách bảo mật đã công bố.
            </li>
            <li>
              Hỗ trợ giải quyết các khiếu nại, thắc mắc của khách hàng trong quá
              trình sử dụng sản phẩm.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            2. Trách nhiệm của Khách hàng
          </h2>
          <ul className="list-disc pl-6 space-y-1 text-xl">
            <li>
              Cung cấp đầy đủ, chính xác thông tin liên hệ, địa chỉ giao hàng để
              đảm bảo đơn hàng được xử lý nhanh chóng.
            </li>
            <li>
              Kiểm tra kỹ sản phẩm khi nhận hàng trước khi thanh toán hoặc ký
              nhận.
            </li>
            <li>
              Sử dụng sản phẩm theo đúng hướng dẫn kỹ thuật để đảm bảo an toàn
              và hiệu quả.
            </li>
            <li>
              Không sử dụng website để thực hiện các hành vi phá hoại, gian lận
              hoặc vi phạm pháp luật.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            3. Quy định về giá cả và thông tin sản phẩm
          </h2>
          <p className="text-xl">
            Giá bán niêm yết trên website là giá bán cuối cùng, đã bao gồm thuế
            VAT (nếu có) nhưng chưa bao gồm phí vận chuyển. Phí vận chuyển sẽ
            được hiển thị rõ ràng tại trang thanh toán hoặc được nhân viên thông
            báo khi xác nhận đơn hàng.
            <br />
            Trong trường hợp có sai sót về giá hoặc thông tin sản phẩm do lỗi hệ
            thống, KPPaint có quyền hủy đơn hàng và thông báo kịp thời đến Quý
            khách.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            4. Thay đổi quy định
          </h2>
          <p className="text-xl">
            KPPaint có quyền thay đổi, chỉnh sửa các quy định chung này bất cứ
            lúc nào để phù hợp với hoạt động kinh doanh và quy định của pháp
            luật. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên
            website.
          </p>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default GeneralPolicy;
