import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  createContext,
  useCallback,
  ReactNode,
} from "react";
// Import icons
import {
  MapPin,
  Plus,
  Minus,
  CheckCircle,
  LogIn,
  User,
  Lock,
  TicketPercent,
  CreditCard,
  QrCode,
  Truck,
  Loader2,
  X,
} from "lucide-react";

import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

// --- Cấu hình API ---
const API_BASE_URL = "http://localhost:5001/api";
const SERVER_ROOT = "http://localhost:5001";

const formatVND = (v: number): string =>
  new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(v))) + " đ";

// Hàm xử lý ảnh
const getProductImage = (product: ProductInCart) => {
  const path =
    product.avatar ||
    (product.images && product.images.length > 0 ? product.images[0] : null);
  if (!path) return "https://placehold.co/100x100/F1F1F1/333?text=No+Image";
  return path.startsWith("http") ? path : `${SERVER_ROOT}${path}`;
};

// --- Định nghĩa Types ---
interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

interface ProductInCart {
  _id: string;
  name: string;
  price: number;
  avatar?: string;
  images?: string[];
  category: { _id: string; name: string };
}

interface CartItem {
  applied_discount: {
    discount_id: string;
    program_name: string;
    discount_percent: number;
    saved_amount: number;
  } | null;
  product: ProductInCart;
  quantity: number;
  price_original: number;
  price_discount: number;
  Total_price: number;
  manual_discount: string | null;
  _id: string;
}

interface Cart {
  _id: string;
  user: string | null;
  guestCartId: string | null;
  items: CartItem[];
  total_quantity: number;
  total_original_price: number;
  total_discount_amount: number;
  final_total_price: number;
}

interface ShippingInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  province: string;
  district: string;
  note: string;
}

interface OrderData {
  shippingInfo: ShippingInfo;
  paymentMethod: string;
  shippingMethod: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
}

interface CartContextType {
  cart: Cart | null;
  loading: boolean;
  error: string | null;
  fetchCart: () => Promise<void>;
  updateItem: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  createOrder: (orderData: OrderData) => Promise<any>;
}

interface ChildrenProps {
  children: ReactNode;
}

// --- Tiện ích API ---
const apiFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = localStorage.getItem("accessToken");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const fullUrl = `${API_BASE_URL}${url.startsWith("/") ? url : "/" + url}`;
  const response = await fetch(fullUrl, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Lỗi API: ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json"))
    return response.json();
  return response;
};

// --- Auth Context (Giữ nguyên) ---
const AuthContext = createContext<AuthContextType | null>(null);
const AuthProvider = ({ children }: ChildrenProps) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("accessToken")
  );
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem("accessToken");
    if (!currentToken) {
      setLoading(false);
      setUser(null);
      return;
    }
    try {
      setLoading(true);
      const data = await apiFetch("/auth/profile");
      setUser(data);
    } catch (error) {
      setUser(null);
      setToken(null);
      localStorage.removeItem("accessToken");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [token, fetchProfile]);

  const login = async (u: string, p: string) => {
    const data = await apiFetch("/auth/signin", {
      method: "POST",
      body: JSON.stringify({ username: u, password: p }),
    });
    localStorage.setItem("accessToken", data.accessToken);
    setToken(data.accessToken);
    return true;
  };

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/signout", { method: "POST" });
    } catch {
    } finally {
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, logout, fetchProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};
const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth error");
  return c;
};

// --- Cart Context (Giữ nguyên) ---
const CartContext = createContext<CartContextType | null>(null);
const CartProvider = ({ children }: ChildrenProps) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, fetchProfile } = useAuth();

  const fetchCart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/cart");
      setCart(data);
    } catch {
      setError("Không thể tải giỏ hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);
  useEffect(() => {
    if (token) {
      fetchProfile();
      fetchCart();
    } else fetchCart();
  }, [token, fetchCart, fetchProfile]);

  const updateItem = async (pid: string, qty: number) => {
    setLoading(true);
    try {
      const res = await apiFetch("/cart/update", {
        method: "PUT",
        body: JSON.stringify({ productId: pid, quantity: qty }),
      });
      setCart(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const removeItem = async (pid: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`/cart/remove/${pid}`, { method: "DELETE" });
      setCart(res);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const createOrder = async (data: OrderData) => {
    setLoading(true);
    try {
      const res = await apiFetch("/invoice", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setCart(null);
      return res;
    } catch (e: any) {
      setError(e.message);
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        fetchCart,
        updateItem,
        removeItem,
        createOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart error");
  return c;
};

// --- COMPONENT TRANG THANH TOÁN (UPDATED) ---
const PaymentPage: React.FC = () => {
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    updateItem,
    createOrder,
  } = useCart();
  const { user } = useAuth();

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [shipMethod, setShipMethod] = useState("fast");

  // Payment Method: 'cod' | 'momo' | 'bank'
  const [payMethod, setPayMethod] = useState("cod");

  // Status State
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // QR / Polling State
  const [qrData, setQrData] = useState<{
    qrCodeUrl: string;
    invoiceId: string;
    amount?: number;
    type: "bank" | "momo";
  } | null>(null);
  const [checkingPayment, setCheckingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  // Derived Data
  const items = useMemo(() => cart?.items || [], [cart]);
  const subTotal = useMemo(() => cart?.final_total_price || 0, [cart]);
  const shippingCost = useMemo(
    () => (shipMethod === "fast" ? 30000 : 15000),
    [shipMethod]
  );
  const shippingLabel = useMemo(
    () => (shipMethod === "fast" ? "Nhanh" : "Tiết kiệm"),
    [shipMethod]
  );
  const totalWithShipping = useMemo(
    () => subTotal + shippingCost,
    [subTotal, shippingCost]
  );

  const paymentLabel = useMemo(() => {
    if (payMethod === "bank") return "Chuyển khoản Ngân hàng";
    if (payMethod === "momo") return "Ví MoMo";
    return "Thanh toán khi nhận hàng (COD)";
  }, [payMethod]);

  // Actions
  const increase = (pid: string) => {
    const item = items.find((i) => i.product._id === pid);
    if (item && !cartLoading) updateItem(pid, item.quantity + 1);
  };
  const decrease = (pid: string) => {
    const item = items.find((i) => i.product._id === pid);
    if (item && !cartLoading) updateItem(pid, item.quantity - 1);
  };

  // --- LOGIC XỬ LÝ THANH TOÁN CHÍNH ---
  const placeOrder = async () => {
    setOrderError(null);
    if (!name || !phone || !address || !province || !district) {
      setOrderError("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    const payload = {
      recipient_name: name,
      recipient_phone: phone,
      recipient_address: `${address}, ${district}, ${province}`,
      shippingMethod: shipMethod,
      // Backend sẽ dùng shippingInfo này nếu là COD (createOrder cũ)
      shippingInfo: { name, email, phone, address, province, district, note },
      paymentMethod: payMethod,
    };

    try {
      // 1. THANH TOÁN MOMO
      if (payMethod === "momo") {
        const res = await apiFetch("/payments/momo", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        if (res.payUrl) {
          // Chuyển hướng sang trang Momo
          window.location.href = res.payUrl;
        }

        // 2. THANH TOÁN BANK (VIETQR)
      } else if (payMethod === "bank") {
        const res = await apiFetch("/payments/bank", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        // Hiện Popup QR
        setQrData({
          qrCodeUrl: res.qrCodeUrl,
          invoiceId: res.invoiceId,
          amount: res.amount,
          type: "bank",
        });

        // 3. COD (Thanh toán khi nhận)
      } else {
        await createOrder(payload as any); // Gọi hàm cũ
        setOrderSuccess(true);
      }
    } catch (error) {
      setOrderError((error as Error).message || "Đã xảy ra lỗi khi đặt hàng.");
    }
  };

  // --- POLLING KIỂM TRA TRẠNG THÁI (CHO BANK) ---
  useEffect(() => {
    let timer: NodeJS.Timeout;
    // Chỉ check khi đang mở Popup Bank
    if (qrData && qrData.type === "bank") {
      setCheckingPayment(true);
      timer = setInterval(async () => {
        try {
          const data = await apiFetch(`/payments/status/${qrData.invoiceId}`);
          if (data.status === "PAID") {
            clearInterval(timer);
            setCheckingPayment(false);
            setQrData(null);
            setOrderSuccess(true);
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000); // Check mỗi 3s
    }
    return () => timer && clearInterval(timer);
  }, [qrData]);

  // Data Select Tỉnh/Thành
  const PROVINCES = [
    { code: "HCM", name: "TP. Hồ Chí Minh" },
    { code: "HN", name: "Hà Nội" },
  ];
  const DISTRICTS: Record<string, { value: string; label: string }[]> = {
    HCM: [
      { value: "q1", label: "Quận 1" },
      { value: "binh-thanh", label: "Bình Thạnh" },
      { value: "thu-duc", label: "Thủ Đức" },
    ],
    HN: [
      { value: "ba-dinh", label: "Ba Đình" },
      { value: "cau-giay", label: "Cầu Giấy" },
    ],
  };
  const districtOptions = useMemo(() => DISTRICTS[province] || [], [province]);

  const inputStyle =
    "border p-2 rounded-md shadow-sm w-full focus:border-blue-500 focus:ring-blue-500 transition-all outline-none";
  const boxStyle = "bg-white border shadow-sm p-4 rounded-md";

  // --- GIAO DIỆN THÀNH CÔNG ---
  if (orderSuccess) {
    return (
      <>
        <Navbar />
        <div className="bg-gray-50 min-h-screen py-10 flex items-center justify-center">
          <div className={`${boxStyle} text-center max-w-lg mx-auto p-10`}>
            <CheckCircle className="text-green-500 w-20 h-20 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-3 text-gray-800">
              Đặt hàng thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã tin tưởng.
            </p>
            <a
              href="/"
              className="inline-block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition-colors"
            >
              Tiếp tục mua sắm
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // --- GIAO DIỆN CHÍNH ---
  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="w-full max-w-7xl mx-auto px-4 sm:w-11/12">
          <h1 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6" /> Thanh Toán Đơn Hàng
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* CỘT TRÁI: FORM & ITEMS */}
            <div className="lg:col-span-8 space-y-6">
              {/* 1. Danh sách sản phẩm */}
              <div className={`${boxStyle} overflow-hidden p-0`}>
                <div className="bg-gray-100 px-4 py-3 border-b font-semibold text-gray-700">
                  Sản phẩm trong giỏ
                </div>
                {cartLoading ? (
                  <div className="p-8 text-center text-gray-500">
                    Đang tải...
                  </div>
                ) : items.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    Giỏ hàng trống.
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((it) => (
                      <div
                        key={it.product._id}
                        className="p-4 flex items-center justify-between hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <img
                            src={getProductImage(it.product)}
                            alt=""
                            className="w-16 h-16 object-cover rounded border"
                          />
                          <div>
                            <div className="font-medium text-gray-800">
                              {it.product.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {formatVND(it.price_discount)} x {it.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-800">
                            {formatVND(it.Total_price)}
                          </div>
                          {/* Nút tăng giảm nhỏ */}
                          <div className="flex items-center justify-end gap-2 mt-1">
                            <button
                              onClick={() => decrease(it.product._id)}
                              disabled={cartLoading}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-xs font-medium w-4 text-center">
                              {it.quantity}
                            </span>
                            <button
                              onClick={() => increase(it.product._id)}
                              disabled={cartLoading}
                              className="p-1 bg-gray-200 rounded hover:bg-gray-300"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. Form Thông Tin */}
              <div className={boxStyle}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 border-b pb-2">
                  <MapPin className="w-5 h-5 text-blue-600" /> Thông tin giao
                  hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    className={inputStyle}
                    placeholder="Họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className={inputStyle}
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className={inputStyle}
                    placeholder="Số điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    className={inputStyle}
                    placeholder="Địa chỉ nhà (Số nhà, đường...)"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <select
                    className={inputStyle}
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setDistrict("");
                    }}
                  >
                    <option value="">-- Chọn Tỉnh / Thành --</option>
                    {PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputStyle}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!province}
                  >
                    <option value="">-- Chọn Quận / Huyện --</option>
                    {districtOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={`${inputStyle} md:col-span-2 min-h-[80px]`}
                    placeholder="Ghi chú thêm cho shipper..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {/* 3. Vận chuyển & Thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* VẬN CHUYỂN */}
                <div className={boxStyle}>
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="w-4 h-4" /> Vận chuyển
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                        shipMethod === "fast"
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ship"
                        value="fast"
                        checked={shipMethod === "fast"}
                        onChange={() => setShipMethod("fast")}
                        className="accent-blue-600"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          Giao Nhanh (1-2 ngày)
                        </div>
                        <div className="text-xs text-gray-500">
                          Phí: 30.000 đ
                        </div>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                        shipMethod === "economy"
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="ship"
                        value="economy"
                        checked={shipMethod === "economy"}
                        onChange={() => setShipMethod("economy")}
                        className="accent-blue-600"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          Tiết Kiệm (3-5 ngày)
                        </div>
                        <div className="text-xs text-gray-500">
                          Phí: 15.000 đ
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* THANH TOÁN */}
                <div className={boxStyle}>
                  <div className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" /> Thanh toán
                  </div>
                  <div className="space-y-2">
                    {/* MOMO */}
                    <label
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                        payMethod === "momo"
                          ? "border-pink-500 bg-pink-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        value="momo"
                        checked={payMethod === "momo"}
                        onChange={() => setPayMethod("momo")}
                        className="accent-pink-600"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-sm text-pink-700 flex justify-between">
                          Ví MoMo{" "}
                          <span className="text-[10px] bg-pink-200 text-pink-800 px-1 rounded">
                            Khuyên dùng
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Quét mã QR qua App Momo
                        </div>
                      </div>
                    </label>

                    {/* BANK */}
                    <label
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                        payMethod === "bank"
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        value="bank"
                        checked={payMethod === "bank"}
                        onChange={() => setPayMethod("bank")}
                        className="accent-blue-600"
                      />
                      <div>
                        <div className="font-medium text-sm text-blue-700">
                          Chuyển khoản Ngân hàng
                        </div>
                        <div className="text-xs text-gray-500">
                          Quét mã VietQR (Tự động xác nhận)
                        </div>
                      </div>
                    </label>

                    {/* COD */}
                    <label
                      className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                        payMethod === "cod"
                          ? "border-gray-500 bg-gray-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="radio"
                        name="pay"
                        value="cod"
                        checked={payMethod === "cod"}
                        onChange={() => setPayMethod("cod")}
                        className="accent-gray-600"
                      />
                      <div>
                        <div className="font-medium text-sm">
                          Thanh toán khi nhận hàng (COD)
                        </div>
                        <div className="text-xs text-gray-500">
                          Thanh toán tiền mặt cho shipper
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: TỔNG KẾT & NÚT ĐẶT */}
            <aside className="lg:col-span-4 lg:sticky lg:top-4 h-fit">
              <div className={`${boxStyle} p-5 border-t-4 border-t-orange-500`}>
                <h3 className="font-bold text-lg mb-4 pb-2 border-b">
                  Chi tiết thanh toán
                </h3>

                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Tổng tiền hàng</span>
                    <span className="font-medium">
                      {formatVND(cart?.total_original_price || 0)}
                    </span>
                  </div>
                  {(cart?.total_discount_amount || 0) > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Đã giảm giá</span>
                      <span>
                        - {formatVND(cart?.total_discount_amount || 0)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Phí vận chuyển ({shippingLabel})</span>
                    <span>+ {formatVND(shippingCost)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed">
                  <div className="flex justify-between items-end mb-1">
                    <span className="font-bold text-gray-800">
                      Tổng thanh toán
                    </span>
                    <span className="text-2xl font-bold text-red-600">
                      {formatVND(totalWithShipping)}
                    </span>
                  </div>
                  <div className="text-right text-xs text-gray-500 italic">
                    ({paymentLabel})
                  </div>
                </div>

                {orderError && (
                  <div className="mt-4 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded flex items-start gap-2">
                    <div className="min-w-[16px] mt-0.5">⚠️</div> {orderError}
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={items.length === 0 || cartLoading}
                  className="w-full mt-6 py-3.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-bold shadow-md hover:from-orange-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? "Đang xử lý..." : "ĐẶT HÀNG NGAY"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* QR MODAL (POPUP HIỆN QR CODE) */}
      {qrData && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden relative">
            {/* Header */}
            <div className="bg-blue-600 p-4 text-white text-center relative">
              <h3 className="font-bold text-lg">Quét Mã Thanh Toán</h3>
              <p className="text-blue-100 text-sm">
                Vui lòng không tắt màn hình
              </p>
              <button
                onClick={() => setQrData(null)}
                className="absolute top-3 right-3 text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 text-center">
              {/* QR Image */}
              <div className="bg-white p-2 border-2 border-blue-100 rounded-lg inline-block mb-4 shadow-inner">
                <img
                  src={qrData.qrCodeUrl}
                  alt="QR Code"
                  className="w-48 h-48 object-contain"
                />
              </div>

              {/* Amount */}
              <div className="mb-2 text-gray-500 text-sm">
                Số tiền cần thanh toán
              </div>
              <div className="text-2xl font-bold text-blue-700 mb-6">
                {formatVND(qrData.amount || 0)}
              </div>

              {/* Status */}
              {checkingPayment && (
                <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium flex items-center justify-center gap-2 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang chờ xác
                  nhận...
                </div>
              )}

              <p className="text-xs text-gray-400 mt-4">
                Hệ thống sẽ tự động chuyển trang khi nhận được tiền.
              </p>
            </div>

            <div className="bg-gray-50 p-3 text-center border-t">
              <button
                onClick={() => setQrData(null)}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Đóng và chọn cách khác
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

// --- LOGIN FORM (Giữ nguyên) ---
const LoginForm: React.FC = () => {
  const [username, setUsername] = useState("user");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState<string | null>(null);
  const { login, loading } = useAuth();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoggingIn(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || "Lỗi đăng nhập");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-[80vh] bg-gray-50">
        <div className="w-full max-w-sm p-8 bg-white shadow-xl rounded-lg border">
          <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
            Đăng nhập
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm bg-red-50 p-2 rounded text-center border border-red-100">
                {error}
              </div>
            )}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full border rounded pl-10 py-2.5 outline-none focus:border-blue-500 transition"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border rounded pl-10 py-2.5 outline-none focus:border-blue-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn || loading}
              className="w-full bg-blue-600 text-white py-2.5 rounded font-bold hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center gap-2"
            >
              <LogIn size={18} /> {isLoggingIn ? "Đang vào..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

// --- APP ---
const App: React.FC = () => {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 gap-2">
        <Loader2 className="animate-spin" /> Đang tải...
      </div>
    );
  return user ? <PaymentPage /> : <LoginForm />;
};

const AppWrapper: React.FC = () => (
  <AuthProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </AuthProvider>
);

export default AppWrapper;
