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
  ChevronLeft,
  Box,
  AlertCircle,
  Tag,
} from "lucide-react";

// --- CONFIG SERVER ---
const SERVER_BASE_URL = "http://localhost:5001";

// --- TYPE DEFINITIONS ---

// Item trong danh sách áp dụng (Có thể là Product hoặc Category)
type TargetItem = {
  _id: string;
  name: string;
  avatar?: string; // Có nếu là Product
  price?: number; // Có nếu là Product
};

// Chi tiết Discount (Lấy từ API /api/discount/:id)
type DiscountDetail = {
  _id: string;
  name: string;
  discount_percent: number;
  description?: string;
  target_type?: "PRODUCT" | "CATEGORY" | "ALL";
  target_ids?: TargetItem[];
  min_quantity?: number;
  start_sale: string;
  end_sale: string;
  isActive: boolean;
};

// SaleProgram
type SaleProgram = {
  _id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  isActive: boolean;
  thumbnail?: string;
  discounts?: { _id: string; name: string; discount_percent: number }[];
};

// --- HELPERS ---
const getFullImageUrl = (path?: string) => {
  // Ảnh mặc định (Fallback)
  const DEFAULT = `${SERVER_BASE_URL}/uploads/z7202827791249_3f9f56e84a986117c7fd0030d0bb593a.jpg`;

  if (!path) return DEFAULT;
  if (path.startsWith("http")) return path;

  // Xử lý đường dẫn (Windows \ -> /) và bỏ /public thừa
  let clean = path.replace(/\\/g, "/");
  if (!clean.startsWith("/")) clean = `/${clean}`;
  clean = clean.replace(/^\/public/, "");

  return `${SERVER_BASE_URL}${clean}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "---";
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatVND = (v?: number) =>
  v ? new Intl.NumberFormat("vi-VN").format(v) + " đ" : "";

// --- COMPONENT MODAL ---
const SaleDetailModal: React.FC<{
  program: SaleProgram | null;
  onClose: () => void;
}> = ({ program, onClose }) => {
  // State quản lý ID discount đang xem
  const [selectedDiscountId, setSelectedDiscountId] = useState<string | null>(
    null
  );
  const [discountDetail, setDiscountDetail] = useState<DiscountDetail | null>(
    null
  );
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Fetch chi tiết khi click vào 1 dòng discount
  useEffect(() => {
    if (!selectedDiscountId) {
      setDiscountDetail(null);
      return;
    }
    const fetchDetail = async () => {
      setLoadingDetail(true);
      try {
        const res = await axios.get(
          `${SERVER_BASE_URL}/api/discount/${selectedDiscountId}`
        );
        setDiscountDetail(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingDetail(false);
      }
    };
    fetchDetail();
  }, [selectedDiscountId]);

  if (!program) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Container */}
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
        {/* ========================================================= */}
        {/* VIEW 1: CHI TIẾT DISCOUNT (SUB-VIEW)                      */}
        {/* ========================================================= */}
        {selectedDiscountId ? (
          <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="p-4 border-b flex items-center gap-3 bg-gray-50">
              <button
                onClick={() => setSelectedDiscountId(null)}
                className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition text-gray-700"
              >
                <ChevronLeft size={20} />
              </button>
              <h3 className="font-bold text-lg text-gray-800 flex-1">
                Chi tiết ưu đãi
              </h3>
              <button onClick={onClose}>
                <X size={20} className="text-gray-500 hover:text-red-500" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {loadingDetail ? (
                <div className="flex justify-center py-10 flex-col items-center">
                  <Loader2 className="animate-spin text-orange-500 w-10 h-10 mb-2" />
                  <span className="text-gray-500 text-sm">
                    Đang tải dữ liệu...
                  </span>
                </div>
              ) : discountDetail ? (
                <div className="space-y-6">
                  {/* Info Header */}
                  <div className="flex justify-between items-center border-b pb-4 border-dashed">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {discountDetail.name}
                      </h2>
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Tag size={14} />
                        <span>
                          Loại:{" "}
                          {discountDetail.target_type === "ALL"
                            ? "Toàn sàn"
                            : discountDetail.target_type === "CATEGORY"
                            ? "Theo danh mục"
                            : "Sản phẩm chỉ định"}
                        </span>
                      </div>
                    </div>
                    <div className="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold text-2xl border border-orange-100 whitespace-nowrap">
                      -{discountDetail.discount_percent}%
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-blue-800">
                      <div className="font-semibold flex items-center gap-2 mb-1">
                        <Clock size={16} /> Thời gian:
                      </div>
                      <div>
                        {formatDate(discountDetail.start_sale)} -{" "}
                        {formatDate(discountDetail.end_sale)}
                      </div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 text-purple-800">
                      <div className="font-semibold flex items-center gap-2 mb-1">
                        <AlertCircle size={16} /> Điều kiện:
                      </div>
                      <div>
                        Mua tối thiểu {discountDetail.min_quantity || 1} sản
                        phẩm
                      </div>
                    </div>
                  </div>

                  {/* Target Items List */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-lg">
                      <Box className="text-orange-500" size={20} /> Phạm vi áp
                      dụng
                    </h4>

                    {discountDetail.target_ids &&
                    discountDetail.target_ids.length > 0 ? (
                      /* LOGIC HIỂN THỊ THEO LOẠI */
                      discountDetail.target_type === "PRODUCT" ? (
                        // Dạng Sản Phẩm: Ảnh + Tên + Giá
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {discountDetail.target_ids.map((item) => (
                            <Link
                              to={`/san-pham/${item._id}`}
                              key={item._id}
                              className="flex gap-3 p-2 border border-gray-200 rounded-xl items-center hover:border-orange-400 bg-white transition group hover:shadow-sm"
                            >
                              <img
                                src={getFullImageUrl(item.avatar)}
                                className="w-14 h-14 object-cover rounded-lg border bg-gray-50"
                                alt={item.name}
                                onError={(e) => {
                                  e.currentTarget.src = getFullImageUrl("");
                                }}
                              />
                              <div className="overflow-hidden flex-1">
                                <div className="text-sm font-medium text-gray-800 truncate group-hover:text-orange-600">
                                  {item.name}
                                </div>
                                <div className="text-xs text-red-500 font-bold mt-1">
                                  {formatVND(item.price)}
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        // Dạng Danh Mục: Thẻ Tag
                        <div className="flex flex-wrap gap-2">
                          {discountDetail.target_ids.map((item) => (
                            <div
                              key={item._id}
                              className="bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 border"
                            >
                              <Tag size={14} /> {item.name}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      // Trường hợp ALL hoặc mảng rỗng
                      <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed text-gray-500">
                        {discountDetail.target_type === "ALL"
                          ? "Áp dụng cho TOÀN BỘ sản phẩm trong cửa hàng."
                          : "Đang cập nhật danh sách."}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-500">
                  Lỗi tải dữ liệu.
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white">
              <Link to="/san-pham" className="block w-full">
                <button className="w-full py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-100">
                  Mua Sản Phẩm Ngay
                </button>
              </Link>
            </div>
          </div>
        ) : (
          /* ========================================================= */
          /* VIEW 2: DANH SÁCH CHƯƠNG TRÌNH (MAIN VIEW)                */
          /* ========================================================= */
          <>
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/80 rounded-full text-gray-600 hover:text-red-500 transition shadow-sm"
            >
              <X size={20} />
            </button>

            {/* Banner */}
            <div className="h-48 sm:h-60 w-full bg-gray-200 relative flex-shrink-0">
              <img
                src={getFullImageUrl(program.thumbnail)}
                alt={program.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getFullImageUrl("");
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-6 pt-24">
                <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                  {program.name}
                </h2>
                <div className="text-white/90 text-sm mt-2 flex items-center gap-2 opacity-90">
                  <Clock size={14} /> {formatDate(program.start_date)} -{" "}
                  {formatDate(program.end_date)}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-800 mb-3">
                  Thông tin chương trình
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100">
                  {program.description ||
                    "Chương trình khuyến mãi đặc biệt dành cho khách hàng."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Gift className="text-orange-500" size={20} /> Ưu đãi trong
                  chương trình
                </h3>

                <div className="grid gap-3">
                  {program.discounts?.map((d) => (
                    <div
                      key={d._id}
                      onClick={() => setSelectedDiscountId(d._id)} // CLICK XEM CHI TIẾT
                      className="flex justify-between items-center p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:shadow-md cursor-pointer transition-all group bg-white relative overflow-hidden"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 group-hover:opacity-100 transition"></div>
                      <div>
                        <span className="font-bold text-gray-800 block group-hover:text-orange-600 transition">
                          {d.name}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          Bấm để xem chi tiết <ArrowRight size={12} />
                        </div>
                      </div>
                      <div className="text-orange-600 font-extrabold text-xl bg-orange-50 px-3 py-1 rounded-lg">
                        -{d.discount_percent}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <span className="text-xs text-gray-500 italic hidden sm:block">
                Ưu đãi áp dụng tự động
              </span>
              <div className="flex gap-3 w-full sm:w-auto">
                <button
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-200 font-medium text-sm transition"
                >
                  Đóng
                </button>
                <Link to="/san-pham" className="flex-1 sm:flex-none">
                  <button className="w-full px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-sm shadow-lg transition">
                    Mua Ngay
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// --- MAIN PAGE ---
const DiscountPage: React.FC = () => {
  const [promos, setPromos] = useState<SaleProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<SaleProgram | null>(
    null
  );

  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const res = await axios.get(`${SERVER_BASE_URL}/api/saleprogram`);
        const activePromos = res.data
          .filter((p: any) => p.isActive)
          .sort(
            (a: any, b: any) =>
              new Date(b.start_date).getTime() -
              new Date(a.start_date).getTime()
          );
        setPromos(activePromos);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPromos();
  }, []);

  const filteredPromos = useMemo(
    () =>
      promos.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [promos, search]
  );
  const getMaxPercent = (p: SaleProgram) => {
    const max = Math.max(
      ...(p.discounts?.map((d) => d.discount_percent) || [0])
    );
    return max <= 0 || !isFinite(max) ? "Hot" : `Giảm tới ${max}%`;
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-10">
        <div className="w-11/12 max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="bg-white shadow-sm rounded-2xl p-6 mb-8 border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                <TicketPercent className="text-orange-500" /> Săn Deal & Khuyến
                Mãi
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Tổng hợp các ưu đãi mới nhất từ KPPaint.
              </p>
            </div>
            <input
              type="text"
              placeholder="Tìm chương trình..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border border-gray-300 rounded-full px-4 py-2 text-sm w-full md:w-64 outline-none focus:ring-2 focus:ring-orange-500 transition"
            />
          </div>

          {loading ? (
            <div className="flex justify-center h-64 items-center">
              <Loader2 className="animate-spin text-orange-500 w-10 h-10" />
            </div>
          ) : filteredPromos.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-xl shadow-sm">
              Chưa có chương trình nào đang diễn ra.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {filteredPromos.map((p) => (
                <div
                  key={p._id}
                  onClick={() => setSelectedProgram(p)}
                  className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden cursor-pointer relative"
                >
                  {/* Card Image */}
                  <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                    <img
                      src={getFullImageUrl(p.thumbnail)}
                      alt={p.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      onError={(e) => {
                        e.currentTarget.src = getFullImageUrl("");
                      }}
                    />
                    <div className="absolute bottom-3 right-3 bg-orange-600 text-white px-3 py-1 rounded-lg text-sm font-extrabold shadow-md">
                      {getMaxPercent(p)}
                    </div>

                    {/* Active Badge */}
                    <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                      Đang diễn ra
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-2 group-hover:text-orange-600 transition-colors mb-2">
                      {p.name}
                    </h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-4 flex-1">
                      {p.description || "Bấm vào để xem chi tiết các ưu đãi."}
                    </p>
                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} /> {formatDate(p.end_date)}
                      </span>
                      {/* Stop Propagation để nút Mua Ngay không mở Modal */}
                      <Link
                        to="/san-pham"
                        onClick={(e) => e.stopPropagation()}
                        className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg font-bold hover:bg-orange-500 hover:text-white transition"
                      >
                        Mua Ngay
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="h-10" />
        </div>
      </div>

      {/* Render Modal */}
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
