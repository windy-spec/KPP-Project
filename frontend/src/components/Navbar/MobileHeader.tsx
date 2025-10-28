import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import cartIcon from '@/assets/icon/shopping-bag.png';
import searchIcon from '@/assets/icon/search_icon.png';

const MobileHeader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const headerHeight = 56; // px (h-14)
  const menuApprox = 260; // approximate height of the opened menu

  return (
    <>
      {/* Fixed header so it always stays visible */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo22.svg" alt="logo" className="w-10 h-10" />
              <span className="sr-only">KPPaint</span>
            </Link>

            <div className="flex items-center gap-2">
              <button aria-label="cart" className="p-2 rounded hover:bg-gray-100">
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
              </button>

              <button
                aria-label="menu"
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setOpen((s) => !s)}
              >
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Menu panel fixed under header when open */}
        {open && (
          <div className="fixed left-0 right-0 top-[56px] z-40 border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto px-4 py-3">
              <form className="mb-3" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <input
                    autoFocus
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Tìm kiếm sản phẩm..."
                  />
                  <img src={searchIcon} alt="search" className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </form>

              <nav className="space-y-2">
                <Link to="/" className="block py-2 text-gray-800">Trang Chủ</Link>
                <Link to="/gioi-thieu" className="block py-2 text-gray-800">Giới Thiệu</Link>

                <details className="bg-white">
                  <summary className="py-2 cursor-pointer">Sản Phẩm</summary>
                  <div className="pl-4">
                    <Link to="/san-pham/dung-cu" className="block py-1 text-gray-700">Dụng cụ sơn</Link>
                    <Link to="/san-pham/son-nuoc" className="block py-1 text-gray-700">Sơn nước</Link>
                    <Link to="/san-pham/son-xit" className="block py-1 text-gray-700">Sơn xịt</Link>
                  </div>
                </details>

                <details className="bg-white">
                  <summary className="py-2 cursor-pointer">Chiết Khấu</summary>
                  <div className="pl-4">
                    <Link to="/chiet-khau/uu-dai-hom-nay" className="block py-1 text-gray-700">Ưu đãi hôm nay</Link>
                    <Link to="/chiet-khau/ma-giam-gia" className="block py-1 text-gray-700">Mã giảm giá</Link>
                  </div>
                </details>

                <Link to="/lien-he" className="block py-2 text-gray-800">Liên Hệ</Link>
                <Link to="/signin" className="block py-2 text-gray-800">Đăng nhập</Link>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Spacer to prevent content being hidden under fixed header/menu */}
      <div style={{ height: `${headerHeight + (open ? menuApprox : 0)}px` }} aria-hidden />
    </>
  );
};

export default MobileHeader;
