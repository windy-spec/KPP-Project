import React from "react";

const Navbarbot: React.FC = () => {
  const items = [
    "Trang Chủ",
    "Giới Thiệu",
    "Sản Phẩm",
    "Chiết Khấu",
    "Liên Hệ"
  ];

  return (
    <div className="bg-orange-200 ">
      <div className="max-w-7xl mx-auto px-4 h-13 ">
        <div className="py-3">
          <nav className="flex flex-wrap gap-6 text-lg text-gray-800 justify-center ">
            {items.map((it) => (
              <a key={it} href="#" className="hover:text-white  transition-colors duration-200">
                {it}
              </a>
            ))}
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