import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  TicketPercent,
  Clock,
  ArrowRight,
  Loader2,
  X,
  Gift,
} from "lucide-react";

// --- CONFIG SERVER ---
const SERVER_BASE_URL = "http://localhost:5001";

// --- TYPE DEFINITIONS ---
type Discount = {
  _id: string;
  name: string;
  discount_percent: number;
  // Bạn có thể thêm description hoặc target_type nếu BE trả về
};

type SaleProgram = {
  _id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  isActive: boolean;
  thumbnail?: string;
  discounts?: Discount[];
};

// Helper: Xử lý ảnh
const getFullImageUrl = (path?: string) => {
  // Ảnh mặc định set cứng theo yêu cầu của bạn
  const DEFAULT_IMAGE = `${SERVER_BASE_URL}/uploads/z7202827791249_3f9f56e84a986117c7fd0030d0bb593a.jpg`;

  if (!path) return DEFAULT_IMAGE;
  if (path.startsWith("http")) return path;

  let cleanPath = path.replace(/\\/g, "/");
  if (!cleanPath.startsWith("/")) cleanPath = `/${cleanPath}`;
  cleanPath = cleanPath.replace(/^\/public/, "");

  return `${SERVER_BASE_URL}${cleanPath}`;
};

// Helper: Format ngày
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

// --- COMPONENT MODAL CHI TIẾT ---
const SaleDetailModal: React.FC<{
  program: SaleProgram | null;
  onClose: () => void;
}> = ({ program, onClose }) => {
  if (!program) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Overlay nền đen mờ */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Nội dung Modal */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-white/80 hover:bg-white rounded-full text-gray-600 hover:text-red-500 transition-colors shadow-sm"
        >
          <X size={20} />
        </button>

        {/* Header: Ảnh Banner */}
        <div className="h-48 sm:h-64 w-full bg-gray-100 relative">
          <img
            src={getFullImageUrl(program.thumbnail)}
            alt={program.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = getFullImageUrl("");
            }}
          />
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-6 pt-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              {program.name}
            </h2>
            <div className="flex items-center gap-2 text-white/90 text-sm mt-2">
              <Clock size={14} />
              <span>
                {formatDate(program.start_date)} -{" "}
                {formatDate(program.end_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Body: Nội dung chi tiết */}
        <div className="p-6 sm:p-8 max-h-[60vh] overflow-y-auto">
          {/* Mô tả */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">
              Thông tin chương trình
            </h3>
            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
              {program.description ||
                "Chương trình khuyến mãi đặc biệt dành cho khách hàng thân thiết."}
            </p>
          </div>

          {/* Danh sách Discount */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Gift className="text-orange-500" size={20} />
              Ưu đãi trong chương trình
            </h3>

            {program.discounts && program.discounts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {program.discounts.map((d) => (
                  <div
                    key={d._id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50 hover:border-orange-300 transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 text-sm">
                        {d.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Giảm trực tiếp
                      </span>
                    </div>
                    <div className="text-orange-600 font-bold text-lg">
                      -{d.discount_percent}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                Chi tiết ưu đãi đang được cập nhật.
              </div>
            )}
          </div>
        </div>

        {/* Footer: Nút hành động */}
        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 font-medium text-sm transition"
          >
            Đóng lại
          </button>
          <Link to="/san-pham">
            <button className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm shadow-lg shadow-orange-200 transition flex items-center gap-2">
              Mua Ngay <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT CHÍNH ---
const DiscountPage: React.FC = () => {
  const [promos, setPromos] = useState<SaleProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // State quản lý Modal
  const [selectedProgram, setSelectedProgram] = useState<SaleProgram | null>(
    null
  );

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await axios.get(`${SERVER_BASE_URL}/api/saleprogram`);
        const activePromos = res.data
          .filter((p: SaleProgram) => p.isActive)
          .sort(
            (a: SaleProgram, b: SaleProgram) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime()
          );
        setPromos(activePromos);
      } catch (error) {
        console.error("Lỗi tải danh sách khuyến mãi:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const filteredPromos = useMemo(() => {
    return promos.filter((p) =>
      p.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [promos, search]);

  const getMaxPercent = (program: SaleProgram) => {
    if (
      !program.discounts ||
      !Array.isArray(program.discounts) ||
      program.discounts.length === 0
    ) {
      return "Ưu đãi";
    }
    const percentages = program.discounts.map(
      (d) => Number(d.discount_percent) || 0
    );
    const max = Math.max(...percentages);
    if (max <= 0 || !isFinite(max)) return "Ưu đãi hấp dẫn";
    return `Giảm tới ${max}%`;
  };

  return (
    <>
      <Navbar />

      <div className="bg-gray-50 min-h-screen py-10">
        <div className="w-11/12 max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="bg-white shadow-sm rounded-2xl p-6 md:p-8 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-2">
                  <TicketPercent className="text-orange-500 w-8 h-8" />
                  <span>Săn Deal & Khuyến Mãi</span>
                </h1>
                <p className="text-gray-500 mt-2 text-sm md:text-base">
                  Tổng hợp các chương trình ưu đãi độc quyền từ KPPaint.
                </p>
              </div>
              <div className="relative w-full md:w-72">
                <input
                  type="text"
                  placeholder="Tìm chương trình..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-full pl-5 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="mb-6 px-2 text-sm text-gray-600 font-medium">
            Hiển thị {filteredPromos.length} chương trình đang diễn ra
          </div>

          {loading ? (
            <div className="flex flex-col justify-center items-center h-64">
              <Loader2 className="w-10 h-10 text-orange-500 animate-spin mb-3" />
              <div className="text-gray-500 font-medium">
                Đang tải ưu đãi...
              </div>
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <TicketPercent className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800">
                Chưa có ưu đãi nào
              </h3>
              <p className="text-gray-500 text-sm mt-1">
                Vui lòng quay lại sau nhé!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPromos.map((p) => (
                <div
                  key={p._id}
                  onClick={() => setSelectedProgram(p)} // 🚨 MỞ MODAL KHI CLICK
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden cursor-pointer"
                >
                  {/* Banner Image */}
                  <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={getFullImageUrl(p.thumbnail)}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = getFullImageUrl("");
                      }}
                    />

                    <div className="absolute top-3 left-3">
                      <span className="bg-white/90 backdrop-blur text-orange-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Clock size={12} />
                        Còn{" "}
                        {Math.ceil(
                          (new Date(p.end_date).getTime() - Date.now()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        ngày
                      </span>
                    </div>

                    {p.isActive && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                        Đang diễn ra
                      </div>
                    )}
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h3 className="font-bold text-lg text-gray-800 line-clamp-2 group-hover:text-orange-600 transition-colors">
                        {p.name}
                      </h3>
                      <div className="bg-orange-50 text-orange-600 px-2 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap border border-orange-100">
                        {getMaxPercent(p)}
                      </div>
                    </div>

                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                      {p.description ||
                        "Bấm để xem chi tiết các ưu đãi trong chương trình."}
                    </p>

                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center text-xs text-gray-500 mb-4">
                        <span>
                          HSD:{" "}
                          <span className="font-medium text-gray-700">
                            {formatDate(p.end_date)}
                          </span>
                        </span>
                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600">
                          Tự động áp dụng
                        </span>
                      </div>

                      <button className="w-full py-2.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2">
                        Xem Chi Tiết
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="h-10" />
        </div>
      </div>

      {/* 🚨 RENDER MODAL NẾU CÓ PROGRAM ĐƯỢC CHỌN */}
      {selectedProgram && (
        <SaleDetailModal
          program={selectedProgram}
          onClose={() => setSelectedProgram(null)}
        />
      )}

      <Footer />
    </>
  );
};

export default DiscountPage;
