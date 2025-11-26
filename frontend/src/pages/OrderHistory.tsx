// src/pages/OrderHistory.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

const SERVER_BASE_URL = "http://localhost:5001";

interface InvoiceItem {
  product_id: {
    name: string;
    price: number;
  };
  quantity: number;
}

interface Invoice {
  _id: string;
  user?: {
    name?: string;
    email?: string;
  };
  totalPrice?: number;
  status?: string;
  createdAt?: string;
  items?: InvoiceItem[];
}

interface OrderHistoryProps {
  role: "admin" | "user";
}

const OrderHistory: React.FC<OrderHistoryProps> = ({ role }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const limit = 9;

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) throw new Error("Chưa đăng nhập");

        const url =
          role === "admin"
            ? `${SERVER_BASE_URL}/api/invoice`
            : `${SERVER_BASE_URL}/api/invoice/me`;

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = Array.isArray(res.data)
          ? res.data
          : res.data?.invoices || [];

        const total = res.data?.totalPages || Math.ceil(data.length / limit);

        setInvoices(data);
        setTotalPages(total);
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [role, currentPage]);

  const handleSelectInvoice = async (invoiceId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) throw new Error("Chưa đăng nhập");

      const res = await axios.get(
        `${SERVER_BASE_URL}/api/invoice/${invoiceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSelectedInvoice(res.data);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-orange-500 text-white py-4 shadow-md mb-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold">Lịch sử đơn hàng</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-2 text-gray-700">Đang tải...</span>
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : invoices.length === 0 ? (
          <p>Không có hóa đơn nào.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {invoices.map((inv) => (
              <div
                key={inv._id}
                className="bg-white rounded-lg shadow-sm p-4 border border-gray-100 hover:shadow-md transition cursor-pointer"
                onClick={() => handleSelectInvoice(inv._id)}
              >
                {role === "admin" && (
                  <p className="text-sm text-gray-500 mb-1">
                    <strong>Người mua:</strong> {inv.user?.name || "N/A"} (
                    {inv.user?.email || "N/A"})
                  </p>
                )}
                <p>
                  <strong>Mã hóa đơn:</strong> {inv._id}
                </p>
                <p>
                  <strong>Tổng tiền:</strong>{" "}
                  {inv.totalPrice?.toLocaleString() || 0} VND
                </p>
                <p>
                  <strong>Trạng thái:</strong> {inv.status || "Chưa xác định"}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Ngày tạo:</strong>{" "}
                  {inv.createdAt
                    ? new Date(inv.createdAt).toLocaleString()
                    : "-"}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Chi tiết đơn hàng */}
        {selectedInvoice && (
          <div className="mt-8 bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Chi tiết đơn hàng</h2>
            {role === "admin" && selectedInvoice.user && (
              <p className="text-sm text-gray-500 mb-2">
                <strong>Người mua:</strong> {selectedInvoice.user.name} (
                {selectedInvoice.user.email})
              </p>
            )}
            <p className="mb-2">
              <strong>Mã hóa đơn:</strong> {selectedInvoice._id}
            </p>
            <p className="mb-2">
              <strong>Tổng tiền:</strong>{" "}
              {selectedInvoice.totalPrice?.toLocaleString() || 0} VND
            </p>
            <p className="mb-2">
              <strong>Trạng thái:</strong> {selectedInvoice.status || "-"}
            </p>
            <p className="mb-2">
              <strong>Ngày tạo:</strong>{" "}
              {selectedInvoice.createdAt
                ? new Date(selectedInvoice.createdAt).toLocaleString()
                : "-"}
            </p>

            <h3 className="mt-4 font-semibold">Sản phẩm:</h3>
            <ul className="mt-2 space-y-2">
              {selectedInvoice.items?.map((item, idx) => (
                <li
                  key={idx}
                  className="flex justify-between bg-gray-50 p-2 rounded"
                >
                  <span>{item.product_id.name}</span>
                  <span>
                    {item.quantity} x {item.product_id.price.toLocaleString()}{" "}
                    VND
                  </span>
                </li>
              ))}
            </ul>

            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setSelectedInvoice(null)}
            >
              Đóng
            </Button>
          </div>
        )}

        {/* PAGINATION */}
        {invoices.length > 0 && (
          <div className="flex justify-center gap-2 mt-6">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <span className="py-2 px-3 bg-gray-100 rounded">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau
            </Button>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-700">
          © 2025 Công ty của bạn. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default OrderHistory;
