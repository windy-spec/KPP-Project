interface User {
  _id: string;
  displayName?: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

// Props của UserMenu
interface UserMenuProps {
  user: User | null; // Cần import hoặc định nghĩa lại User interface
  isLoading: boolean;
  handleLogout: () => Promise<void>;
  showUserMenu: boolean;
  toggleUserMenu: () => void;
  buttonRef: React.RefObject<HTMLButtonElement>; // Cần truyền Ref
  menuRef: React.RefObject<HTMLDivElement>; // Cần truyền Ref
}

const UserMenu: React.FC<UserMenuProps> = ({
  user,
  isLoading,
  handleLogout,
  showUserMenu,
  toggleUserMenu,
  buttonRef,
  menuRef,
}) => {
  if (isLoading) {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!user) {
    // Hiển thị nút Đăng nhập khi chưa đăng nhập
    return (
      <a
        href="/signin"
        className="px-4 py-2 text-sm font-medium text-white bg-orange-200 rounded-lg shadow-lg hover:bg-orange-300 transition-colors duration-200"
      >
        Đăng nhập
      </a>
    );
  }

  // Đã đăng nhập: Hiển thị Avatar và Menu
  return (
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
            user.avatarUrl || "https://placehold.co/40x40/f7931e/ffffff?text=U"
          }
          alt="Avatar"
          className="w-8 h-8 rounded-full object-cover"
        />
      </button>

      {/* Dropdown Menu */}
      {showUserMenu && (
        <div
          // ⚠️ LƯU Ý: Ở DESKTOP NAVBAR CỐ ĐỊNH, KHỐI NÀY CẦN ref={menuRef}
          // TUY NHIÊN VÌ BẠN ĐANG DÙNG CẢ HAI NƠI, KHỐI MENU CÓ THỂ KHÔNG CẦN ref ở đây
          // mà chỉ cần ref ở Navbartop nếu bạn chỉ dùng một khối user/menu.
          ref={menuRef as React.RefObject<HTMLDivElement>}
          className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50 origin-top-right animate-fade-in" // Tăng z-index (z-50) để nó luôn ở trên navbar cuộn.
          role="menu"
          aria-orientation="vertical"
        >
          {/* ... (Các mục menu như code gốc) ... */}
          <a
            href="/account"
            className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
            role="menuitem"
          >
            Tài khoản ({user.displayName || user.email || "Người dùng"})
          </a>
          <a
            href="/order-history"
            className="block px-4 py-3 text-gray-700 hover:bg-orange-100 transition-colors"
            role="menuitem"
          >
            Đơn hàng
          </a>
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
  );
};

export default UserMenu;
