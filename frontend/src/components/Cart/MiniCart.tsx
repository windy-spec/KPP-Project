import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { ShoppingBag, X, Loader2 } from "lucide-react";

const SERVER_BASE_URL = "http://localhost:5001";

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(value) + " đ";

// Hàm xử lý ảnh an toàn
const getFullImage = (p?: string) =>
  p
    ? p.startsWith("http")
      ? p
      : `${SERVER_BASE_URL}${p}`
    : "https://placehold.co/100x100";

// Định nghĩa kiểu dữ liệu khớp với API trả về
type CartItem = {
  product: {
    _id: string;
    name: string;
    price: number;
    avatar?: string;
    images?: string[];
  };
  quantity: number;
  _id: string;
};

const MiniCart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Hàm gọi API lấy giỏ hàng
  const fetchCart = async () => {
    const token = localStorage.getItem("accessToken");
    // If no token (guest), try to read cart from localStorage fallback
    if (!token) {
      try {
        const raw = localStorage.getItem("cart");
        if (!raw) {
          setItems([]);
          return;
        }
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return setItems([]);

        // Map localStorage shape to CartItem[] used by MiniCart
        const mapped: CartItem[] = arr
          .slice()
          .reverse()
          .slice(0, 5)
          .map((it: any) => ({
            _id: it.productId || it.id || JSON.stringify(it),
            quantity: it.quantity || 1,
            product: {
              _id: it.productId || (it.product && it.product._id) || "",
              name: it.name || (it.product && it.product.name) || "Sản phẩm",
              price: it.price || (it.product && it.product.price) || 0,
              avatar: it.avatar || (it.product && it.product.avatar),
            },
          }));

        setItems(mapped);
      } catch (e) {
        console.error("Lỗi đọc cart từ localStorage", e);
        setItems([]);
      }
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${SERVER_BASE_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // API thường trả về { items: [...] } hoặc mảng trực tiếp tùy backend
      const cartData = res.data.items || res.data || [];

      // Lấy 5 sản phẩm mới nhất để hiển thị
      setItems(cartData.slice().reverse().slice(0, 5));
    } catch (error) {
      console.error("Lỗi tải MiniCart", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Lắng nghe sự kiện cartUpdated từ ProductDetail
    const handler = () => {
      fetchCart(); // Gọi API lấy dữ liệu mới nhất
      setShow(true); // Hiện popup

      // Reset timer ẩn popup (để nếu bấm liên tục thì nó không bị tắt sớm)
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setShow(false), 5000);
    };

    window.addEventListener("cartUpdated", handler);
    // --- SỬA: Lắng nghe thêm event 'cartUpdatedShow' từ các component khác (như danh sách sản phẩm)
    // Mục đích: đảm bảo MiniCart luôn mở sau khi nhấn "Thêm vào giỏ hàng" ở nhiều nơi
    window.addEventListener("cartUpdatedShow", handler);

    // Load lần đầu (ẩn) để có dữ liệu sẵn nếu cần
    fetchCart();

    return () => {
      window.removeEventListener("cartUpdated", handler);
      // Loại bỏ listener bổ sung để tránh rò rỉ bộ nhớ
      window.removeEventListener("cartUpdatedShow", handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (!show) return null;

  // Tính tạm tổng tiền của các món đang hiển thị
  const subTotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  return (
    <div className="fixed right-6 bottom-6 w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      {/* Header */}
      <div className="px-4 py-3 border-b bg-green-50 flex items-center justify-between">
        <div className="font-bold text-green-700 flex items-center gap-2">
          <ShoppingBag size={18} /> Đã thêm vào giỏ hàng
        </div>
        <button
          onClick={() => setShow(false)}
          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition"
        >
          <X size={18} />
        </button>
      </div>

      {/* Body: Danh sách sản phẩm */}
      <div className="p-0 max-h-64 overflow-y-auto">
        {loading ? (
          <div className="py-6 flex justify-center text-gray-500 gap-2">
            <Loader2 className="animate-spin" /> Đang cập nhật...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-gray-500">Giỏ hàng trống</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((it) => (
              <div
                key={it._id}
                className="flex items-center gap-3 p-3 hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 border rounded-md overflow-hidden bg-white shrink-0">
                  <img
                    src={getFullImage(
                      it.product.avatar || it.product.images?.[0]
                    )}
                    alt={it.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {it.product.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    Số lượng: {it.quantity}
                  </div>
                </div>
                <div className="text-sm font-bold text-orange-600">
                  {formatVND(it.quantity * it.product.price)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Tổng tiền & Nút bấm */}
      <div className="px-4 py-3 border-t bg-gray-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-medium text-gray-500 uppercase">
            Tạm tính (các món này)
          </span>
          <span className="font-bold text-lg text-gray-900">
            {formatVND(subTotal)}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/gio-hang"
            onClick={() => setShow(false)}
            className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 text-center transition"
          >
            Xem giỏ hàng
          </Link>
          <Link
            to="/thanh-toan" 
            onClick={() => setShow(false)}
            className="px-3 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 text-center transition shadow-sm"
          >
            Thanh toán
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MiniCart;