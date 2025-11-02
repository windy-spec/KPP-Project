import React, { useEffect, useState, useRef } from "react";
// Đảm bảo các đường dẫn icon này là đúng trong project của bạn
// Vui lòng kiểm tra lại đường dẫn file trong thư mục assets của bạn
import searchIcon from "@/assets/icon/search_icon.png";
import cartIcon from "@/assets/icon/shopping-bag.png";
import userIcon from "@/assets/icon/user.png";

// Dữ liệu cấu trúc cho Dropdown
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

// Helper để tạo path (slug)
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
  // State quản lý dropdown nào đang mở
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

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
      // Kiểm tra xem click có nằm ngoài cả nút và menu dropdown người dùng không
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

  // useEffect get info user
  useEffect(() => {
    const getUserInfo = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          setUser(null);
          return;
        }
        const response = await fetch("http://localhost:5001/api/users/me", {
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

  // Logic hiển thị/ẩn thanh nav khi cuộn
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
    // kiểm tra vị trí ban đầu
    setVisible(window.scrollY > threshold);

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  // Hàm xử lý việc mở/đóng dropdown
  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  // Hàm đóng dropdown khi người dùng nhấp ra ngoài (Cải thiện UX)
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
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    /* Desktop sticky nav */
    <div
      className={`hidden md:block fixed left-0 right-0 top-0 z-50 transform transition-transform duration-200 ease-in-out pointer-events-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      {/* FIX LỖI 1: Đặt background trên div ngoài cùng, để nó chiếm toàn bộ chiều ngang */}
      <div className="pointer-events-auto bg-gray-50">
        {/* FIX LỖI 1: Container giới hạn độ rộng nội dung và căn giữa */}
        <div className="w-full lg:max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* left: logo */}
            <div className="flex items-center gap-2 md:gap-3">
              <a href="/" className="flex items-center text-xl text-gray-800">
                {/* Tối ưu kích thước logo trên md */}
                <img
                  src="/logo22.svg"
                  alt="logo"
                  className="w-10 h-10 md:w-14 md:h-14"
                />
                KPPaint
              </a>
            </div>

            {/* center: rounded orange nav - FIX LỖI 2: Menu Phình ra */}
            <div
              // Bỏ flex-1. Dùng grow-0 shrink-0 để khối menu chỉ chiếm đúng kích thước nội dung.
              className="flex justify-center grow-0 shrink-0"
              id="sticky-nav-menu"
            >
              {/* Giảm nhẹ padding ngang trên tablet và tăng trên desktop */}
              <div className="bg-orange-200 rounded-sm px-4 md:px-4 lg:px-8 py-2 shadow-md">
                {/* Tối ưu khoảng cách và font trên tablet */}
                <nav className="flex gap-3 md:gap-4 lg:gap-6 items-center text-gray-800 text-xs md:text-sm">
                  {items.map((label) => {
                    const hasDropdown = isDropdown(label);
                    const isActive = openDropdown === label;
                    const path = toPath(label);

                    if (hasDropdown) {
                      return (
                        // Container relative cho dropdown absolute
                        <div key={label} className="relative">
                          <button
                            onClick={() => handleDropdownToggle(label)}
                            className={`flex items-center transition-colors duration-200 py-1 gap-1 text-gray-800 hover:text-white ${
                              isActive ? "text-white" : ""
                            }`}
                          >
                            {label}
                            {/* Mũi tên */}
                            <svg
                              className={`w-3 h-3 transition-transform duration-200 ${
                                isActive ? "rotate-180" : ""
                              }`}
                              xmlns="http://www.w3.org/2000/svg"
                              width="24"
                              height="24"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="m6 9 6 6 6-6" />
                            </svg>
                          </button>

                          {/* Menu thả xuống */}
                          <div
                            // Tối ưu chiều rộng dropdown trên tablet
                            className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-36 md:w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-30 ${
                              isActive ? "block" : "hidden"
                            }`}
                          >
                            {dropdownItems[
                              label as keyof typeof dropdownItems
                            ].map((item) => (
                              <a
                                key={item.label}
                                href={item.path}
                                onClick={() => setOpenDropdown(null)} // Đóng menu sau khi nhấp
                                className="block px-3 md:px-4 py-2 text-gray-800 text-xs hover:bg-orange-100 transition-colors duration-150"
                              >
                                {item.label}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    // Link thông thường
                    return (
                      <a
                        key={label}
                        href={path}
                        // SỬA LỖI LỆCH HÀNG: Thêm py-1 để căn chỉnh với button dropdown
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
                  // Tối ưu chiều rộng trên desktop
                  className="w-48 lg:w-64 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg py-2 px-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                {/* search icon */}
                <img
                  src={searchIcon}
                  alt="search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                />
              </form>

              {/*Cart*/}
              <button
                aria-label="cart"
                className="p-1 rounded hover:bg-gray-100"
              >
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
              </button>

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
                          <a
                            href="/quan-ly"
                            className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                            role="menuitem"
                          >
                            Trang quản lý
                          </a>
                        )}
                        {user.role?.toLowerCase() === "admin" && (
                          <a
                            href="/quan-ly/sale"
                            className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
                            role="menuitem"
                          >
                            Quản lý Sale
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
                    // Màu cam đậm hơn để nổi bật hơn
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
