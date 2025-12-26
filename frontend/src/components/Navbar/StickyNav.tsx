import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, NavLink } from "react-router-dom";
import searchIcon from "@/assets/icon/search_icon.png";
import cartIcon from "@/assets/icon/shopping-bag.png";
import apiClient from "../../utils/api-user";

const SERVER_BASE_URL = "http://localhost:5001";

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

// Menu Items
const navItems = [
  "Trang Chủ",
  "Giới Thiệu",
  "Sản Phẩm",
  "Chiết Khấu",
  "Liên Hệ",
];

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value
  );

const getFullImageUrl = (path?: string) =>
  path
    ? path.startsWith("http")
      ? path
      : `${SERVER_BASE_URL}${path}`
    : "https://placehold.co/50x50/e2e8f0/808080?text=IMG";

const toPath = (label: string) => {
  const map: Record<string, string> = {
    "Trang Chủ": "/",
    "Giới Thiệu": "/gioi-thieu",
    "Sản Phẩm": "/san-pham",
    "Chiết Khấu": "/chiet-khau",
    "Liên Hệ": "/lien-he",
  };
  return map[label] || "/";
};

const StickyNav: React.FC<{ threshold?: number }> = ({ threshold = 180 }) => {
  const navigate = useNavigate();

  // --- STATE ---
  const [visible, setVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartCount, setCartCount] = useState<number>(0);

  // --- SEARCH ---
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // --- REFS ---
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLFormElement>(null);

  // --- STATE DROPDOWN & CATEGORIES (MỚI TÍCH HỢP) ---
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [catLoading, setCatLoading] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Hàm xóa bộ đếm thời gian đóng dropdown
  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // 0. Lấy danh mục sản phẩm từ Backend khi Component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setCatLoading(true);
      try {
        const res = await apiClient.get("/category");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Lỗi khi lấy danh mục:", err);
      } finally {
        setCatLoading(false);
      }
    };
    fetchCategories();
  }, []);


  // 1. SCROLL VISIBILITY
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  // 2. CART
  const updateCartCount = async () => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const response = await fetch(`${SERVER_BASE_URL}/api/cart`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setCartCount(data.total_quantity || 0);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const raw = localStorage.getItem("cart");
        if (raw) {
          const arr = JSON.parse(raw);
          const total = Array.isArray(arr)
            ? arr.reduce(
                (acc: number, item: any) => acc + Number(item.quantity || 0),
                0
              )
            : 0;
          setCartCount(total);
        } else setCartCount(0);
      } catch (e) {
        setCartCount(0);
      }
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener("cartUpdated", updateCartCount);
    return () => window.removeEventListener("cartUpdated", updateCartCount);
  }, []);

  // 3. SEARCH
  useEffect(() => {
    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `${SERVER_BASE_URL}/api/product?search=${encodeURIComponent(
            searchTerm
          )}&limit=5`
        );
        const data = await res.json();
        setSearchResults(data.products || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setSearchResults([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 4. USER
  useEffect(() => {
    const getUserInfo = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data);
        } else {
          localStorage.removeItem("accessToken");
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    getUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token)
        await fetch(`${SERVER_BASE_URL}/api/auth/signOut`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
    } catch (e) {
    } finally {
      localStorage.clear();
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/signIn";
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !buttonRef.current?.contains(e.target as Node) &&
        !menuRef.current?.contains(e.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };
    if (showUserMenu)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  const avatarSource = user?.avatarUrl
    ? user.avatarUrl.startsWith("http")
      ? user.avatarUrl
      : `${SERVER_BASE_URL}${user.avatarUrl}`
    : "https://placehold.co/40x40/f7931e/ffffff?text=U";

  // RENDER
  return (
    <div
      className={`hidden md:block fixed left-0 right-0 top-0 z-50 transform transition-transform duration-300 ease-in-out pointer-events-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="pointer-events-auto bg-white/95 backdrop-blur-sm shadow-md border-b border-gray-100">
        <div className="w-full lg:w-4/5 lg:max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="flex items-center gap-2 text-xl font-bold text-gray-800"
              >
                <img src="/logo22.svg" alt="logo" className="w-10 h-10" />
                <span className="hidden lg:block text-lg">KPPaint</span>
              </Link>
            </div>

            {/* Navigation chính với Dropdown */}
            <div className="flex justify-center grow px-4">
              <div className="bg-orange-200 rounded-full px-6 py-2 shadow-sm border border-orange-200">
                <nav className="flex gap-6 items-center text-gray-700 text-sm font-medium">
                  {navItems.map((label) => {
                    const isProduct = label === "Sản Phẩm";
                    const to = toPath(label);

                    return (
                      <div
                        key={label}
                        className="relative"
                        // Xử lý hover để mở dropdown
                        onMouseEnter={() => {
                          if (isProduct) {
                            clearCloseTimer();
                            setOpenDropdown(label);
                          }
                        }}
                        // Xử lý rời chuột với độ trễ để tránh bị tắt menu đột ngột
                        onMouseLeave={() => {
                          if (isProduct) {
                            clearCloseTimer();
                            closeTimer.current = window.setTimeout(() => setOpenDropdown(null), 200);
                          }
                        }}
                      >
                        <Link
                          to={to}
                          className="hover:text-orange-600 transition-colors relative group block py-1"
                        >
                          {label}
                          <span className="absolute left-0 bottom-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
                        </Link>

                        {/* Menu thả xuống (chỉ dành cho Sản Phẩm) */}
                        {isProduct && (
                          <div
                            className={`absolute left-1/2 transform -translate-x-1/2 mt-3 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 origin-top transition-all duration-200 ${
                              openDropdown === label
                                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                : "opacity-0 -translate-y-2 scale-95 pointer-events-none"
                            }`}
                          >
                            <div className="py-2">
                              {catLoading ? (
                                <div className="px-4 py-2 text-xs text-gray-400">Đang tải...</div>
                              ) : categories.length > 0 ? (
                                categories.map((cat) => (
                                  <Link
                                    key={cat._id}
                                    to={`/san-pham?categories=${encodeURIComponent(cat._id)}`}
                                    onClick={() => setOpenDropdown(null)}
                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                                  >
                                    {cat.name}
                                  </Link>
                                ))
                              ) : (
                                <div className="px-4 py-2 text-xs text-gray-400">Không có danh mục</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </nav>
              </div>
            </div>
            
            {/* Các icon Search, Cart, User*/}
            <div className="flex items-center gap-4 text-gray-600">
              <form
                ref={searchRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  if (searchTerm.trim()) {
                    navigate(
                      `/san-pham?search=${encodeURIComponent(searchTerm)}`
                    );
                    setSearchResults([]);
                  }
                }}
                className="relative hidden lg:block"
              >
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm kiếm..."
                  className="w-48 text-sm bg-gray-100 border-none rounded-full py-2 px-4 pl-10 focus:ring-2 focus:ring-orange-300 transition-all"
                />
                <img
                  src={searchIcon}
                  alt="search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50"
                />
                {searchResults.length > 0 && (
                  <div className="absolute top-full right-0 w-80 mt-3 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden z-[60]">
                    <div className="max-h-80 overflow-y-auto">
                      {searchResults.map((prod) => (
                        <div
                          key={prod._id}
                          onClick={() => {
                            navigate(`/san-pham/${prod._id}`);
                            setSearchResults([]);
                            setSearchTerm("");
                          }}
                          className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b last:border-b-0"
                        >
                          <img
                            src={getFullImageUrl(prod.avatar)}
                            className="w-10 h-10 object-cover rounded-md bg-gray-100"
                            alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-800 line-clamp-1">
                              {prod.name}
                            </p>
                            <p className="text-xs text-orange-600 font-bold">
                              {formatVND(prod.final_price || prod.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>

              <Link
                to="/gio-hang"
                className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
                    {cartCount > 99 ? "99" : cartCount}
                  </span>
                )}
              </Link>

              <div>
                {isLoading ? (
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : user ? (
                  <div className="relative">
                    <button
                      ref={buttonRef}
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center justify-center w-8 h-8 rounded-full overflow-hidden border border-gray-200 hover:ring-2 hover:ring-orange-400 transition-all"
                    >
                      <img
                        src={avatarSource}
                        alt="Avt"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    {showUserMenu && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 mt-3 w-64 bg-white border border-gray-100 rounded-xl shadow-xl z-50 animate-fade-in origin-top-right overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-sm font-bold text-gray-800 truncate">
                            {user.displayName || "User"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email}
                          </p>
                        </div>
                        <div className="py-1">
                          <Link
                            to="/tai-khoan"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                          >
                            Tài khoản
                          </Link>
                          {user.role === "admin" ? (
                            <Link
                              to="/quan-ly"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                            >
                              Trang quản lý
                            </Link>
                          ) : (
                            <Link
                              to="/order-history"
                              className="block px-4 py-2 text-sm text-gray-700 hover:bg-orange-50"
                            >
                              Đơn hàng
                            </Link>
                          )}
                        </div>
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleLogout}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                          >
                            Đăng xuất
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to="/signin"
                    className="px-4 py-1.5 text-sm font-medium text-white bg-orange-500 rounded-full shadow hover:bg-orange-600 transition-all"
                  >
                    Đăng nhập
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyNav;
