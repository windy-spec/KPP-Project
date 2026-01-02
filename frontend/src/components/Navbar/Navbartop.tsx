import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import searchIcon from "@/assets/icon/search_icon.png";
import cartIcon from "@/assets/icon/shopping-bag.png";
import MobileHeader from "./MobileHeader";

interface User {
  _id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

// BASE URL CỦA SERVER BACKEND
const SERVER_BASE_URL = "http://localhost:5001";

const Navbartop: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Chuyển đổi trạng thái Menu
  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };

  // Logout
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
      // Xóa local cart và thông báo cho navbar để cart reset ngay lập tức khi đăng xuất
      try {
        localStorage.removeItem("cart");
      } catch (e) {
        // Bỏ qua
      }
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/signIn";
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      try {
        localStorage.removeItem("cart");
      } catch (e) {}
      window.dispatchEvent(new Event("cartUpdated"));
      window.location.href = "/signin";
    }
  };

  // useEffect đóng menu (chỉ chạy khi mounted và khi showUserMenu thay đổi)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Kiểm tra xem click có nằm ngoài button và menu không
      const isOutside =
        !buttonRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node);

      if (isOutside) {
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

  // useEffect lấy info user
  useEffect(() => {
    const getUserInfo = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        const response = await fetch(`${SERVER_BASE_URL}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user || data);
        } else if (response.status === 401) {
          console.warn("Token không hợp lệ, đang xóa...");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");

          setUser(null);
        } else {
          console.error("Lỗi lấy thông tin user:", response.status);
          setUser(null);
        }
      } catch (error) {
        console.error("Lỗi kết nối API:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    getUserInfo();
  }, []);

  // Số lượng hàng trong giỏ lấy từ localStorage (dùng cho guest hoặc giỏ hàng tạm thời)
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem("cart");
        if (!raw) return setCartCount(0);
        const arr = JSON.parse(raw);
        // Đếm các sản phẩm riêng biệt (productId) để icon cart hiển thị số loại sản phẩm thay vì tổng số lượng
        const total = Array.isArray(arr)
          ? new Set(
              arr.map((it: any) => it.productId ?? it.id ?? JSON.stringify(it))
            ).size
          : 0;
        setCartCount(total);
      } catch (e) {
        setCartCount(0);
      }
    };

    readCart();
    const onUpdate = () => readCart();
    window.addEventListener("cartUpdated", onUpdate);
    return () => window.removeEventListener("cartUpdated", onUpdate);
  }, []);

  // Xác định URL Avatar đã được nối BASE URL
  const avatarSource = user?.avatarUrl
    ? `${SERVER_BASE_URL}${user.avatarUrl}`
    : "https://placehold.co/40x40/f7931e/ffffff?text=U";

  return (
    <header className="bg-gray-50">
      {/* MobileHeader */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* Desktop */}
      <div className="hidden md:block">
        <div className="w-4/5 max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* left: logo */}
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center">
                <img src="/logo22.svg" alt="logo" className="w-14 h-14" />
                KPPaint
              </a>
            </div>

            {/* right: search + cart + user */}
            <div className="flex items-center gap-3 text-gray-600">
              {/* Search form*/}
              <form
                onSubmit={(e) => e.preventDefault()}
                className="relative"
                aria-label="search-form"
              >
                <input
                  type="search"
                  placeholder="Tìm kiếm sản phẩm."
                  className="w-64 md:w-80 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg py-2 px-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                />
                {/* search icon */}
                <img
                  src={searchIcon}
                  alt="search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                />
              </form>
              {/*Cart*/}
              <Link
                to="/gio-hang"
                aria-label="cart"
                className="relative p-1 rounded hover:bg-gray-100"
              >
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-semibold leading-none text-white bg-red-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>
              {/* User */}
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
                        src={avatarSource}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </button>

                    {/* Dropdown Menu */}
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
                  /* KHỐI 2: HIỂN THỊ KHI CHƯA ĐĂNG NHẬP (user không tồn tại) */
                  <a
                    href="/signin"
                    className="px-4 py-2 text-sm font-medium text-white bg-orange-200 rounded-lg shadow-lg hover:bg-orange-300 transition-colors duration-200"
                  >
                    Đăng nhập
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Line */}
        <div className="w-full">
          <div className="max-w-9xl mx-auto px-4">
            <div className="h-[0.5px] bg-gray-200/70 w-full" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbartop;
