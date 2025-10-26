import React from "react";
import { Facebook, Instagram, Linkedin, Mail, MapPin } from "lucide-react";

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-50 text-gray-700">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Mô tả + link*/}
          <div>
            <div className="flex items-center gap-3">
              <img src="/logo22.svg" alt="logo" className="w-12 h-12" />
              <span className="text-xl font-semibold">KPPaint</span>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Chúng tôi là đơn vị cung cấp sơn chất lượng cao, mang đến giải pháp tối ưu cho mọi công trình.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="facebook"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Facebook size={24} />
              </a>
              <a
                href="#"
                aria-label="instagram"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Instagram size={24} />
              </a>
              <a
                href="#"
                aria-label="linkedin"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Linkedin size={24} />
              </a>
              <a
                href="#"
                aria-label="email"
                className="p-2 bg-white rounded-md shadow-sm hover:text-orange-300 transition-all duration-300 cursor-pointer"
              >
                <Mail size={24} />
              </a>
            </div>
          </div>

          {/* Cửa hàng */}
          <div>
            <h3 className="font-bold mb-5">CỬA HÀNG</h3>
            <ul className="mt-4 space-y-2 list-disc list-inside text-md text-gray-700">
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Dụng cụ sơn</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Chống thấm</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Sơn xịt</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Sơn nước</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Sơn sắt mạ kẽm</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Sơn xe máy</li>
            </ul>
          </div>

          {/* QD&CS */}
          <div>
            <h3 className="font-bold mb-5">QUY ĐỊNH & CHÍNH SÁCH</h3>
            <ul className="mt-4 space-y-2 list-disc list-inside text-md text-gray-700">
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Chính sách và quy định chung</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Chính sách bảo mật</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Điều khoản dịch vụ</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Hình thức thanh toán</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Hướng dẫn mua hàng</li>
              <li className="hover:text-orange-300 transition-all duration-300 cursor-pointer">Giao hàng và vận chuyển</li>
            </ul>
          </div>

          {/* Liên hệ */}
          <div>
            <h3 className="font-bold mb-5">LIÊN HỆ</h3>
            <div className="mt-4 text-sm text-gray-600 space-y-3">
              <div>
                <div className="font-semibold">Có thắc mắc? Gọi cho chúng tôi</div>
                <span className="mt-1 font-bold text-lg hover:text-orange-300 transition-all duration-300 cursor-pointer">
                  <a href="#">+84 07xx xxx xxx</a>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span className="text-lg hover:text-orange-300 transition-all duration-300 cursor-pointer">
                  <a href="mailto:windyspec30@gmail.com">windyspec30@gmail.com</a>
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={18}/>
                <a href="https://www.google.com/maps/place/180+Cao+L%E1%BB%97,+Ph%C6%B0%E1%BB%9Dng+4,+Qu%E1%BA%ADn+8,+Th%C3%A0nh+ph%E1%BB%91+H%E1%BB%93+Ch%C3%AD+Minh+70000,+Vi%E1%BB%87t+Nam/@10.7374393,106.675109,17z/data=!3m1!4b1!4m6!3m5!1s0x31752fad3fb62a95:0xa9576c84a879d1fe!8m2!3d10.7374393!4d106.6776839!16s%2Fg%2F11kqgt034q?entry=ttu&g_ep=EgoyMDI1MTAyMi4wIKXMDSoASAFQAw%3D%3D" target="_blank">
                  <span className="text-lg hover:text-orange-300 transition-all duration-300 cursor-pointer">
                    180 Đường Cao Lỗ Quận 8
                    <br />
                    Phường 15, TP. Hồ Chí Minh
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* copy right */}
        <div className="mt-8">
          <div className="h-px bg-gray-200" />
          <div className="mt-6 text-center text-sm text-gray-500">© 2025 KPPaint. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;