import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";

type Order = {
  _id: string;
  user: { name: string; email: string };
  date: string;
  total: number;
  status: string;
};

type Props = {
  role: "admin" | "user";
  userId?: string; // chỉ cần khi role là user
};

const SERVER_BASE_URL = "http://localhost:5001";

const OrderHistory: React.FC<Props> = ({ role, userId }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `${SERVER_BASE_URL}/api/orders`;
        if (role === "user" && userId) {
          url += `?userId=${userId}`; // API trả về đơn hàng của user
        }
        // admin: không truyền userId → trả tất cả
        const res = await axios.get(url);
        setOrders(res.data);
      } catch (err: any) {
        setError(err?.message || "Lỗi khi tải đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [role, userId]);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="px-4 py-8 max-w-7xl mx-auto">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6">
        Lịch sử đơn hàng
      </h2>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Đang tải đơn hàng...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Lỗi: {error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-gray-500">Không có đơn hàng nào.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white shadow-sm rounded-lg p-4 border border-gray-100"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-700">
                  Đơn hàng: {order._id}
                </span>
                <span
                  className={`px-2 py-1 text-xs rounded ${
                    order.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 mb-2">
                Ngày: {order.date}
              </div>
              {role === "admin" && (
                <div className="text-sm text-gray-600 mb-2">
                  Khách hàng: {order.user.name} ({order.user.email})
                </div>
              )}
              <div className="text-lg font-bold text-orange-500">
                Tổng: {formatVND(order.total)}
              </div>
              <Button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                Xem chi tiết
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
