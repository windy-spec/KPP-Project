import React from "react";
import searchIcon from '@/assets/icon/search_icon.png';
import cartIcon from '@/assets/icon/shopping-bag.png';
import userIcon from '@/assets/icon/user.png';

const Navbartop: React.FC = () => {
  return (
    <header className="bg-gray-50">
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
            {/* <button aria-label="user" className="p-1 rounded hover:bg-gray-100">
              <img src={userIcon} alt="user" className="w-5 h-5" />
            </button> */}
            <a 
              href="/signin" // Link đến trang Đăng nhập
              className="px-3 py-1 text-sm font-medium text-white bg-orange-200 rounded-lg shadow-md hover:bg-orange-300 transition-colors duration-200"
            >
              Đăng nhập
            </a>
          </div>
        </div>
      </div>

      {/* Line */}
      <div className="w-full">
        <div className="max-w-9xl mx-auto px-4">
          <div className="h-[0.5px] bg-gray-200/70 w-full" />
        </div>
      </div>
    </header>
  );
};

export default Navbartop;