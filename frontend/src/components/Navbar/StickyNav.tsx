import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import apiClient from "../../utils/api-user";
// Đảm bảo các đường dẫn icon này là đúng trong project của bạn
import searchIcon from "@/assets/icon/search_icon.png";
import cartIcon from "@/assets/icon/shopping-bag.png";

// 🚨 BASE URL CỦA SERVER BACKEND
const SERVER_BASE_URL = "http://localhost:5001";

// Dữ liệu cấu trúc cho Dropdown (giữ nguyên)
const dropdownItems = {
  "Sản Phẩm": [
    { label: "Dụng cụ sơn", path: "/san-pham/dung-cu" },
    { label: "Sơn nước", path: "/san-pham/son-nuoc" },
    { label: "Sơn xịt", path: "/san-pham/son-xit" },
  ],
  "Chiết Khấu": [
    { label: "Ưu đãi hôm nay", path: "/chiet-khau/uu-dai-hom-nay" },
    { label: "Mã giảm giá", path: "/chiet-khau/ma-giam-gia" },
  ],
};

interface User {
  _id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

const items = ["Trang Chủ", "Giới Thiệu", "Sản Phẩm", "Chiết Khấu", "Liên Hệ"];
const isDropdown = (label: string) => dropdownItems.hasOwnProperty(label);

// Helper để tạo path (slug) (giữ nguyên)
const toPath = (label: string) => {
  const slug = label
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  if (slug === "trang-chu" || slug === "home") return "/";
  return `/${slug}`;
};

const StickyNav: React.FC<{ threshold?: number }> = ({ threshold = 180 }) => {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const closeTimer = useRef<number | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Toggle Menu (giữ nguyên)
  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };

  // Logout (Đã thêm SERVER_BASE_URL)
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
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("resetEmail");
      setUser(null);
      setShowUserMenu(false);
      // clear local cart and notify navbars so badge resets immediately
      try { localStorage.removeItem("cart"); } catch (e) {}
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/signIn";
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      try { localStorage.removeItem("cart"); } catch (e) {}
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/signin";
    }
  };

  // useEffect close menu logout (giữ nguyên)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showUserMenu]);

  // useEffect get info user (Đã thêm SERVER_BASE_URL)
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
          localStorage.removeItem("refreshToken");
          setUser(null);
        }
      } catch (error) {
        console.error(error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, []);

  // Cart count (listen for cartUpdated)
  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem('cart');
        if (!raw) return setCartCount(0);
        const arr = JSON.parse(raw);
        // Count distinct products (unique productId) so badge shows number of product types, not total quantity
        const total = Array.isArray(arr)
          ? new Set(arr.map((it: any) => it.productId ?? it.id ?? JSON.stringify(it))).size
          : 0;
        setCartCount(total);
      } catch (e) {
        setCartCount(0);
      }
    };

    readCart();
    const onUpdate = () => readCart();
    window.addEventListener('cartUpdated', onUpdate);
    return () => window.removeEventListener('cartUpdated', onUpdate);
  }, []);

  // Logic hiển thị/ẩn thanh nav khi cuộn (giữ nguyên)
  useEffect(() => {
    if (typeof window === "undefined") return;

    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setVisible(window.scrollY > threshold);
          ticking = false;
        });
        ticking = true;
      }
      setOpenDropdown(null); // Tắt dropdown khi cuộn
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    setVisible(window.scrollY > threshold);

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  // Fetch categories for product dropdown (giữ nguyên)
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const res = await apiClient.get("/category");
        if (!mounted) return;
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err: any) {
        console.error("Lỗi khi lấy danh mục:", err);
        if (mounted) setCatError("Không thể tải danh mục");
      } finally {
        if (mounted) setCatLoading(false);
      }
    };
    fetchCategories();
    return () => {
      mounted = false;
    };
  }, []);

  // Hàm đóng dropdown khi người dùng nhấp ra ngoài (giữ nguyên)
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const dropdownContainer = document.getElementById("sticky-nav-menu");
      if (
        dropdownContainer &&
        !dropdownContainer.contains(event.target as Node)
      ) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      clearCloseTimer();
    };
  }, []);

  // --------------------------------------------------------------------------------
  // JSX Render
  // --------------------------------------------------------------------------------

  // 🚨 LOGIC HIỂN THỊ AVATAR ĐÃ SỬA LỖI URL
  const avatarSource = user?.avatarUrl
    ? `${SERVER_BASE_URL}${user.avatarUrl}` // GẮN BASE URL CHO ẢNH
    : "https://placehold.co/40x40/f7931e/ffffff?text=U"; // Placeholder

  return (
    /* Desktop sticky nav */
    <div
      className={`hidden md:block fixed left-0 right-0 top-0 z-50 transform transition-transform duration-200 ease-in-out pointer-events-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto bg-gray-50">
        <div className="w-full lg:w-4/5 lg:max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* left: logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <a href="/" className="flex items-center text-xl text-gray-800">
                <img
                  src="/logo22.svg"
                  alt="logo"
                  className="w-10 h-10 md:w-14 md:h-14"
                />
                KPPaint
              </a>
            </div>

            {/* center: rounded orange nav */}
            <div
              className="flex justify-center grow-0 shrink-0"
              id="sticky-nav-menu"
            >
              <div className="bg-orange-200 rounded-sm px-4 md:px-4 lg:px-8 py-2 shadow-md">
                <nav className="flex gap-3 md:gap-4 lg:gap-6 items-center text-gray-800 text-xs md:text-sm">
                  {items.map((label) => {
                    const hasDropdown = isDropdown(label);
                    const isActive = openDropdown === label;
                    const path = toPath(label);

                    if (hasDropdown) {
                      return (
                        <div
                          key={label}
                          className="relative"
                          onMouseEnter={() => {
                            clearCloseTimer();
                            setOpenDropdown(label);
                          }}
                          onMouseLeave={() => {
                            clearCloseTimer();
                            closeTimer.current = window.setTimeout(
                              () => setOpenDropdown(null),
                              260
                            );
                          }}
                        >
                          {/* Label điều hướng trực tiếp */}
                          <a
                            href={path}
                            onClick={() => setOpenDropdown(null)}
                            className="hover:text-white transition-colors duration-200 py-1"
                          >
                            {label}
                          </a>

                          {/* Menu thả xuống */}
                          <div
                            className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-36 md:w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-30 origin-top transition-all duration-200 ease-out ${
                              isActive
                                ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                                : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
                            }`}
                            onMouseEnter={() => {
                              clearCloseTimer();
                              setOpenDropdown(label);
                            }}
                            onMouseLeave={() => {
                              clearCloseTimer();
                              closeTimer.current = window.setTimeout(
                                () => setOpenDropdown(null),
                                260
                              );
                            }}
                          >
                            {label === "Sản Phẩm" ? (
                              catLoading ? (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Đang tải...
                                </div>
                              ) : catError ? (
                                <div className="px-3 py-2 text-sm text-red-500">
                                  {catError}
                                </div>
                              ) : categories.length ? (
                                categories.map((cat) => (
                                  <Link
                                    key={cat._id || cat.id || cat.name}
                                    to={`/san-pham?categories=${encodeURIComponent(
                                      cat._id || cat.id || cat.name
                                    )}`}
                                    onClick={() => setOpenDropdown(null)}
                                    className="block px-3 md:px-4 py-2 text-gray-800 text-xs hover:bg-orange-100 transition-colors duration-150"
                                  >
                                    {cat.name}
                                  </Link>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-sm text-gray-500">
                                  Không có danh mục
                                </div>
                              )
                            ) : (
                              dropdownItems[
                                label as keyof typeof dropdownItems
                              ].map((item) => (
                                <Link
                                  key={item.label}
                                  to={item.path}
                                  onClick={() => setOpenDropdown(null)}
                                  className="block px-3 md:px-4 py-2 text-gray-800 text-xs hover:bg-orange-100 transition-colors duration-150"
                                >
                                  {item.label}
                                </Link>
                              ))
                            )}
                          </div>
                        </div>
                      );
                    }

                    // Link thông thường
                    return (
                      <a
                        key={label}
                        href={path}
                        className="hover:text-white transition-colors duration-200 py-1"
                      >
                        {label}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </div>

            {/* right: search box and icons */}
            <div className="flex items-center gap-2 md:gap-3 text-gray-600">
              {/* Search form (Ẩn trên tablet, chỉ hiện trên desktop (lg)) */}
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative hidden lg:block"
                aria-label="search-form"
              >
                <input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm."
                  className="w-48 lg:w-64 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg py-2 px-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <img
                  src={searchIcon}
                  alt="search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                />
              </form>

              {/*Cart*/}
              <Link to="/gio-hang" aria-label="cart" className="relative p-1 rounded hover:bg-gray-100">
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* User / Sign In */}
              <div>
                {isLoading ? (
                  // Loading state
                  <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                ) : user ? (
                  // Đã đăng nhập
                  <div className="relative inline-block">
                    <button
                      ref={buttonRef}
                      onClick={toggleUserMenu}
                      className="flex items-center justify-center p-1 rounded-full bg-gray-100 hover:ring-2 hover:ring-orange-500 transition-all focus:outline-none"
                      aria-expanded={showUserMenu}
                      aria-haspopup="true"
                    >
                      <img
                        src={avatarSource} // 🚨 SỬ DỤNG SOURCE ĐÚNG
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 mt-2 w-64 md:w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10 origin-top-right animate-fade-in"
                        role="menu"
                        aria-orientation="vertical"
                      >
                        <a
                          href="/tai-khoan"
                          className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                          role="menuitem"
                        >
                          Tài khoản (
                          {user.displayName || user.email || "Người dùng"})
                        </a>
                        <a
                          href="/order-history"
                          className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                          role="menuitem"
                        >
                          Đơn hàng
                        </a>
                        {/* Chỉ hiển thị nếu role là admin */}
                        {user.role === "admin" && (
                          <>
                            <a
                              href="/quan-ly"
                              className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                              role="menuitem"
                            >
                              Trang quản lý
                            </a>

                            <a
                              href="/quan-ly/discount"
                              className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                              role="menuitem"
                            >
                              Quản lý Discount
                            </a>

                            <a
                              href="/quan-ly/sale"
                              className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                              role="menuitem"
                            >
                              Quản lý Chương trình Sale
                            </a>
                          </>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-3 text-red-600 bg-red-50 hover:bg-red-100 transition-colors border-t border-gray-200"
                          role="menuitem"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* KHỐI 2: HIỂN THỊ KHI CHƯA ĐĂNG NHẬP */
                  <a
                    href="/signin"
                    className="px-3 py-1 md:px-4 md:py-2 text-xs md:text-sm font-medium text-white bg-orange-200 rounded-lg shadow-lg hover:bg-orange-300 transition-colors duration-200"
                  >
                    Đăng nhập
                  </a>
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
