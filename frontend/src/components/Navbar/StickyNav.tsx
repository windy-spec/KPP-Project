import React, { useEffect, useState } from "react";
import searchIcon from '@/assets/icon/search_icon.png';
import cartIcon from '@/assets/icon/shopping-bag.png';
import userIcon from '@/assets/icon/user.png';

const StickyNav: React.FC<{ threshold?: number }> = ({ threshold = 180 }) => {
  const [visible, setVisible] = useState(false);

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
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    // kiểm tra vị trí ban đầu
    setVisible(window.scrollY > threshold);

    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  const items = ["Trang Chủ", "Giới Thiệu", "Sản Phẩm", "Chiết Khấu", "Liên Hệ"];

  return (
    <div
      className={`fixed left-0 right-0 top-0 z-50 transform transition-transform duration-200 ease-in-out pointer-events-none ${
        visible ? "translate-y-0" : "-translate-y-full"
      }`}
      aria-hidden={!visible}
    >
      <div className="pointer-events-auto">
        <div className="max-w-9xl mx-auto px-4 bg-white">
          <div className="flex items-center justify-between h-16">
            {/* left: logo */}
            <div className="flex items-center gap-3">
              <a href="/" className="flex items-center">
                <img src="/logo22.svg" alt="logo" className="w-14 h-14" />KPPaint
              </a>
            </div>

            {/* center: rounded orange nav */}
            <div className="flex-1 flex justify-center px-4">
              <div className="bg-orange-200 rounded-sm px-8 py-2 shadow-md">
                <nav className="flex gap-6 items-center text-gray-800 text-sm">
                  {items.map((it, idx) => (
                    <a
                      key={it}
                      href="#"
                      className="hover:text-white  transition-colors duration-200"
                    >
                      {it}
                    </a>
                  ))}
                </nav>
              </div>
            </div>

            {/* right: search box */}
            <div className="flex items-center gap-3 text-gray-600">
            {/* Search form*/}
            <form
              onSubmit={(e) => e.preventDefault()}
              className="relative"
              aria-label="search-form"
            >
              <input type="search" placeholder="Tìm kiếm sản phẩm." 
              className="w-64 md:w-80 text-sm placeholder-gray-400 bg-white border border-gray-200 rounded-lg py-2 px-3 pr-10 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {/* search icon */}
              <img src={searchIcon} alt="search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              />
            </form>
            {/*Cart*/}
            <button aria-label="cart" className="p-1 rounded hover:bg-gray-100">
              <img src={cartIcon} alt="cart" className="w-5 h-5" />
            </button>
            {/* User */}
            <button aria-label="user" className="p-1 rounded hover:bg-gray-100">
              <img src={userIcon} alt="user" className="w-5 h-5" />
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StickyNav;
