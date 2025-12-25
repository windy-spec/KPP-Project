import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import apiClient from "../../utils/api-user";

const dropdownItems = {
  "Sản Phẩm": [
    // Kept as fallback/static, actual categories will be fetched from backend
    { label: "Dụng cụ sơn", to: "/san-pham/dung-cu" },
    { label: "Sơn nước", to: "/san-pham/son-nuoc" },
    { label: "Sơn xịt", to: "/san-pham/son-xit" },
  ],
  "Chiết Khấu": [
    { label: "Ưu đãi hôm nay", to: "/chiet-khau/uu-dai-hom-nay" },
    { label: "Mã giảm giá", to: "/chiet-khau/ma-giam-gia" },
  ],
};

const rawItems = [
  "Trang Chủ",
  "Giới Thiệu",
  "Sản Phẩm",
  "Chiết Khấu", 
  "Liên Hệ",
];

// Helper giữ nguyên
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

const Navbarbot: React.FC = () => {
  // State để theo dõi mục dropdown nào đang mở
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  // Categories fetched from backend
  const [categories, setCategories] = useState<Array<any>>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const closeTimer = React.useRef<number | null>(null);

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => clearCloseTimer();
  }, []);

  // Fetch categories from backend on mount
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const res = await apiClient.get("/category");
        if (!mounted) return;
        // Expecting an array of categories with at least 'name' and '_id'
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

  const items = rawItems.map((label) => ({ label, to: toPath(label) }));

  const isDropdown = (label: string) => dropdownItems.hasOwnProperty(label);

  return (
    <div className="hidden md:block bg-orange-200 shadow-lg">
    <div className="w-4/5 max-w-7xl mx-auto px-4 h-13">
          <div className="py-3">
            <nav className="flex flex-wrap gap-16 text-lg text-gray-800 justify-center">
              {items.map(({ label, to }) => {
                const hasDropdown = isDropdown(label);

                if (hasDropdown) {
                  return (
                    // Hiển thị dropdown khi hover và bỏ mũi tên
                    <div
                      key={label}
                      className="relative"
                      onMouseEnter={() => {
                        clearCloseTimer();
                        setOpenDropdown(label);
                      }}
                      onMouseLeave={() => {
                        clearCloseTimer();
                        closeTimer.current = window.setTimeout(() => setOpenDropdown(null), 260);
                      }}
                    >
                      {/* Label điều hướng trực tiếp */}
                      <NavLink
                        to={to}
                        end={to === "/"}
                        onClick={() => setOpenDropdown(null)}
                        className={({ isActive }) =>
                          `transition-colors duration-200 pb-1 ${
                            isActive
                              ? "text-white border-b-2 border-orange-600"
                              : "hover:text-white text-gray-800"
                          }`
                        }
                      >
                        {label}
                      </NavLink>

                      {/* Menu thả xuống */}
                      <div
                        className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 origin-top transition-all duration-200 ease-out ${
                          openDropdown === label
                            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                            : "opacity-0 -translate-y-1 scale-95 pointer-events-none"
                        }`}
                        onMouseEnter={() => {
                          clearCloseTimer();
                          setOpenDropdown(label);
                        }}
                        onMouseLeave={() => {
                          clearCloseTimer();
                          closeTimer.current = window.setTimeout(() => setOpenDropdown(null), 260);
                        }}
                      >
                        {/* If this is the product dropdown, render categories from backend */}
                        {label === "Sản Phẩm" ? (
                          catLoading ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Đang tải...</div>
                          ) : catError ? (
                            <div className="px-4 py-2 text-sm text-red-500">{catError}</div>
                          ) : categories.length ? (
                            categories.map((cat: any) => (
                                <NavLink
                                  key={cat._id || cat.id || cat.name}
                                  to={`/san-pham?categories=${encodeURIComponent(
                                    cat._id || cat.id || cat.name
                                  )}`}
                                  onClick={() => setOpenDropdown(null)}
                                  className="block px-4 py-2 text-gray-800 text-base hover:bg-orange-100 transition-colors duration-150"
                                >
                                  {cat.name}
                                </NavLink>
                            ))
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">Không có danh mục</div>
                          )
                        ) : (
                          dropdownItems[label as keyof typeof dropdownItems].map((item) => (
                            <NavLink
                              key={item.label}
                              to={item.to}
                              onClick={() => setOpenDropdown(null)}
                              className="block px-4 py-2 text-gray-800 text-base hover:bg-orange-100 transition-colors duration-150"
                            >
                              {item.label}
                            </NavLink>
                          ))
                        )}
                      </div>
                    </div>
                  );
                }

                // Các mục NavLink thông thường
                return (
                  <NavLink
                    key={label}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `transition-colors duration-200 pb-1 ${
                        isActive
                          ? "text-white border-b-2 border-orange-600"
                          : "hover:text-white text-gray-800 "
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Line */}
        <div className="w-full">
          <div className="max-w-4xl mx-auto px-4">
            <div className="h-[0.5px] bg-gray-200/70 w-full" />
          </div>
        </div>
      </div>
  );
};

export default Navbarbot;