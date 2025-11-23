import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SERVER_BASE_URL = "http://localhost:5001";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

const getFullImage = (p?: string) =>
  p?.startsWith("http") ? p : `${SERVER_BASE_URL}${p}`;

const MiniCart: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [show, setShow] = useState(false);

  const loadLocalCart = () => {
    try {
      const raw = localStorage.getItem("cart");
      const cart = raw ? JSON.parse(raw) : [];
      setItems(cart.slice(-5).reverse());
    } catch {}
  };

  useEffect(() => {
    // Load ngay lần đầu
    loadLocalCart();

    // Lắng nghe sự kiện cartUpdated
    const handler = () => {
      loadLocalCart();
      setShow(true);
      setTimeout(() => setShow(false), 6000);
    };

    window.addEventListener("cartUpdated", handler);
    return () => window.removeEventListener("cartUpdated", handler);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed right-6 bottom-6 w-96 bg-white border rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div className="font-medium">Đã thêm vào giỏ hàng</div>
        <button
          onClick={() => setShow(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="p-3 max-h-60 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-sm text-gray-500">Giỏ hàng trống</div>
        ) : (
          items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-3 py-2">
              <img
                src={getFullImage(it.avatar)}
                className="w-12 h-12 rounded object-cover"
              />
              <div className="flex-1">
                <div className="text-sm font-medium">{it.name}</div>
                <div className="text-xs text-gray-500">SL: {it.quantity}</div>
              </div>
              <div className="text-sm font-semibold text-gray-700">
                {formatVND(it.quantity * it.price)}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-t bg-gray-50 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-500">Tổng tạm</div>
          <div className="font-bold">
            {formatVND(
              items.reduce((s, it) => s + it.price * it.quantity, 0)
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to="/gio-hang"
            className="px-3 py-2 border rounded text-sm hover:bg-gray-100"
          >
            Giỏ hàng
          </Link>
          <Link
            to="/thanh-toan"
            className="px-3 py-2 bg-orange-500 text-white rounded text-sm"
          >
            Thanh toán
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MiniCart;
