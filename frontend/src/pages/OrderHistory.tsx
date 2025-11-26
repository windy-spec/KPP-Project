// src/pages/OrderHistory.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { X, Loader2, Printer } from "lucide-react";

const SERVER_BASE_URL = "http://localhost:5001";

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
  recipient_info?: { name: string; phone: string; address: string };
  user?: { name?: string; email?: string };
  items: InvoiceItem[];
  totalPrice?: number;
  total_amount?: number;
  shipping_fee?: number;
  status?: string;
  payment_method?: string;
}

interface OrderHistoryProps {
  user: UserProfile | null;
  userLoading: boolean;
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ user, userLoading }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const limit = 9;

  const getAccessToken = () => localStorage.getItem("accessToken");

  // Kiểm tra token hết hạn
  const isTokenExpired = (token: string | null) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return Date.now() / 1000 > payload.exp;
    } catch {
      return true;
    }
  };

  const goToSignIn = (message?: string) => {
    if (message) setError(message);
    localStorage.removeItem("accessToken");
    window.location.href = "/signIn";
  };

  // --- FETCH API ---
  useEffect(() => {
    const fetchInvoices = async () => {
      if (userLoading) return;
      if (!user) return;

      const token = getAccessToken();
      if (!token || isTokenExpired(token)) {
        goToSignIn("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const url =
          user.role === "admin"
            ? `${SERVER_BASE_URL}/api/invoice`
            : `${SERVER_BASE_URL}/api/invoice/me`;
        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
          params: { page: currentPage, limit },
        });

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.invoices || res.data?.docs || [];
        const total =
          res.data?.totalPages || Math.ceil(data.length / limit) || 1;

        setInvoices(data);
        setTotalPages(total);
      } catch (err: any) {
        if (err.response?.status === 401 || err.response?.status === 403) {
          goToSignIn(
            "Phiên đăng nhập hết hạn hoặc bạn không có quyền truy cập."
          );
          return;
        }
        setError(
          err.response?.data?.message || "Không tải được lịch sử đơn hàng."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [user, userLoading, currentPage]);

  // --- XỬ LÝ CHI TIẾT HÓA ĐƠN ---
  const handleSelectInvoice = async (invoiceId: string) => {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
      goToSignIn("Bạn cần đăng nhập để xem chi tiết đơn hàng.");
      return;
    }

    try {
      const res = await axios.get(
        `${SERVER_BASE_URL}/api/invoice/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setSelectedInvoice(res.data);
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        goToSignIn("Bạn không có quyền hoặc phiên đã hết hạn.");
        return;
      }
      alert(err.response?.data?.message || "Lỗi tải chi tiết đơn hàng");
    }
  };

  const getInvoiceDetails = (inv: Invoice) => {
    const subTotalOriginal = inv.items.reduce((acc, item) => {
      const pPrice = item.product_id?.price || 0;
      const iPrice = item.price || 0;
      const originalPrice = pPrice > 0 ? pPrice : iPrice;
      return acc + originalPrice * item.quantity;
    }, 0);
    const shippingFee = inv.shipping_fee || 0;
    const finalTotal = inv.totalPrice || inv.total_amount || 0;
    const totalDiscount = Math.max(
      0,
      subTotalOriginal + shippingFee - finalTotal
    );
    return { subTotalOriginal, shippingFee, finalTotal, totalDiscount };
  };

  // --- RENDER ---
  if (userLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4">
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-red-500 mb-4 font-medium">
            ⚠️ Phiên đăng nhập không hợp lệ hoặc đã hết hạn.
          </p>
          <Button onClick={() => (window.location.href = "/signIn")}>
            Đến trang Đăng nhập
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      {/* HEADER */}
      <div className="bg-white border-b shadow-sm py-6 mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold">
            {user.role === "admin" ? "Quản lý Đơn hàng" : "Lịch sử đơn hàng"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {user.role === "admin"
              ? "Xem tất cả đơn hàng."
              : "Chỉ hiển thị đơn hàng của bạn."}
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 flex-1 pb-10 w-full">
        {loading ? (
          <div className="text-center py-10">Đang tải dữ liệu...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-10">{error}</div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded shadow-sm">
            Chưa có đơn hàng nào.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                onClick={() => handleSelectInvoice(inv._id)}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-orange-400 cursor-pointer transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase font-bold">
                      Mã đơn
                    </div>
                    <div className="font-mono font-bold text-gray-800 group-hover:text-orange-600 transition-colors">
                      #{inv._id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                  {user.role === "admin" && inv.user?.name && (
                    <span className="text-xs text-gray-500 italic max-w-[150px] truncate">
                      {inv.user.name}
                    </span>
                  )}
                  <span
                    className={`px-2 py-1 text-[10px] rounded font-bold uppercase ${
                      inv.status === "COMPLETED"
                        ? "bg-green-100 text-green-700"
                        : inv.status === "CANCELLED"
                        ? "bg-red-100 text-red-700"
                        : "bg-orange-50 text-orange-600"
                    }`}
                  >
                    {inv.status || "Mới"}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex justify-between">
                    <span>Ngày:</span>
                    <span className="font-medium">
                      {formatDateSafe(inv.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                    <span className="font-bold text-gray-700">Tổng tiền:</span>
                    <span className="font-bold text-lg text-orange-600">
                      {formatVND(inv.totalPrice || inv.total_amount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PAGINATION */}
        {invoices.length > 0 && (
          <div className="flex justify-center gap-2 mt-10">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <span className="px-3 py-2 bg-white border rounded text-sm font-medium text-gray-600">
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

      <Footer />
      {/* MODAL CHI TIẾT */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          {/* modal content giống bản cũ */}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
