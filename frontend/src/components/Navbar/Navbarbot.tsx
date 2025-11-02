import React, { useState } from "react";
import { NavLink } from "react-router-dom";


const dropdownItems = {
  "Sản Phẩm": [
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

  const items = rawItems.map((label) => ({ label, to: toPath(label) }));

  // Hàm xử lý việc mở/đóng dropdown
  const handleDropdownToggle = (label: string) => {
    setOpenDropdown(openDropdown === label ? null : label);
  };

  const isDropdown = (label: string) => dropdownItems.hasOwnProperty(label);

  return (
    <div className="hidden md:block bg-orange-200">
        <div className="max-w-7xl mx-auto px-4 h-13">
          <div className="py-3">
            <nav className="flex flex-wrap gap-16 text-lg text-gray-800 justify-center">
              {items.map(({ label, to }) => {
                const hasDropdown = isDropdown(label);
                const isActive = hasDropdown ? openDropdown === label : false;

                if (hasDropdown) {
                  return (
                    // Hiển thị dropdown khi hover và bỏ mũi tên
                    <div
                      key={label}
                      className="relative"
                      onMouseEnter={() => setOpenDropdown(label)}
                      onMouseLeave={() => setOpenDropdown(null)}
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
                        className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 ${openDropdown === label ? "block" : "hidden"}`}
                      >
                        {dropdownItems[label as keyof typeof dropdownItems].map((item) => (
                          <NavLink
                            key={item.label}
                            to={item.to}
                            onClick={() => setOpenDropdown(null)}
                            className="block px-4 py-2 text-gray-800 text-base hover:bg-orange-100 transition-colors duration-150"
                          >
                            {item.label}
                          </NavLink>
                        ))}
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