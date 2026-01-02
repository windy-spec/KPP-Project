import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import apiClient from "@/utils/api-user";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import {
  Loader2,
  Printer,
  Filter,
  Trash2,
  Search,
  X,
  CheckCircle,
  Truck,
} from "lucide-react";
import Swal from "sweetalert2";

// --- HELPER FORMAT ---
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
  order_status?: string;
  payment_status?: string;
  payment_method?: string;
}

// --- FILTER TYPES ---
type FilterType = "all" | "today" | "yesterday" | "week" | "month";

const OrderHistory: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // --- STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // --- FILTER ---
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [productSearch, setProductSearch] = useState<string>("");

  const limit = 9;

  // FETCH USER
  useEffect(() => {
    const fetchUserProfile = async () => {
      setUserLoading(true);
      try {
        const res = await apiClient.get("/users/me");
        const userData = res.data?.user || res.data?.data || res.data;
        if (!userData || !userData._id) throw new Error("Invalid User Data");
        setUser(userData);
      } catch (err) {
        console.error("Lỗi tải user:", err);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    fetchUserProfile();
  }, []);

  // FETCH INVOICES
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

  // CHECK MOMO STATUS
  useEffect(() => {
    const checkMomoCallback = async () => {
      const orderId = searchParams.get("orderId");
      const resultCode = searchParams.get("resultCode");

      if (orderId) {
        setSearchParams({});

        if (resultCode === "0") {
          Swal.fire({
            title: "Đang xác thực...",
            didOpen: () => Swal.showLoading(),
            allowOutsideClick: false,
          });

          try {
            const res = await apiClient.post("/payments/momo/check-status", {
              orderId,
            });

            if (res.data?.status === "PAID") {
              await Swal.fire(
                "Thành công!",
                "Thanh toán đã được xác nhận.",
                "success"
              );
              fetchInvoices();
            }
          } catch (err) {
            Swal.fire("Lỗi", "Không thể xác thực giao dịch.", "error");
          }
        } else {
          Swal.fire("Thất bại", "Giao dịch MoMo bị hủy hoặc lỗi.", "error");
        }
      }
    };
    checkMomoCallback();
  }, [searchParams, setSearchParams, fetchInvoices]);

  // --- FILTER LOGIC ---
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
    return dateFiltered.filter((inv) =>
      (inv.items || []).some((it) =>
        ((it as any)?.product_id?.name || "").toLowerCase().includes(q)
      )
    );
  }, [invoices, filterType, productSearch]);

  const handleSelectInvoice = async (invoiceId: string) => {
    try {
      const res = await apiClient.get(`/invoice/${invoiceId}`);
      setSelectedInvoice(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message);
    }
  };

  const handleDeleteInvoice = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Xóa hóa đơn?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa ngay",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/invoice/${invoiceId}`);
        setInvoices((prev) => prev.filter((inv) => inv._id !== invoiceId));
        if (selectedInvoice?._id === invoiceId) setSelectedInvoice(null);
        Swal.fire("Đã xóa!", "", "success");
      } catch (err: any) {
        Swal.fire("Lỗi!", err.response?.data?.message, "error");
      }
    }
  };

  // ADMIN GIAO HÀNG (Kích hoạt đếm giờ)
  const handleAdminShipOrder = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Giao cho Shipper?",
      text: "Đơn hàng sẽ chuyển sang trạng thái Đang giao.",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      confirmButtonText: "Giao ngay",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.put(`/invoice/${invoiceId}`, {
          order_status: "SHIPPING",
          status: "SHIPPING",
        });

        setInvoices((prev) =>
          prev.map((inv) =>
            inv._id === invoiceId
              ? { ...inv, status: "SHIPPING", order_status: "SHIPPING" }
              : inv
          )
        );

        Swal.fire("Đã giao!", "Đơn hàng đang được giao.", "success");
      } catch (err) {
        Swal.fire("Lỗi", "Không thể cập nhật trạng thái", "error");
      }
    }
  };

  // USER XÁC NHẬN ĐÃ NHẬN HÀNG
  const handleUserConfirmReceived = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Đã nhận hàng?",
      text: "Bạn xác nhận đã nhận đủ hàng và hài lòng?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      confirmButtonText: "Đúng, đã nhận",
      cancelButtonText: "Chưa",
    });

    if (result.isConfirmed) {
      try {
        await apiClient.put(`/invoice/${invoiceId}`, {
          order_status: "COMPLETED",
          status: "COMPLETED",
        });

        setInvoices((prev) =>
          prev.map((inv) =>
            inv._id === invoiceId
              ? { ...inv, status: "COMPLETED", order_status: "COMPLETED" }
              : inv
          )
        );

        Swal.fire("Thành công", "Cảm ơn bạn đã mua hàng!", "success");
      } catch (err) {
        Swal.fire("Lỗi", "Không thể cập nhật trạng thái", "error");
      }
    }
  };

  // --- HELPER HIỂN THỊ TRẠNG THÁI ---
  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "SHIPPING":
        return "Đang giao";
      case "PREPARING":
        return "Đang chuẩn bị";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return "Mới đặt";
    }
  };

  if (userLoading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-orange-500" />
      </div>
    );
  if (!user)
    return <div className="p-10 text-center">Vui lòng đăng nhập lại.</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #printable-area, #printable-area * { visibility: visible; } 
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 10mm; box-sizing: border-box; } 
          @page { margin: 5mm; size: auto; } 
          .modal-overlay { background: white; position: fixed; inset: 0; z-index: 9999; }
        }
      `}</style>

      <div className="print:hidden">
        <Navbar />
      </div>

      {/* HEADER & FILTER */}
      <div className="bg-white border-b shadow-sm py-6 mb-6 print:hidden">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {user.role === "admin" ? "Quản lý Đơn hàng" : "Lịch sử đơn hàng"}
          </h1>
          <div className="flex flex-wrap gap-2 mt-4 items-center">
            <Filter className="w-4 h-4 text-gray-500 mr-2" />
            {(["all", "today", "yesterday", "week"] as FilterType[]).map(
              (type) => (
                <Button
                  key={type}
                  variant={filterType === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType(type)}
                  className={`text-xs ${
                    filterType === type
                      ? "bg-orange-500 hover:bg-orange-600"
                      : ""
                  }`}
                >
                  {type === "all"
                    ? "Tất cả"
                    : type === "today"
                    ? "Hôm nay"
                    : type === "yesterday"
                    ? "Hôm qua"
                    : "Tuần này"}
                </Button>
              )
            )}
            <div className="flex items-center border rounded-md bg-white px-3 py-1 w-full md:w-64 md:ml-auto">
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm sản phẩm..."
                className="text-sm outline-none w-full"
              />
              {productSearch && (
                <button onClick={() => setProductSearch("")}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 flex-1 pb-10 w-full print:hidden">
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="animate-spin inline text-orange-500" />{" "}
            Loading...
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-sm border border-dashed">
            <p className="text-gray-500">Chưa có đơn hàng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInvoices.map((inv) => (
              <div
                key={inv._id}
                onClick={() => handleSelectInvoice(inv._id)}
                className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-orange-200 cursor-pointer transition-all duration-200 group relative overflow-hidden flex flex-col justify-between"
              >
                {/* Thanh màu trạng thái bên trái */}
                <div
                  className={`absolute top-0 left-0 w-1 h-full ${
                    inv.status === "COMPLETED"
                      ? "bg-green-500"
                      : inv.status === "CANCELLED"
                      ? "bg-red-500"
                      : "bg-orange-500"
                  }`}
                ></div>

                <div>
                  <div className="flex justify-between items-start mb-3 pl-2">
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        Mã đơn
                      </div>
                      <div className="font-mono font-bold text-gray-800 text-lg">
                        #{inv._id.slice(-6).toUpperCase()}
                      </div>
                    </div>
                    {/* Nút xóa (chỉ hiện với Admin hoặc đơn chưa hoàn thành) */}
                    {(user.role === "admin" ||
                      (inv.status !== "COMPLETED" &&
                        inv.payment_status !== "PAID")) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-300 hover:text-red-500"
                        onClick={(e) => handleDeleteInvoice(e, inv._id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Trạng thái Badge */}
                  <div className="pl-2 mb-3 flex flex-wrap gap-2">
                    <span
                      className={`px-2 py-1 text-[10px] rounded border font-bold uppercase ${
                        inv.status === "COMPLETED"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : inv.status === "SHIPPING"
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : inv.status === "CANCELLED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      }`}
                    >
                      {getStatusText(inv.order_status || inv.status)}
                    </span>

                    <span
                      className={`px-2 py-1 text-[10px] rounded border font-bold uppercase ${
                        inv.payment_status === "PAID"
                          ? "bg-green-100 text-green-800 border-green-200"
                          : "bg-yellow-50 text-yellow-700 border-yellow-200"
                      }`}
                    >
                      {inv.payment_status === "PAID"
                        ? "Đã thanh toán"
                        : "Chưa thanh toán"}
                    </span>
                  </div>

                  <div className="mb-3 pl-2 pb-3 border-b border-gray-50">
                    <p className="text-xs text-gray-400 uppercase mb-1">
                      Khách hàng
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {(inv.recipient_info?.name || inv.user?.name || "K")
                          .charAt(0)
                          .toUpperCase()}
                      </div>
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {inv.recipient_info?.name ||
                          inv.user?.name ||
                          "Khách lẻ"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* --- KHU VỰC BUTTON --- */}
                <div className="pl-2 mb-3 space-y-2">
                  {/* 1. NÚT CHO ADMIN: GIAO SHIPPER */}
                  {user?.role === "admin" &&
                    (inv.status === "PLACED" ||
                      inv.order_status === "PLACED") && (
                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs shadow-sm"
                        onClick={(e) => handleAdminShipOrder(e, inv._id)}
                      >
                        <Truck className="w-3 h-3 mr-1" /> Giao Shipper
                      </Button>
                    )}

                  {/* 2. NÚT CHO USER: XÁC NHẬN ĐÃ NHẬN HÀNG */}
                  {user?.role !== "admin" &&
                    (inv.status === "SHIPPING" ||
                      inv.order_status === "SHIPPING") && (
                      <Button
                        className="w-full bg-green-600 hover:bg-green-700 text-white h-8 text-xs shadow-sm animate-pulse"
                        onClick={(e) => handleUserConfirmReceived(e, inv._id)}
                      >
                        <CheckCircle className="w-3 h-3 mr-1" /> Đã nhận được
                        hàng
                      </Button>
                    )}
                </div>

                <div className="pl-2 pt-2 flex justify-between items-center border-t border-dashed border-gray-200 mt-2">
                  <span className="text-sm text-gray-500">Tổng tiền:</span>
                  <span className="font-bold text-lg text-orange-600">
                    {formatVND(inv.totalPrice || inv.total_amount || 0)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Phân trang */}
        {invoices.length > 0 && filterType === "all" && (
          <div className="flex justify-center gap-2 mt-10">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <span className="px-4 py-2 bg-white border rounded text-sm font-medium flex items-center">
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

      {/* MODAL CHI TIẾT */}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          user={user}
          onClose={() => setSelectedInvoice(null)}
          onDelete={handleDeleteInvoice}
        />
      )}
    </div>
  );
};

// Tách Modal ra cho gọn
const InvoiceDetailModal = ({
  invoice,
  user,
  onClose,
  onDelete,
}: {
  invoice: Invoice;
  user: UserProfile;
  onClose: () => void;
  onDelete: any;
}) => {
  const subTotal = invoice.items.reduce(
    (acc, item) =>
      acc + (item.price || item.product_id?.price || 0) * item.quantity,
    0
  );
  const finalTotal = invoice.totalPrice || invoice.total_amount || 0;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `${window.location.origin}/invoice/${invoice._id}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="printable-area" className="p-6 font-mono text-sm bg-white">
          {/* Header Modal */}
          <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold text-center uppercase">
              Hóa Đơn Bán Hàng
            </h2>
            <div className="text-center text-xs text-gray-500 mt-1">
              Mã: #{invoice._id.slice(-6).toUpperCase()}
            </div>
            <div className="text-center text-xs text-gray-400">
              {formatDateSafe(invoice.createdAt)}
            </div>
          </div>

          {/* Info Khách */}
          <div className="mb-4 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Khách:</span>{" "}
              <span className="font-bold">
                {invoice.recipient_info?.name || invoice.user?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SĐT:</span> <span>{invoice.recipient_info?.phone}</span>
            </div>
            <div className="flex justify-between items-start">
              <span>Đ/C:</span>{" "}
              <span className="text-right max-w-[200px]">
                {invoice.recipient_info?.address}
              </span>
            </div>
            {invoice.recipient_info?.note && (
              <div className="flex justify-between items-start text-gray-500 italic mt-1 border-t border-dashed pt-1">
                <span>Note:</span>{" "}
                <span className="text-right max-w-[200px]">
                  {invoice.recipient_info.note}
                </span>
              </div>
            )}
          </div>

          {/* List Items */}
          <div className="border-t border-b border-gray-200 py-2 mb-4">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <div>
                  <div className="font-medium">{item.product_id?.name}</div>
                  <div className="text-xs text-gray-500">x{item.quantity}</div>
                </div>
                <div className="font-medium">
                  {formatVND((item.price || 0) * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          {/* Tổng */}
          <div className="space-y-1 text-right mb-4">
            <div className="text-xs text-gray-500">
              Phí ship: {formatVND(invoice.shipping_fee || 0)}
            </div>
            <div className="text-lg font-bold text-gray-900">
              Tổng: {formatVND(finalTotal)}
            </div>
          </div>

          {/* Trạng thái Modal */}
          <div className="text-center text-xs mb-4 p-2 bg-gray-50 rounded border border-gray-100">
            Trạng thái: <b>{invoice.status}</b> <br />
            Thanh toán:{" "}
            <b
              className={
                invoice.payment_status === "PAID"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {invoice.payment_status === "PAID"
                ? "ĐÃ THANH TOÁN"
                : "CHƯA THANH TOÁN"}
            </b>{" "}
            ({invoice.payment_method})
          </div>

          <div className="flex justify-center mb-2">
            <img
              src={qrSrc}
              alt="QR"
              className="w-16 h-16 mix-blend-multiply"
            />
          </div>
          <div className="text-center text-xs italic text-gray-400">
            Cảm ơn quý khách!
          </div>
        </div>

        {/* Button */}
        <div className="p-4 bg-gray-50 flex gap-2 print:hidden">
          <Button
            onClick={() => window.print()}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Printer className="w-4 h-4 mr-2" /> In hóa đơn
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OrderHistory;
