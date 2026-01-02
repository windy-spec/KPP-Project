import React from "react";
import { Facebook, Instagram, Linkedin, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom"; // 👈 Nhớ import Link

const Footer: React.FC = () => {
  // Cấu hình danh mục sản phẩm (ID lấy từ DB của bạn)
  const categories = [
    { name: "Bột trét tường", id: "692ade4b357e6c84295146ce" },
    { name: "Dụng cụ sơn", id: "6903075803a32d9127756f3b" },
    { name: "Silicon & Keo xây dựng", id: "692ae80f357e6c8429514e19" },
    { name: "Sơn dầu", id: "692ae7f7357e6c8429514e15" },
    { name: "Sơn nước", id: "6903093203a32d9127756f46" },
    { name: "Sơn xịt", id: "6903073f03a32d9127756f38" },
  ];

  return (
    <footer className="bg-gray-50 text-gray-700">
      <div className="w-4/5 max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Cột 1: Thông tin chung */}
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo22.svg" alt="logo" className="w-12 h-12" />
              <span className="text-xl font-semibold">KPPaint</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Chúng tôi là đơn vị cung cấp sơn chất lượng cao, mang đến giải
              pháp tối ưu cho mọi công trình.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Facebook size={24} />
              </a>
              <a
                href="#"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Instagram size={24} />
              </a>
              <a
                href="#"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Linkedin size={24} />
              </a>
              <a
                href="#"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Mail size={24} />
              </a>
            </div>
          </div>

          {/* Cột 2: Cửa hàng (Dynamic Link) */}
          <div>
            <h3 className="font-bold mb-5">CỬA HÀNG</h3>
            <ul className="mt-4 space-y-2 list-disc list-inside text-md text-gray-700">
              {categories.map((cat) => (
                <li
                  key={cat.id || cat.name}
                  className="hover:text-orange-300 transition-all duration-300 cursor-pointer"
                >
                  <Link to={`/san-pham?categories=${cat.id}`}>{cat.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Cột 3: Quy định & Chính sách */}
          <div>
            <h3 className="font-bold mb-5">QUY ĐỊNH & CHÍNH SÁCH</h3>
            <ul className="mt-4 space-y-2 list-disc list-inside text-md text-gray-700">
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">
                <Link to="/chinh-sach-quy-dinh">
                  Chính sách và quy định chung
                </Link>
              </li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">
                <Link to="/chinh-sach-bao-mat">Chính sách bảo mật</Link>
              </li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">
                <Link to="/dieu-khoan-dich-vu">Điều khoản dịch vụ</Link>
              </li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">
                <Link to="/hinh-thuc-thanh-toan">Hình thức thanh toán</Link>
              </li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">
                <Link to="/huong-dan-mua-hang">Hướng dẫn mua hàng</Link>
              </li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">
                <Link to="/giao-hang-van-chuyen">Giao hàng và vận chuyển</Link>
              </li>
            </ul>
          </div>

          {/* Cột 4: Liên hệ */}
          <div>
            <h3 className="font-bold mb-5">LIÊN HỆ</h3>
            <div className="mt-4 text-sm text-gray-600 space-y-3">
              <div>
                <div className="font-semibold">
                  Có thắc mắc? Gọi cho chúng tôi
                </div>
                <span className="mt-1 font-bold text-lg hover:text-orange-300 transition-all duration-300 cursor-pointer">
                  <a href="#">+84 07xx xxx xxx</a>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span className="text-lg hover:text-orange-300 transition-all duration-300 cursor-pointer">
                  <a href="mailto:windyspec30@gmail.com">
                    windyspec30@gmail.com
                  </a>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={18} />
                <a
                  href="https://www.google.com/maps/place/180+Cao+L%E1%BB%97,+Ph%C6%B0%E1%BB%9Dng+4,+Qu%E1%BA%ADn+8,+Th%C3%A0nh+ph%E1%BB%91+H%E1%BB%93+Ch%C3%AD+Minh+70000,+Vi%E1%BB%87t+Nam/@10.7374393,106.675109,17z/data=!3m1!4b1!4m6!3m5!1s0x31752fad3fb62a95:0xa9576c84a879d1fe!8m2!3d10.7374393!4d106.6776839!16s%2Fg%2F11kqgt034q?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D"
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="text-lg hover:text-orange-300 transition-all duration-300 cursor-pointer">
                    180 Cao Lỗ Quận 8
                    <br />
                    Phường 4, TP. Hồ Chí Minh
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8">
          <div className="h-px bg-gray-200" />
          <div className="mt-6 text-center text-sm text-gray-500">
            © 2025 KPPaint. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
