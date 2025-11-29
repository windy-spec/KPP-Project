import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "@/utils/api-user";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { Loader2, Printer, Filter, Trash2, Search, X } from "lucide-react";
import Swal from "sweetalert2";

// --- HELPER FORMATS ---
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateSafe = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "-"
    : `${date.getHours()}:${String(date.getMinutes()).padStart(
        2,
        "0"
      )} - ${date.toLocaleDateString("vi-VN")}`;
};

// --- INTERFACES ---
interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

interface InvoiceItem {
  product_id: { _id?: string; name: string; price: number } | null;
  quantity: number;
  price?: number;
  discount?: number;
}

interface Invoice {
  _id: string;
  createdAt: string;
  // 🔥 CẬP NHẬT: Thêm trường note vào recipient_info
  recipient_info?: {
    name: string;
    phone: string;
    address: string;
    note?: string;
  };
  user?: { name?: string; email?: string };
  items: InvoiceItem[];
  totalPrice?: number;
  total_amount?: number;
  shipping_fee?: number;
  status?: string;
  payment_method?: string;
}

// --- FILTER TYPES ---
type FilterType = "all" | "today" | "yesterday" | "week" | "month";

const OrderHistory: React.FC = () => {
  // Hooks xử lý URL params
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- STATE QUẢN LÝ USER ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  // --- STATE QUẢN LÝ HÓA ĐƠN ---
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // --- STATE FILTER ---
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [productSearch, setProductSearch] = useState<string>("");

  const limit = 9;

  // 1️⃣ EFFECT: TỰ ĐỘNG LẤY USER PROFILE
  useEffect(() => {
    const fetchUserProfile = async () => {
      setUserLoading(true);
      try {
        const res = await apiClient.get("/users/me");
        const userData = res.data?.user || res.data?.data || res.data;
        if (!userData || !userData._id) {
          throw new Error("Cấu trúc dữ liệu User không hợp lệ");
        }
        setUser(userData);
      } catch (err) {
        console.error("Lỗi tải thông tin user:", err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // HÀM FETCH INVOICES
  const fetchInvoices = useCallback(async () => {
    if (userLoading || !user) return;

    setLoading(true);
    setError(null);
    try {
      const url = user.role === "admin" ? "/invoice" : "/invoice/me";

      const res = await apiClient.get(url, {
        params: { page: currentPage, limit },
      });

      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.invoices || res.data?.docs || [];

      const total = res.data?.totalPages || Math.ceil(data.length / limit) || 1;

      setInvoices(data);
      setTotalPages(total);
    } catch (err: any) {
      console.error("Lỗi tải hóa đơn:", err);
      setError(
        err.response?.data?.message || "Không tải được lịch sử đơn hàng."
      );
    } finally {
      setLoading(false);
    }
  }, [user, userLoading, currentPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // 3️⃣ EFFECT: MOMO CALLBACK
  useEffect(() => {
    const checkMomoCallback = async () => {
      const orderId = searchParams.get("orderId");
      const resultCode = searchParams.get("resultCode");

      if (orderId) {
        setSearchParams({});

        if (resultCode === "0") {
          Swal.fire({
            title: "Đang xác thực thanh toán...",
            text: "Vui lòng đợi...",
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            },
          });

          try {
            const res = await apiClient.post("/payments/momo/check-status", {
              orderId,
            });

            if (res.data?.status === "PAID") {
              await Swal.fire({
                title: "Thanh toán thành công!",
                text: "Đơn hàng của bạn đã được tạo.",
                icon: "success",
                timer: 2000,
              });
              fetchInvoices();
            }
          } catch (err: any) {
            console.error("Lỗi check status MoMo:", err);
            Swal.fire(
              "Lỗi",
              err.response?.data?.message || "Không thể xác thực giao dịch.",
              "error"
            );
          }
        } else {
          Swal.fire(
            "Thanh toán thất bại",
            "Giao dịch MoMo đã bị hủy hoặc thất bại.",
            "error"
          );
        }
      }
    };

    checkMomoCallback();
  }, [searchParams, setSearchParams, fetchInvoices]);

  // --- LOGIC LỌC CLIENT-SIDE ---
  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    const dateFiltered =
      filterType === "all"
        ? invoices
        : invoices.filter((inv) => {
            const invDate = new Date(inv.createdAt);
            switch (filterType) {
              case "today":
                return invDate >= todayStart && invDate <= todayEnd;
              case "yesterday": {
                const yestStart = new Date(todayStart);
                yestStart.setDate(yestStart.getDate() - 1);
                const yestEnd = new Date(todayEnd);
                yestEnd.setDate(yestEnd.getDate() - 1);
                return invDate >= yestStart && invDate <= yestEnd;
              }
              case "week": {
                const weekStart = new Date(todayStart);
                weekStart.setDate(weekStart.getDate() - 7);
                return invDate >= weekStart;
              }
              case "month": {
                const monthStart = new Date(todayStart);
                monthStart.setMonth(monthStart.getMonth() - 1);
                return invDate >= monthStart;
              }
              default:
                return true;
            }
          });

    const q = productSearch.trim().toLowerCase();
    if (!q) return dateFiltered;

    return dateFiltered.filter((inv) => {
      return (inv.items || []).some((it) => {
        const name = (it as any)?.product_id?.name || "";
        return name.toLowerCase().includes(q);
      });
    });
  }, [invoices, filterType, productSearch]);

  const handleSelectInvoice = async (invoiceId: string) => {
    try {
      const res = await apiClient.get(`/invoice/${invoiceId}`);
      setSelectedInvoice(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || "Lỗi tải chi tiết đơn hàng");
    }
  };

  const handleDeleteInvoice = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Hành động này sẽ xóa vĩnh viễn hóa đơn này!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#3b82f6",
      confirmButtonText: "Xóa ngay",
      cancelButtonText: "Hủy",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/invoice/${invoiceId}`);
        setInvoices((prev) => prev.filter((inv) => inv._id !== invoiceId));
        if (selectedInvoice && selectedInvoice._id === invoiceId) {
          setSelectedInvoice(null);
        }
        Swal.fire("Đã xóa!", "Hóa đơn đã được xóa thành công.", "success");
      } catch (err: any) {
        Swal.fire(
          "Lỗi!",
          err.response?.data?.message || "Không thể xóa hóa đơn.",
          "error"
        );
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500 mb-2" />
        <p className="text-gray-500">Đang tải dữ liệu người dùng...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full border border-red-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Không thể xác thực
          </h3>
          <Button
            onClick={() => (window.location.href = "/signin")}
            className="w-full"
          >
            Đến trang Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #printable-area, #printable-area * { visibility: visible; } 
          #printable-area { 
            position: absolute; 
            left: 0; 
            top: 0; 
            width: 100%;
            /* 🔥 SỬA: Thêm padding và box-sizing để tránh mất nội dung */
            padding: 0 10mm; /* Cách lề trái phải 10mm */
            box-sizing: border-box;
            margin: 0;
            border: none;
            box-shadow: none;
          } 
          /* 🔥 SỬA: Thêm margin cho trang in vật lý */
          @page { margin: 5mm; size: auto; } 
          .modal-overlay { background: white; position: fixed; inset: 0; z-index: 9999; }
        }
      `}</style>

      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="bg-white border-b shadow-sm py-6 mb-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {user.role === "admin" ? "Quản lý Đơn hàng" : "Lịch sử đơn hàng"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.role === "admin"
              ? "Xem và quản lý tất cả đơn hàng trong hệ thống."
              : `Xin chào ${
                  user.displayName || user.username
                }, đây là danh sách đơn hàng của bạn.`}
          </p>

          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            {(
              ["all", "today", "yesterday", "week", "month"] as FilterType[]
            ).map((type) => (
              <Button
                key={type}
                variant={filterType === type ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterType(type)}
                className={`text-xs ${
                  filterType === type ? "bg-orange-500 hover:bg-orange-600" : ""
                }`}
              >
                {type === "all"
                  ? "Tất cả"
                  : type === "today"
                  ? "Hôm nay"
                  : type === "yesterday"
                  ? "Hôm qua"
                  : type === "week"
                  ? "Tuần này"
                  : "Tháng này"}
              </Button>
            ))}

            <div className="flex items-center border rounded-md bg-white px-3 py-1 w-full md:w-64 md:ml-auto">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm sản phẩm trong đơn..."
                className="text-sm outline-none w-full pr-2"
              />
              {productSearch && (
                <button
                  onClick={() => setProductSearch("")}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 flex-1 pb-10 w-full print:hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin w-6 h-6 text-orange-500 mr-2" />
            <span>Đang tải danh sách đơn hàng...</span>
          </div>
        ) : error ? (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
            {error}
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-dashed border-gray-300">
            <div className="text-gray-400 mb-3">📦</div>
            <p className="text-gray-500 font-medium">
              Không tìm thấy đơn hàng nào.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((inv) => (
              <div
                key={inv._id}
                onClick={() => handleSelectInvoice(inv._id)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 cursor-pointer transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
              >
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    inv.status === "COMPLETED" || inv.status === "PAID"
                      ? "bg-green-500"
                      : inv.status === "CANCELLED"
                      ? "bg-red-500"
                      : "bg-orange-500"
                  }`}
                ></div>

                <div>
                  <div className="flex justify-between items-start mb-4 pl-2">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">
                        Mã đơn hàng
                      </div>
                      <div className="font-mono font-bold text-gray-800 text-lg group-hover:text-orange-600 transition-colors">
                        #{inv._id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                    {(user.role === "admin" ||
                      (inv.status !== "COMPLETED" &&
                        inv.status !== "PAID")) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                        onClick={(e) => handleDeleteInvoice(e, inv._id)}
                        title="Xóa hóa đơn này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="pl-2 mb-2">
                    <span
                      className={`px-3 py-1 text-[10px] rounded-full font-bold uppercase tracking-wide ${
                        inv.status === "COMPLETED" || inv.status === "PAID"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : inv.status === "CANCELLED"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-orange-50 text-orange-600 border border-orange-100"
                      }`}
                    >
                      {inv.status === "PAID"
                        ? "Đã Thanh Toán"
                        : inv.status || "Mới"}
                    </span>
                  </div>

                  <div className="mb-3 pl-2 pb-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 uppercase mb-1">
                      Khách hàng
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {(inv.recipient_info?.name || inv.user?.name || "?")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {inv.recipient_info?.name ||
                            inv.user?.name ||
                            "Khách lẻ"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-gray-600 space-y-2 pl-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ngày đặt:</span>
                      <span className="font-medium text-gray-700">
                        {formatDateSafe(inv.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 mt-2 border-t border-gray-50 pl-2">
                  <span className="font-bold text-gray-700">Tổng cộng:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {formatVND(inv.totalPrice || inv.total_amount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {invoices.length > 0 && filterType === "all" && (
          <div className="flex justify-center gap-2 mt-10">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <span className="px-4 py-2 bg-white border rounded-md text-sm font-medium text-gray-600 flex items-center">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </main>

      <div className="print:hidden">
        <Footer />
      </div>

      {/* MODAL CHI TIẾT (IN ĐƯỢC) */}
      {selectedInvoice &&
        (() => {
          const subTotalOriginal = selectedInvoice.items.reduce((acc, item) => {
            const originalPrice =
              item.product_id?.price && item.product_id.price > 0
                ? item.product_id.price
                : item.price || 0;
            return acc + originalPrice * item.quantity;
          }, 0);
          const shippingFee = selectedInvoice.shipping_fee || 0;
          const finalTotal =
            selectedInvoice.totalPrice || selectedInvoice.total_amount || 0;
          const totalDiscount = Math.max(
            0,
            subTotalOriginal + shippingFee - finalTotal
          );

          const displayName =
            selectedInvoice.recipient_info?.name ||
            selectedInvoice.user?.name ||
            "Khách lẻ";
          const displayPhone = selectedInvoice.recipient_info?.phone || "";
          const displayAddress = selectedInvoice.recipient_info?.address || "";
          // 🔥 Lấy ghi chú
          const displayNote =
            (selectedInvoice.recipient_info as any)?.note || "";
          const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
            `${window.location.origin}/invoice/${selectedInvoice._id}`
          )}`;

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 modal-overlay overflow-y-auto"
              onClick={() => setSelectedInvoice(null)}
            >
              <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-[420px] max-h-[95vh] overflow-y-auto print:shadow-none print:w-full print:max-w-none print:max-h-none print:rounded-none"
                onClick={(e) => e.stopPropagation()}
              >
                {/* PRINTABLE CONTENT */}
                <div
                  id="printable-area"
                  className="p-6 font-mono text-sm bg-white"
                >
                  {/* HEADER HÓA ĐƠN */}
                  <div className="border-2 border-gray-200 rounded-md p-3 mb-4 print:border-gray-400">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <img
                          src="/logo22.svg"
                          alt="logo"
                          className="w-10 h-10 object-contain"
                        />
                        <div>
                          <div className="text-base font-bold uppercase">
                            KPPAINT
                          </div>
                          <div className="text-[10px] text-gray-500">
                            180 Cao Lỗ, Q.8, HCM
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500">Mã đơn</div>
                        <div className="font-bold text-xs truncate max-w-[80px]">
                          {selectedInvoice._id.slice(-6).toUpperCase()}
                        </div>
                        {(user.role === "admin" ||
                          (selectedInvoice.status !== "COMPLETED" &&
                            selectedInvoice.status !== "PAID")) && (
                          <div className="mt-1 print:hidden">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-6 text-[10px] px-2"
                              onClick={(e) => {
                                setSelectedInvoice(null);
                                handleDeleteInvoice(e, selectedInvoice._id);
                              }}
                            >
                              Xóa hóa đơn này
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* KHUNG THÔNG TIN KHÁCH HÀNG */}
                    <div className="border border-gray-300 rounded-md p-2 bg-gray-50 text-xs space-y-1 print:bg-white print:border-gray-400">
                      <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">
                          Khách:
                        </span>
                        <span className="font-bold text-gray-800 truncate max-w-[200px]">
                          {displayName}
                        </span>
                      </div>
                      {displayPhone && (
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-600">
                            SĐT:
                          </span>
                          <span>{displayPhone}</span>
                        </div>
                      )}
                      {displayAddress && (
                        <div className="flex justify-between items-start">
                          <span className="font-semibold text-gray-600 w-10 shrink-0">
                            Đ/C:
                          </span>
                          <span className="text-right break-words">
                            {displayAddress}
                          </span>
                        </div>
                      )}
                      {/* 🔥 HIỂN THỊ GHI CHÚ KHÁCH HÀNG */}
                      {displayNote && (
                        <div className="flex justify-between items-start pt-1 mt-1 border-t border-dashed border-gray-200">
                          <span className="font-semibold text-gray-600 w-12 shrink-0">
                            Note:
                          </span>
                          <span className="text-right break-words italic text-gray-700">
                            {displayNote}
                          </span>
                        </div>
                      )}

                      <div className="border-t border-dashed border-gray-300 my-1 pt-1 flex justify-between">
                        <span className="font-semibold text-gray-600">
                          Ngày:
                        </span>
                        <span>{formatDateSafe(selectedInvoice.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* LIST ITEM */}
                  <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4">
                    <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 uppercase">
                      <span>Sản phẩm</span>
                      <span>Thành tiền</span>
                    </div>
                    {selectedInvoice.items.map((item, idx) => {
                      const name = item.product_id?.name || "Sản phẩm";
                      const sellPrice =
                        item.price && item.price > 0
                          ? item.price
                          : item.product_id?.price || 0;
                      const originalPrice =
                        item.product_id?.price && item.product_id.price > 0
                          ? item.product_id.price
                          : sellPrice;
                      const lineTotal = sellPrice * item.quantity;
                      const isDiscounted = originalPrice > sellPrice;
                      const discountPercent = isDiscounted
                        ? Math.round(
                            ((originalPrice - sellPrice) / originalPrice) * 100
                          )
                        : 0;

                      return (
                        <div
                          key={idx}
                          className="mb-3 last:mb-0 border-b border-gray-100 last:border-0 pb-2"
                        >
                          <div className="font-medium mb-1 truncate">
                            {name}
                          </div>
                          <div className="flex justify-between items-end">
                            <div className="text-xs flex items-center gap-1">
                              <span className="font-bold text-gray-600">
                                x{item.quantity}
                              </span>
                              <span className="text-gray-300 mx-1">|</span>
                              {isDiscounted ? (
                                <>
                                  <span className="line-through text-gray-400 text-[10px]">
                                    {formatVND(originalPrice)}
                                  </span>
                                  <span className="font-bold">
                                    {formatVND(sellPrice)}
                                  </span>
                                  <span className="text-[9px] text-red-500">
                                    (-{discountPercent}%)
                                  </span>
                                </>
                              ) : (
                                <span className="font-medium text-gray-600">
                                  {formatVND(sellPrice)}
                                </span>
                              )}
                            </div>
                            <div className="font-bold text-sm text-gray-900">
                              {formatVND(lineTotal)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* SUMMARY */}
                  <div className="flex flex-col gap-1 border-b-2 border-gray-200 pb-4 mb-4 text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Tổng tiền hàng</span>
                      <span>{formatVND(subTotalOriginal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Giảm giá</span>
                        <span>-{formatVND(totalDiscount)}</span>
                      </div>
                    )}
                    {shippingFee > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Phí vận chuyển</span>
                        <span>+{formatVND(shippingFee)}</span>
                      </div>
                    )}
                    <div className="border-t border-dashed border-gray-300 my-1"></div>
                    <div className="flex justify-between items-end">
                      <span className="font-bold uppercase text-gray-800 text-sm">
                        Tổng thanh toán
                      </span>
                      <span className="text-xl font-bold text-gray-900">
                        {formatVND(finalTotal)}
                      </span>
                    </div>
                  </div>

                  {/* FOOTER QR */}
                  <div className="text-center text-xs text-gray-500 mb-4">
                    Thanh toán:{" "}
                    <span className="font-semibold text-gray-700">
                      {selectedInvoice.payment_method || "Tiền mặt"}
                    </span>
                  </div>
                  <div className="text-center mb-6">
                    <div className="flex justify-center mb-2">
                      <img
                        src={qrSrc}
                        alt="QR"
                        className="w-16 h-16 mix-blend-multiply"
                      />
                    </div>
                    <p className="text-xs font-medium">Cảm ơn quý khách!</p>
                  </div>
                </div>

                {/* ACTION BUTTONS (HIDDEN WHEN PRINTING) */}
                <div className="p-6 pt-0 space-y-3 print:hidden">
                  <Button
                    onClick={handlePrint}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center gap-2"
                  >
                    <Printer className="w-4 h-4" /> IN HÓA ĐƠN
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedInvoice(null)}
                    className="w-full"
                  >
                    Đóng
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
};

export default OrderHistory;
