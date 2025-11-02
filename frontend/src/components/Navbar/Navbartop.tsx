import React, { Children, use, useEffect, useRef, useState } from "react";
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

const Navbartop: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Toggle Menu

  const toggleUserMenu = () => {
    setShowUserMenu((prev) => !prev);
  };

  // Logout

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        await fetch("http://localhost:5001/api/auth/signOut", {
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
      window.location.href = "/signIn";
    } catch (error) {
      console.error("Lỗi khi đăng xuất:", error);
      // Vẫn xóa token dù API lỗi
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      window.location.href = "/signin";
    }
  };

  // useEffect close menu logout

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const clickOutsideMenu =
        menuRef.current && !menuRef.current.contains(event.target as Node);
      const clickOutsideButton =
        buttonRef.current && !buttonRef.current.contains(event.target as Node);
      if (clickOutsideButton && clickOutsideMenu) {
        setShowUserMenu(false);
      }
      if (showUserMenu) {
        document.addEventListener("mousedown", handleClickOutside);
      }
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    };
  }, [showUserMenu]);

  // useEffect get info user
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
        const response = await fetch("http://localhost:5001/api/users/me", {
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

  return (
    <header className="bg-gray-50">
      {/* Mobile: compact header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>

      {/* Desktop: original topbar */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* left: logo */}
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center">
                {/* logo */}
                <img src="/logo22.svg" alt="logo" className="w-14 h-14" />
                KPPaint
              </a>
            </div>

            {/* right: search input + cart + user */}
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
                className="p-1 rounded hover:bg-gray-100"
              >
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
              </Link>
              {/* User */}
              {/* <button aria-label="user" className="p-1 rounded hover:bg-gray-100">
                <img src={userIcon} alt="user" className="w-5 h-5" />
              </button> */}
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
                        src={
                          user.avatarUrl ||
                          "https://placehold.co/40x40/f7931e/ffffff?text=U"
                        }
                        alt="Avatar"
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {showUserMenu && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-10 origin-top-right animate-fade-in"
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

                        {/* ✅ Chỉ hiển thị nếu role là admin */}
                        {user.role === "admin" && (
                          <a
                            href="/quan-ly"
                            className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                            role="menuitem"
                          >
                            Trang quản lý
                          </a>
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
