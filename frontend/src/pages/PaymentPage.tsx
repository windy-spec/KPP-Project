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
  TicketPercent, // Import icon khuyến mãi
} from "lucide-react";

// --- Cấu hình API ---
const API_BASE_URL = "http://localhost:5001/api";
const SERVER_ROOT = "http://localhost:5001";

const formatVND = (v: number): string =>
  new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(v))) + " đ";

// Hàm xử lý ảnh: Nếu path tương đối -> nối thêm domain server
const getProductImage = (product: ProductInCart) => {
  // 1. Lấy avatar hoặc ảnh đầu tiên
  const path =
    product.avatar ||
    (product.images && product.images.length > 0 ? product.images[0] : null);

  // 2. Nếu không có ảnh nào -> Trả về ảnh placeholder
  if (!path) return "https://placehold.co/100x100/F1F1F1/333?text=No+Image";

  // 3. Nếu có ảnh -> Kiểm tra xem có cần nối domain không
  return path.startsWith("http") ? path : `${SERVER_ROOT}${path}`;
};

// --- Định nghĩa Types (TypeScript) ---

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
  category: {
    _id: string;
    name: string;
  };
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

// Context Types
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
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

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
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response;
};

// --- Auth Context ---
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
      console.error("Lỗi fetchProfile:", (error as Error).message);
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

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      const data = await apiFetch("/auth/signin", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      localStorage.setItem("accessToken", data.accessToken);
      setToken(data.accessToken);
      return true;
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      throw error;
    }
  };

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/signout", { method: "POST" });
    } catch (error) {
      console.error("Lỗi đăng xuất (bỏ qua):", error);
    } finally {
      localStorage.removeItem("accessToken");
      setToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, logout, fetchProfile }),
    [user, token, loading, login, logout, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  return context;
};

// --- Cart Context ---
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
    } catch (error) {
      console.error("Lỗi fetchCart:", (error as Error).message);
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
      const mergeAndFetch = async () => {
        await fetchProfile();
        await fetchCart();
      };
      mergeAndFetch();
    } else {
      fetchCart();
    }
  }, [token, fetchCart, fetchProfile]);

  const updateItem = async (productId: string, quantity: number) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCart = await apiFetch("/cart/update", {
        method: "PUT",
        body: JSON.stringify({ productId, quantity }),
      });
      setCart(updatedCart);
    } catch (error) {
      console.error("Lỗi updateItem:", (error as Error).message);
      setError(`Lỗi cập nhật: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (productId: string) => {
    setLoading(true);
    setError(null);
    try {
      const updatedCart = await apiFetch(`/cart/remove/${productId}`, {
        method: "DELETE",
      });
      setCart(updatedCart);
    } catch (error) {
      console.error("Lỗi removeItem:", (error as Error).message);
      setError(`Lỗi xóa SP: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async (orderData: OrderData) => {
    setLoading(true);
    setError(null);
    try {
      const createdOrder = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify(orderData),
      });
      setCart(null);
      return createdOrder;
    } catch (error) {
      console.error("Lỗi createOrder:", (error as Error).message);
      setError(`Lỗi đặt hàng: ${(error as Error).message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = useMemo(
    () => ({
      cart,
      loading,
      error,
      fetchCart,
      updateItem,
      removeItem,
      createOrder,
    }),
    [cart, loading, error, fetchCart, updateItem, removeItem, createOrder]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context)
    throw new Error("useCart phải được dùng bên trong CartProvider");
  return context;
};

// --- MOCK COMPONENTS ---
const Navbartop: React.FC = () => (
  <div className="bg-gray-100 py-2 text-center text-sm text-gray-700">
    Thông báo khuyến mãi
  </div>
);
const Navbarbot: React.FC = () => (
  <div className="bg-white border-b border-gray-200 shadow-sm p-4">
    <div className="w-full max-w-7xl mx-auto px-4 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">KPPaint Store</div>
      <div className="space-x-4">
        <a href="/" className="text-gray-600 hover:text-blue-600">
          Trang chủ
        </a>
        <a href="/" className="text-gray-600 hover:text-blue-600">
          Sản phẩm
        </a>
        <a href="#" className="font-bold text-blue-600">
          Thanh toán
        </a>
      </div>
    </div>
  </div>
);
const StickyNav: React.FC = () => null;
const Navbar: React.FC = () => (
  <div className="relative z-50">
    <Navbartop />
    <Navbarbot />
    <StickyNav />
  </div>
);
const Footer: React.FC = () => (
  <footer className="bg-gray-50 text-gray-700 mt-12 py-12 text-center border-t">
    © 2025 KPPaint. All rights reserved.
  </footer>
);

// --- COMPONENT TRANG THANH TOÁN (FULL LOGIC & UI) ---
const PaymentPage: React.FC = () => {
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    updateItem,
    createOrder,
  } = useCart();
  const { user } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [shipMethod, setShipMethod] = useState("fast");
  const [payMethod, setPayMethod] = useState("cod");

  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.displayName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
    }
  }, [user]);

  const items = useMemo(() => cart?.items || [], [cart]);
  const subTotal = useMemo(() => cart?.final_total_price || 0, [cart]);

  const increase = (productId: string) => {
    const item = items.find((i) => i.product._id === productId);
    if (item && !cartLoading) updateItem(productId, item.quantity + 1);
  };
  const decrease = (productId: string) => {
    const item = items.find((i) => i.product._id === productId);
    if (item && !cartLoading) updateItem(productId, item.quantity - 1);
  };

  const placeOrder = async () => {
    setOrderError(null);
    if (!name || !phone || !address || !province || !district) {
      setOrderError("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }
    const orderData: OrderData = {
      shippingInfo: { name, email, phone, address, province, district, note },
      paymentMethod: payMethod,
      shippingMethod: shipMethod,
    };
    try {
      await createOrder(orderData);
      setOrderSuccess(true);
    } catch (error) {
      setOrderError((error as Error).message || "Đã xảy ra lỗi khi đặt hàng.");
    }
  };

  const PROVINCES = [
    { code: "HCM", name: "TP. Hồ Chí Minh" },
    { code: "HN", name: "Hà Nội" },
  ];
  const DISTRICTS: Record<string, { value: string; label: string }[]> = {
    HCM: [
      { value: "q1", label: "Quận 1" },
      { value: "q3", label: "Quận 3" },
      { value: "binh-thanh", label: "Quận Bình Thạnh" },
      { value: "go-vap", label: "Quận Gò Vấp" },
      { value: "phu-nhuan", label: "Quận Phú Nhuận" },
      { value: "tan-binh", label: "Quận Tân Bình" },
    ],
    HN: [
      { value: "ba-dinh", label: "Ba Đình" },
      { value: "hoan-kiem", label: "Hoàn Kiếm" },
      { value: "cau-giay", label: "Cầu Giấy" },
    ],
  };
  const districtOptions = useMemo(() => DISTRICTS[province] || [], [province]);

  const inputStyle =
    "border p-2 rounded-md shadow-sm w-full focus:border-blue-500 focus:ring-blue-500 transition-all";
  const boxStyle = "bg-white border-0.9 shadow-lg p-4 rounded-md";

  if (orderSuccess) {
    return (
      <>
        <Navbar />
        <div className="bg-gray-50 min-h-screen py-4 md:py-6 flex items-center justify-center">
          <div className={`${boxStyle} text-center max-w-lg mx-auto`}>
            <CheckCircle className="text-green-500 w-16 h-16 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-3">
              Đặt hàng thành công!
            </h2>
            <p className="text-gray-600 mb-6">
              Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ sớm.
            </p>
            <a
              href="/"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
            >
              Tiếp tục mua sắm
            </a>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-4 md:py-6">
        <div className="w-full max-w-7xl mx-auto px-4 sm:w-11/12 md:w-10/12 lg:w-4/5">
          <div className="bg-white border-0.9 shadow-lg mb-4 rounded-md">
            <div className="text-3xl text-center py-3 font-medium">
              Thanh Toán
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* CỘT TRÁI */}
            <div className="lg:col-span-9 space-y-4">
              {/* Danh sách sản phẩm */}
              <div className={`${boxStyle} overflow-hidden p-0`}>
                <div className="grid grid-cols-12 px-4 py-3 text-gray-600 text-sm bg-gray-50 border-b font-semibold">
                  <div className="col-span-12 md:col-span-5">Sản phẩm</div>
                  <div className="col-span-2 text-center hidden md:block">
                    Đơn giá
                  </div>
                  <div className="col-span-3 text-center hidden md:block">
                    Số lượng
                  </div>
                  <div className="col-span-2 text-right hidden md:block">
                    Thành tiền
                  </div>
                </div>

                {cartLoading && (
                  <div className="p-6 text-center text-gray-600">
                    Đang tải giỏ hàng...
                  </div>
                )}
                {cartError && (
                  <div className="p-6 text-center text-red-500">
                    {cartError}
                  </div>
                )}

                {!cartLoading && items.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    Chưa có sản phẩm.{" "}
                    <a href="/" className="text-orange-500 underline">
                      Quay lại mua sắm
                    </a>
                  </div>
                ) : (
                  <div className="px-4 pb-4 space-y-3 pt-4">
                    {items.map((it) => (
                      <div
                        key={it.product._id}
                        className="p-4 bg-white shadow-sm border rounded-md hover:shadow-md transition-shadow"
                      >
                        <div className="grid grid-cols-12 items-center gap-4">
                          {/* Info + Ảnh + Badge KM */}
                          <div className="col-span-12 md:col-span-5 flex items-start gap-3">
                            <div className="w-20 h-20 border rounded-md overflow-hidden flex-shrink-0 bg-gray-100">
                              <img
                                // 🚨 SỬA LẠI: Truyền nguyên object it.product vào hàm
                                src={getProductImage(it.product)}
                                alt={it.product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://placehold.co/100x100/F1F1F1/333?text=No+Image";
                                }}
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-800 line-clamp-2">
                                {it.product.name}
                              </div>
                              {it.applied_discount && (
                                <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-100 rounded text-xs text-red-600">
                                  <TicketPercent size={12} />
                                  <span className="font-semibold truncate max-w-[180px]">
                                    {it.applied_discount.program_name} (-
                                    {it.applied_discount.discount_percent}%)
                                  </span>
                                </div>
                              )}
                              <div className="md:hidden text-sm text-gray-600 mt-2 flex justify-between">
                                <span>
                                  {formatVND(it.price_discount)} x {it.quantity}
                                </span>
                                <span className="font-semibold text-red-600">
                                  {formatVND(it.Total_price)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Giá */}
                          <div className="col-span-2 text-center hidden md:block text-sm">
                            {it.applied_discount ? (
                              <div className="flex flex-col items-center">
                                <span className="text-gray-400 line-through text-xs">
                                  {formatVND(it.price_original)}
                                </span>
                                <span className="font-medium text-gray-900">
                                  {formatVND(it.price_discount)}
                                </span>
                              </div>
                            ) : (
                              <span className="font-medium text-gray-900">
                                {formatVND(it.price_original)}
                              </span>
                            )}
                          </div>

                          {/* Số lượng */}
                          <div className="col-span-12 md:col-span-3 flex justify-center">
                            <div className="inline-flex items-center border rounded-md shadow-sm bg-white">
                              <button
                                onClick={() => decrease(it.product._id)}
                                className="px-3 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                disabled={cartLoading}
                              >
                                <Minus size={14} />
                              </button>
                              <input
                                readOnly
                                value={it.quantity}
                                className="w-10 text-center py-1 text-sm border-l border-r outline-none font-medium"
                              />
                              <button
                                onClick={() => increase(it.product._id)}
                                className="px-3 py-1 hover:bg-gray-100 text-gray-600 disabled:opacity-50"
                                disabled={cartLoading}
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Thành tiền */}
                          <div className="col-span-2 text-right hidden md:block">
                            <div className="text-red-600 font-bold text-base">
                              {formatVND(it.Total_price)}
                            </div>
                            {it.applied_discount &&
                              it.applied_discount.saved_amount > 0 && (
                                <div className="text-xs text-green-600 mt-1 italic">
                                  Tiết kiệm:{" "}
                                  {formatVND(it.applied_discount.saved_amount)}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Thông Tin */}
              <div className={boxStyle}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
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
                    placeholder="Điện thoại"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <input
                    className={inputStyle}
                    placeholder="Địa chỉ"
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
                    <option value="">Chọn tỉnh thành</option>
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
                    <option value="">Chọn quận huyện</option>
                    {districtOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    className={`${inputStyle} md:col-span-2 min-h-[80px]`}
                    placeholder="Ghi chú (Nếu có)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              {/* Phương thức Giao hàng & Thanh toán */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={boxStyle}>
                  <div className="font-medium mb-3">Vận chuyển</div>
                  <label className="flex items-center gap-3 p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="ship"
                      value="fast"
                      checked={shipMethod === "fast"}
                      onChange={() => setShipMethod("fast")}
                    />{" "}
                    Nhanh
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="ship"
                      value="economy"
                      checked={shipMethod === "economy"}
                      onChange={() => setShipMethod("economy")}
                    />{" "}
                    Tiết kiệm
                  </label>
                </div>
                <div className={boxStyle}>
                  <div className="font-medium mb-3">Thanh toán</div>
                  <label className="flex items-center gap-3 p-3 border rounded mb-2 cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="pay"
                      value="bank"
                      checked={payMethod === "bank"}
                      onChange={() => setPayMethod("bank")}
                    />{" "}
                    Chuyển khoản
                  </label>
                  <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="pay"
                      value="cod"
                      checked={payMethod === "cod"}
                      onChange={() => setPayMethod("cod")}
                    />{" "}
                    COD
                  </label>
                </div>
              </div>
            </div>

            {/* CỘT PHẢI: TỔNG KẾT */}
            <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
              <div className={`${boxStyle} p-4`}>
                <h3 className="font-semibold mb-4 border-b pb-2">Đơn hàng</h3>
                <div className="flex justify-between py-2 text-sm">
                  <span>Tổng tiền hàng</span>
                  <span>{formatVND(cart?.total_original_price || 0)}</span>
                </div>
                {(cart?.total_discount_amount || 0) > 0 && (
                  <div className="flex justify-between py-2 text-sm text-green-600">
                    <span>Tiết kiệm</span>
                    <span>- {formatVND(cart?.total_discount_amount || 0)}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 text-sm border-b border-dashed mb-4">
                  <span>Vận chuyển</span>
                  <span>Liên hệ</span>
                </div>
                <div className="flex justify-between mb-6">
                  <span className="font-bold">Tổng cộng</span>
                  <span className="text-xl text-red-600 font-bold">
                    {formatVND(subTotal)}
                  </span>
                </div>

                {orderError && (
                  <div className="text-red-500 text-sm text-center mb-4 bg-red-50 p-2 rounded">
                    {orderError}
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={items.length === 0 || cartLoading}
                  className="w-full py-3 bg-orange-500 text-white rounded font-bold hover:bg-orange-600 disabled:opacity-50"
                >
                  {cartLoading ? "Đang xử lý..." : "ĐẶT HÀNG NGAY"}
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

// --- LOGIN FORM ---
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
    } catch (err) {
      setError((err as Error).message || "Đăng nhập thất bại.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 -mt-20">
        <div className="w-full max-w-sm p-8 bg-white shadow-lg rounded-md">
          <h2 className="text-2xl font-bold text-center mb-6">Đăng nhập</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full border rounded pl-10 py-2"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border rounded pl-10 py-2"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn || loading}
              className="w-full bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 disabled:opacity-50"
            >
              <LogIn className="inline-block mr-2 h-4 w-4" />{" "}
              {isLoggingIn ? "Đang vào..." : "Đăng nhập"}
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
      <div className="flex items-center justify-center min-h-screen">
        Đang tải...
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
