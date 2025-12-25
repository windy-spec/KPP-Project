import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import searchIcon from "@/assets/icon/search_icon.png";
import cartIcon from "@/assets/icon/shopping-bag.png";
import MobileHeader from "./MobileHeader";

// ==========================================
// 1. INTERFACES & CONFIG
// ==========================================

interface User {
  _id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

interface ProductSearch {
  _id: string;
  name: string;
  avatar?: string;
  price: number;
  final_price?: number;
}

const SERVER_BASE_URL = "http://localhost:5001";

// Helper: Format tiền tệ
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);

// Helper: Xử lý link ảnh
const getFullImageUrl = (path?: string) =>
  path
    ? path.startsWith("http")
      ? path
      : `${SERVER_BASE_URL}${path}`
    : "https://placehold.co/50x50/e2e8f0/808080?text=IMG";

const Navbartop: React.FC = () => {
  const navigate = useNavigate();

  // --- STATE USER & SYSTEM ---
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // --- STATE CART ---
  const [cartCount, setCartCount] = useState<number>(0);

  // --- 🔥 STATE SEARCH (QUAN TRỌNG) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- REFS ---
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // ==========================================
  // 2. LOGIC CART (GIỮ NGUYÊN)
  // ==========================================
  const updateCartCount = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/api/cart`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCartCount(data.total_quantity || 0);
        } else {
          setCartCount(0);
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      try {
        const raw = localStorage.getItem("cart");
        if (!raw) return setCartCount(0);
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) {
          const total = arr.reduce(
            (acc: number, item: any) => acc + Number(item.quantity || 0),
            0
          );
          setCartCount(total);
        }
      } catch (e) {
        setCartCount(0);
      }
    }
  };

  useEffect(() => {
    updateCartCount();
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  // ==========================================
  // 3. LOGIC LIVE SEARCH (ĐÚNG YÊU CẦU CỦA BẠN)
  // ==========================================
  useEffect(() => {
    // Nếu chưa nhập đủ 2 ký tự thì chưa tìm (tránh spam)
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    // Debounce: Đợi 500ms sau khi ngừng gõ mới gọi API
    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        //  GỌI API VỚI LIMIT = 5 (Hiển thị 5 cái thôi)
        const res = await fetch(
          `${SERVER_BASE_URL}/api/product?search=${encodeURIComponent(
            searchTerm
          )}&limit=5`
        );
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // Đóng Search khi click ra ngoài
  useEffect(() => {
    const handleClickOutsideSearch = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutsideSearch);
    return () =>
      document.removeEventListener("mousedown", handleClickOutsideSearch);
  }, []);

  // ==========================================
  // 4. LOGIC USER (GIỮ NGUYÊN)
  // ==========================================
  useEffect(() => {
    const getUserInfo = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setUser(null);
          return;
        }
        const response = await fetch(`${SERVER_BASE_URL}/api/users/me`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
        } else {
          localStorage.removeItem("accessToken");
          setUser(null);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch(`${SERVER_BASE_URL}/api/auth/signOut`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("cart");
      setUser(null);
      setShowUserMenu(false);
      setCartCount(0);
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/signIn";
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const isOutside =
        !buttonRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node);
      if (isOutside) setShowUserMenu(false);
    };
    if (showUserMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const toggleUserMenu = () => setShowUserMenu((prev) => !prev);

  const avatarSource = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${SERVER_BASE_URL}${user.avatarUrl}`
    : "https://placehold.co/40x40/f7931e/ffffff?text=U";

  // ==========================================
  // 5. RENDER GIAO DIỆN
  // ==========================================
  return (
    <header className="bg-gray-50 z-50 relative">
      <div className="md:hidden">
        <MobileHeader />
      </div>

      <div className="hidden md:block">
        <div className="w-4/5 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* LOGO */}
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center">
                <img src="/logo22.svg" alt="logo" className="w-14 h-14" />
                KPPaint
              </a>
            </div>

            <div className="flex items-center gap-3 text-gray-600">
              {/* --- SEARCH BOX --- */}
              <form
                ref={searchRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  // Nếu nhấn Enter -> Sang trang tìm kiếm tổng
                  if (searchTerm.trim()) {
                    navigate(
                      `/san-pham?search=${encodeURIComponent(searchTerm)}`
                    );
                    setSearchResults([]);
                  }
                }}
                className="relative"
              >
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm sản phẩm..."
                  className="w-64 md:w-80 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg py-2 px-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all"
                />

                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <img
                      src={searchIcon}
                      alt="search"
                      className="w-4 h-4 opacity-50 pointer-events-none"
                    />
                  )}
                </div>

                {/* --- DROPDOWN KẾT QUẢ (HIỂN THỊ DANH SÁCH 5 MÓN) --- */}
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-lg shadow-xl overflow-hidden z-[60]">
                    <div className="max-h-96 overflow-y-auto">
                      {searchResults.map((prod) => (
                        <div
                          key={prod._id}
                          // 🔥 SỰ KIỆN CLICK -> NHẢY TRANG CHI TIẾT
                          onClick={() => {
                            navigate(`/san-pham/${prod._id}`);
                            setSearchResults([]); // Đóng search
                            setSearchTerm(""); // Xóa chữ (tuỳ chọn)
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0 transition-colors"
                        >
                          <img
                            src={getFullImageUrl(prod.avatar)}
                            alt={prod.name}
                            className="w-10 h-10 object-cover rounded bg-gray-100 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                              {prod.name}
                            </p>
                            <div className="text-xs mt-0.5">
                              {prod.final_price &&
                              prod.final_price < prod.price ? (
                                <>
                                  <span className="text-red-600 font-bold mr-2">
                                    {formatVND(prod.final_price)}
                                  </span>
                                  <span className="text-gray-400 line-through">
                                    {formatVND(prod.price)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-700 font-bold">
                                  {formatVND(prod.price)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              {/* CART ICON */}
              <Link
                to="/gio-hang"
                className="relative p-1 rounded hover:bg-gray-100 transition-colors"
              >
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full animate-bounce-short">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* USER MENU */}
              <div>
                {isLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : user ? (
                  <div className="relative inline-block">
                    <button
                      ref={buttonRef}
                      onClick={toggleUserMenu}
                      className="flex items-center justify-center p-1 rounded-full bg-gray-100 hover:ring-2 hover:ring-orange-500 transition-all focus:outline-none"
                    >
                      <img
                        src={avatarSource}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </button>

                    {showUserMenu && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10 origin-top-right animate-fade-in"
                      >
                        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50 rounded-t-lg">
                          <p className="text-sm font-bold text-gray-900 truncate">
                            {user.displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <a
                          href="/tai-khoan"
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          Tài khoản
                        </a>
                        <a
                          href="/order-history"
                          className="block px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                        >
                          Đơn hàng
                        </a>
                        {user.role === "admin" && (
                          <>
                            <div className="border-t border-gray-100 my-1"></div>
                            <a
                              href="/quan-ly"
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                            >
                              Trang quản lý
                            </a>
                          </>
                        )}
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-lg font-medium"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <a
                    href="/signin"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg shadow-md hover:bg-orange-600 transition-all"
                  >
                    Đăng nhập
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="w-full border-t border-gray-200 opacity-60"></div>
      </div>
    </header>
  );
};

export default Navbartop;
