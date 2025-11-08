import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";
import React, { useState } from "react";

type Promo = {
  id: string;
  title: string;
  percent: number | string;
  code?: string;
  image?: string;
  validUntil?: string;
  description?: string;
};

const SAMPLE_PROMOS: Promo[] = [
  {
    id: "p1",
    title: "Giảm 20% toàn bộ sơn nội thất",
    percent: 20,
    code: "SON20",
    image: "/assets/background/banner/discount1.jpg",
    validUntil: "31/12/2025",
    description: "Áp dụng cho đơn hàng trên 1.000.000 đ",
  },
  {
    id: "p2",
    title: "Mua 2 tặng 1 - Sơn ngoại thất",
    percent: "Mua 2 Tặng 1",
    code: "BUY2GET1",
    image: "/assets/background/banner/discount2.jpg",
    validUntil: "30/11/2025",
    description: "Áp dụng cho mã sơn ngoại thất thương hiệu X",
  },
  {
    id: "p3",
    title: "Giảm 10% cho khách hàng mới",
    percent: 10,
    code: "WELCOME10",
    image: "/assets/background/banner/discount3.jpg",
    validUntil: "31/01/2026",
    description: "Dùng 1 lần cho tài khoản mới đăng ký",
  },
];

const DiscountPage: React.FC = () => {
  const [search, setSearch] = useState("");

  const filteredPromos = SAMPLE_PROMOS.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />

      <div className="bg-white min-h-screen py-10">
        <div className="w-11/12 max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white shadow-md rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Chiết Khấu & Khuyến Mãi</h1>
                <p className="text-gray-600 mt-2 text-sm">
                  Cập nhật các ưu đãi và mã giảm giá mới nhất cho sản phẩm của chúng tôi.
                </p>
              </div>

              {/* Search + Filter */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">

                <select className="border border-gray-300 rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option>Liên quan</option>
                  <option>Gần hết hạn</option>
                  <option>Mới nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Thông tin tổng */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <p>Hiển thị {filteredPromos.length} chương trình khuyến mãi</p>
          </div>

          {/* Promo grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPromos.map((p) => (
              <div
                key={p.id}
                className=" bg-white rounded-2xl shadow hover:shadow-lg transition-shadow duration-200 overflow-hidden border border-gray-100"
              >
                <div className="w-full h-48 bg-gray-100">
                  <img
                    src={p.image || "/placeholder-400x200.png"}
                    alt={p.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-5 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-ml text-gray-800">{p.title}</h3>
                      <p className="text-ml text-gray-500 mt-1">{p.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-orange-600 font-bold text-xl">
                        {typeof p.percent === "number" ? `${p.percent}%` : p.percent}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        HSD: {p.validUntil}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="text-xs text-gray-500">Mã giảm</div>
                      <div className="font-semibold text-gray-800">{p.code || "—"}</div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full text-sm shadow-sm transition">
                        Sao chép mã
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Spacer */}
          <div className="h-10" />
        </div>
      </div>

      <Footer />
    </>
  );
};

export default DiscountPage;
