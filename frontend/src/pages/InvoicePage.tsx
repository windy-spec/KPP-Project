import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";

const SERVER_BASE_URL = "http://localhost:5001";

type InvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  discount?: number; // %
};

type Invoice = {
  _id: string;
  user?: { name?: string; email?: string };
  createdAt?: string;
  items: InvoiceItem[];
  totalPrice: number;
};

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const InvoicePage: React.FC = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = localStorage.getItem("token");

  // Fetch hóa đơn thực
  useEffect(() => {
    if (!invoiceId || !token) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${SERVER_BASE_URL}/api/invoice/${invoiceId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setInvoice(res.data);

        // Reset giỏ hàng khi đã thanh toán xong
        await axios.post(
          `${SERVER_BASE_URL}/api/cart/clear`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err: any) {
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId, token]);

  if (loading) return <div className="p-8">Đang tải hóa đơn...</div>;
  if (error) return <div className="p-8 text-red-500">{error}</div>;
  if (!invoice) return <div className="p-8">Không tìm thấy hóa đơn</div>;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-orange-500 text-white shadow-md py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            MyShop
          </Link>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto md:px-8 lg:px-16">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Hóa đơn: {invoice._id}
          </h2>
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Khách hàng:</span>{" "}
                {invoice.user?.name || "N/A"}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Ngày:</span>{" "}
                {invoice.createdAt
                  ? new Date(invoice.createdAt).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>

          {/* ITEMS */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Sản phẩm
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Số lượng
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-700">Giá</th>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Giảm giá
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, idx) => {
                  const finalPrice = item.discount
                    ? item.price * (1 - item.discount / 100)
                    : item.price;
                  return (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4">{formatVND(item.price)}</td>
                      <td className="py-3 px-4">
                        {item.discount ? `${item.discount}%` : "-"}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatVND(finalPrice * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* TOTAL */}
          <div className="mt-6 flex justify-end">
            <div className="text-right">
              <p className="text-gray-700 font-semibold text-lg">
                Tổng cộng: {formatVND(invoice.totalPrice)}
              </p>
              <Button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                In hóa đơn
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InvoicePage;
