import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const ContactPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="bg-white min-h-screen py-8">
        <div className="w-4/5 max-w-7xl mx-auto px-4">
          {/* Top hero with image + contact info */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start mb-6">
            <div className="lg:col-span-7">
              <div className="w-full h-64 md:h-72 lg:h-80 bg-gray-200 overflow-hidden">
                <img
                  src="http://localhost:5001/uploads/banner.jpg"
                  alt="painting"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white border-0.9 shadow p-6">
                <h3 className="text-lg font-semibold mb-3">
                  THÔNG TIN LIÊN HỆ
                </h3>
                <div className="text-sm text-gray-700 space-y-2">
                  <div className="font-semibold">
                    CÔNG TY TNHH THƯƠNG MẠI KPPAINT
                  </div>
                  <div>
                    Hotline: <span className="font-medium">07xx xxx xxx</span>
                  </div>
                  <div>
                    Email:{" "}
                    <span className="font-medium">windyspec30@gmail.com</span>
                  </div>
                  <div>
                    Website: <span className="font-medium">kppaint.com</span>
                  </div>
                  <div>
                    Người đại diện:{" "}
                    <span className="font-medium">Đỗ Thanh Phong</span>
                  </div>
                  <div>
                    Địa chỉ:{" "}
                    <span className="font-medium">
                      180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form + Map */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7">
              <div className="bg-white border-0.9 shadow p-6">
                <h4 className="text-base font-semibold mb-4">
                  GỬI THƯ ĐẾN CHÚNG TÔI
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className="bg-gray-100 border p-3 text-sm"
                    placeholder="Họ tên"
                  />
                  <input
                    className="bg-gray-100 border p-3 text-sm"
                    placeholder="Email"
                  />
                  <input
                    className="bg-gray-100 border p-3 text-sm"
                    placeholder="Số điện thoại"
                  />
                  <input
                    className="bg-gray-100 border p-3 text-sm"
                    placeholder="Địa chỉ"
                  />
                </div>

                <div className="mt-4">
                  <textarea
                    className="w-full bg-white border p-3 min-h-[160px] text-sm"
                    placeholder="Nội dung"
                  />
                </div>

                  <button className="ml-auto bg-orange-500 hover:bg-orange-700 text-white px-5 py-2 rounded text-sm">
                    GỬI THÔNG TIN CHO CHÚNG TÔI
                  </button>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="bg-white border-0.9 shadow p-4">
                <div className="text-sm font-medium mb-2">
                  Cửa hàng sơn KPPaint
                </div>
                <div className="w-full h-80 bg-gray-200 overflow-hidden">
                  <iframe
                    title="map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.961648495922!2d106.67768389999999!3d10.737439299999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752fad3fb62a95%3A0xa9576c84a879d1fe!2zMTgwIENhbyBM4buXLCBQaMaw4budbmcgNCwgUXXhuq1uIDgsIFRow6BuaCBwaOG7kSBI4buTIENow60gTWluaCA3MDAwMA!5e0!3m2!1svi!2s!4v1764131594084!5m2!1svi!2s"
                    className="w-full h-full border-0"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ContactPage;
