import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown } from 'lucide-react'; // Cài đặt lucide-react nếu bạn muốn dùng icon hiện đại. Nếu không, dùng SVG trực tiếp.

const dropdownItems = {
  "Sản Phẩm": [
    { label: "Điện thoại", to: "/san-pham/dien-thoai" },
    { label: "Máy tính bảng", to: "/san-pham/may-tinh-bang" },
    { label: "Phụ kiện", to: "/san-pham/phu-kien" },
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
    <div className="bg-orange-200">
      <div className="max-w-7xl mx-auto px-4 h-13">
        <div className="py-3">
          <nav className="flex flex-wrap gap-16 text-lg text-gray-800 justify-center">
            {items.map(({ label, to }) => {
              const hasDropdown = isDropdown(label);
              const isActive = hasDropdown ? openDropdown === label : false;

              if (hasDropdown) {
                return (
                  // Bọc bằng div với class relative để định vị dropdown
                  <div key={label} className="relative">
                    {/* Nút Dropdown */}
                    <button
                      onClick={() => handleDropdownToggle(label)}
                      className={`flex items-center transition-colors duration-200 pb-1 gap-1 text-gray-800 hover:text-white ${isActive ? "text-white border-b-2 border-orange-600" : ""}`}
                    >
                      {label}
                      {/* Mũi tên ChevronDown */}
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${isActive ? "rotate-180" : ""}`}
                        xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      >
                        <path d="m6 9 6 6 6-6"/>
                      </svg>
                    </button>

                    {/* Menu thả xuống */}
                    <div
                      className={`absolute left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-20 ${openDropdown === label ? "block" : "hidden"}`}
                    >
                      {dropdownItems[label as keyof typeof dropdownItems].map((item) => (
                        <NavLink
                          key={item.label}
                          to={item.to}
                          onClick={() => setOpenDropdown(null)} // Đóng menu khi nhấp vào link con
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