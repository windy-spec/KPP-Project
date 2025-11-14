import React, {
  useEffect,
  useMemo,
  useState,
  useContext,
  createContext,
  useCallback,
  ReactNode, // Import ReactNode
} from "react";
// Import icons
import {
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  X,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  LogIn,
  LogOut,
  User,
  Lock,
} from "https://cdn.skypack.dev/lucide-react@0.303.0";

// --- Cấu hình API ---
const API_BASE_URL = "http://localhost:5001/api";
const formatVND = (v: number): string =>
  new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(v))) + " đ";

// --- Định nghĩa Types (TypeScript) ---

// Thông tin User (từ /auth/profile)
interface UserProfile {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  phone: string;
  role: string;
  avatarUrl?: string;
}

// Sản phẩm (trong giỏ hàng)
interface ProductInCart {
  _id: string;
  name: string;
  price: number;
  image?: string;
  category: {
    _id: string;
    name: string;
  };
}

// Item trong giỏ hàng
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

// Toàn bộ giỏ hàng (từ /api/cart)
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

// Dữ liệu để tạo Đơn hàng
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

// Props cho Provider
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

// --- Auth Context (Quản lý Đăng nhập) ---
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
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      fetchProfile,
    }),
    [user, token, loading, login, logout, fetchProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook (với kiểm tra)
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được dùng bên trong AuthProvider");
  }
  return context;
};

// --- Cart Context (Quản lý Giỏ hàng) ---
const CartContext = createContext<CartContextType | null>(null);

const CartProvider = ({ children }: ChildrenProps) => {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, fetchProfile } = useAuth(); // Lấy token để biết khi nào user thay đổi

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

// Hook (với kiểm tra)
const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart phải được dùng bên trong CartProvider");
  }
  return context;
};

// --- MOCK COMPONENTS (Navbar & Footer) ---
const Navbartop: React.FC = () => (
  <div className="bg-gray-100 py-2 text-center text-sm text-gray-700">
    Đây là Navbartop (ví dụ: thông báo khuyến mãi)
  </div>
);
const Navbarbot: React.FC = () => (
  <div className="bg-white border-b border-gray-200 shadow-sm p-4">
    <div className="w-full max-w-7xl mx-auto px-4 sm:w-11/12 md:w-10/12 lg:w-4/5 flex justify-between items-center">
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
const StickyNav: React.FC = () => {
  return null;
};
const Navbar: React.FC = () => (
  <div className="relative z-50">
    <Navbartop />
    <Navbarbot />
    <StickyNav />
  </div>
);
const Footer: React.FC = () => (
  <footer className="bg-gray-50 text-gray-700 mt-12">
    <div className="w-full max-w-7xl mx-auto px-4 sm:w-11/12 md:w-10/12 lg:w-4/5 py-12">
      <div className="mt-8">
        <div className="h-px bg-gray-200" />
        <div className="mt-6 text-center text-sm text-gray-500">
          © 2025 KPPaint. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

// --- COMPONENT TRANG THANH TOÁN ---
const PaymentPage: React.FC = () => {
  const {
    cart,
    loading: cartLoading,
    error: cartError,
    updateItem,
    createOrder,
  } = useCart();
  const { user } = useAuth();

  // State của Form
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
    if (item && !cartLoading) {
      updateItem(productId, item.quantity + 1);
    }
  };
  const decrease = (productId: string) => {
    const item = items.find((i) => i.product._id === productId);
    if (item && !cartLoading) {
      updateItem(productId, item.quantity - 1);
    }
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

  // Provinces & dependent districts (Giữ nguyên)
  const PROVINCES = [
    { code: "HCM", name: "TP. Hồ Chí Minh" },
    { code: "HN", name: "Hà Nội" },
  ];
  const DISTRICTS: Record<string, { value: string; label: string }[]> = {
    HCM: [
      { value: "q1", label: "Quận 1" },
      { value: "q3", label: "Quận 3" },
      { value: "q4", label: "Quận 4" },
      { value: "q5", label: "Quận 5" },
      { value: "q6", label: "Quận 6" },
      { value: "q7", label: "Quận 7" },
      { value: "q8", label: "Quận 8" },
      { value: "q10", label: "Quận 10" },
      { value: "q11", label: "Quận 11" },
      { value: "q12", label: "Quận 12" },
      { value: "binh-tan", label: "Quận Bình Tân" },
      { value: "binh-thanh", label: "Quận Bình Thạnh" },
      { value: "go-vap", label: "Quận Gò Vấp" },
      { value: "phu-nhuan", label: "Quận Phú Nhuận" },
      { value: "tan-binh", label: "Quận Tân Bình" },
    ],
    HN: [
      { value: "ba-dinh", label: "Ba Đình" },
      { value: "hoan-kiem", label: "Hoàn Kiếm" },
      { value: "hai-ba-trung", label: "Hai Bà Trưng" },
      { value: "dong-da", label: "Đống Đa" },
      { value: "tay-ho", label: "Tây Hồ" },
      { value: "cau-giay", label: "Cầu Giấy" },
      { value: "thanh-xuan", label: "Thanh Xuân" },
      { value: "hoang-mai", label: "Hoàng Mai" },
      { value: "long-bien", label: "Long Biên" },
      { value: "ha-dong", label: "Hà Đông" },
      { value: "bac-tu-liem", label: "Bắc Từ Liêm" },
      { value: "nam-tu-liem", label: "Nam Từ Liêm" },
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
              Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ với bạn để xác nhận
              đơn hàng trong thời gian sớm nhất.
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
            <div className="text-3xl text-center">
              <div className="flex items-center justify-center gap-2 px-4 py-3">
                <span className="font-medium">Thanh Toán</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-9 space-y-4">
              <div className={`${boxStyle} overflow-hidden p-0`}>
                <div className="grid grid-cols-12 px-4 py-3 text-gray-600 text-sm bg-gray-50 border-b">
                  <div className="col-span-12 md:col-span-4">Tên sản phẩm</div>
                  <div className="col-span-2 text-center hidden md:block">
                    Đơn giá
                  </div>
                  <div className="col-span-2 text-center hidden md:block">
                    Giảm giá
                  </div>
                  <div className="col-span-2 text-center hidden md:block">
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
                        className="p-4 bg-white shadow-sm border rounded-md"
                      >
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                            <div className="w-16 h-16 border-0.9 overflow-hidden bg-white rounded-md flex-shrink-0">
                              <img
                                src={
                                  it.product.image ||
                                  "https://placehold.co/100x100/F1F1F1/333?text=IMG"
                                }
                                alt={it.product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-gray-800 line-clamp-2">
                                {it.product.name}
                              </div>
                              <div className="md:hidden text-sm text-gray-600 mt-1">
                                {formatVND(it.price_discount)} x {it.quantity} ={" "}
                                <span className="font-semibold text-red-600">
                                  {formatVND(it.Total_price)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-2 text-sm text-center hidden md:block">
                            {formatVND(it.price_original)}
                          </div>
                          <div className="col-span-2 text-sm text-center hidden md:block text-red-500">
                            - {formatVND(it.price_original - it.price_discount)}
                          </div>
                          <div className="col-span-12 md:col-span-2 flex justify-center">
                            <div className="inline-flex items-center border rounded mx-auto">
                              <button
                                onClick={() => decrease(it.product._id)}
                                className="px-2 py-1 hover:bg-gray-100 rounded-l-md"
                                aria-label="Giảm"
                                disabled={cartLoading}
                              >
                                −
                              </button>
                              <input
                                readOnly
                                value={it.quantity}
                                className="w-10 text-center py-1 border-l border-r"
                              />
                              <button
                                onClick={() => increase(it.product._id)}
                                className="px-2 py-1 hover:bg-gray-100 rounded-r-md"
                                aria-label="Tăng"
                                disabled={cartLoading}
                              >
                                +
                              </button>
                            </div>
                          </div>
                          <div className="col-span-2 text-right text-red-600 font-semibold hidden md:block">
                            {formatVND(it.Total_price)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={boxStyle}>
                <h3 className="text-lg font-semibold mb-3">
                  Thông tin giao hàng
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    className={inputStyle}
                    placeholder="Họ và tên"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <input
                    className={inputStyle}
                    placeholder="Email (Không bắt buộc)"
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
                    placeholder="Địa chỉ (Số nhà, đường...)"
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
                    className={`${inputStyle} ${
                      !province
                        ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                        : ""
                    }`}
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
                    placeholder="Ghi chú (Không bắt buộc)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </div>

              <div className={boxStyle}>
                <div className="font-medium mb-2">Phương thức giao hàng</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="ship"
                      value="fast"
                      checked={shipMethod === "fast"}
                      onChange={() => setShipMethod("fast")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    Giao hàng nhanh
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="ship"
                      value="economy"
                      checked={shipMethod === "economy"}
                      onChange={() => setShipMethod("economy")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    Giao hàng tiết kiệm
                  </label>
                </div>
              </div>

              <div className={boxStyle}>
                <div className="font-medium mb-2">Phương thức thanh toán</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="pay"
                      value="bank"
                      checked={payMethod === "bank"}
                      onChange={() => setPayMethod("bank")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    Thanh toán qua tài khoản ngân hàng
                  </label>
                  <label className="flex items-center gap-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="pay"
                      value="cod"
                      checked={payMethod === "cod"}
                      onChange={() => setPayMethod("cod")}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                    Thanh toán khi nhận hàng (COD)
                  </label>
                </div>
              </div>
            </div>

            <aside className="lg:col-span-3 lg:sticky lg:top-24 h-fit">
              <div className={`${boxStyle} p-3`}>
                <div className="flex items-center justify-between py-2 border-b text-sm">
                  <span>Tạm tính</span>
                  <span>{formatVND(cart?.total_original_price || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b text-sm text-red-600">
                  <span>Giảm giá</span>
                  <span>- {formatVND(cart?.total_discount_amount || 0)}</span>
                </div>
                <div className="flex items-center justify-between py-3 text-lg">
                  <span className="font-medium">Thành tiền</span>
                  <span className="text-red-600 font-semibold">
                    {formatVND(subTotal)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mb-3 text-right">
                  (Đã bao gồm VAT nếu có)
                </div>

                {orderError && (
                  <div className="text-center text-sm text-red-500 mb-3">
                    {orderError}
                  </div>
                )}

                <button
                  onClick={placeOrder}
                  disabled={items.length === 0 || cartLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-md font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading ? "Đang tải..." : "THANH TOÁN"}
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

// --- Form Đăng nhập ---
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
      setError((err as Error).message || "Sai username hoặc password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex items-center justify-center min-h-screen bg-gray-50 -mt-20">
        <div className="w-full max-w-sm p-8 space-y-6 bg-white shadow-lg rounded-md">
          <h2 className="text-2xl font-bold text-center">Đăng nhập</h2>
          <p className="text-center text-sm text-gray-600">
            Bạn cần đăng nhập để xem trang thanh toán.
          </p>
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
                className="w-full border rounded-md py-2 px-10"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border rounded-md py-2 px-10"
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn || loading}
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              <LogIn className="inline-block mr-2 h-5 w-5" />
              {isLoggingIn ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
};

// --- COMPONENT APP CHÍNH (Logic điều hướng) ---
const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-xl font-medium">Đang tải...</div>
      </div>
    );
  }

  if (user) {
    return <PaymentPage />;
  }

  return <LoginForm />;
};

// --- Provider Wrapper (Bọc App trong các Context) ---
const AppWrapper: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </AuthProvider>
  );
};

export default AppWrapper;
