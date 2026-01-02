import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import cartIcon from "@/assets/icon/shopping-bag.png";
import searchIcon from "@/assets/icon/search_icon.png";
import apiClient from "../../utils/api-user";

const MobileHeader: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<{
    displayName?: string;
    email?: string;
    role?: string;
  } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [categories, setCategories] = useState<Array<any>>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState<number>(0);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Số lượng trong giỏ hàng (của cartUpdated)
  useEffect(() => {
    const readCart = () => {
      try {
        const raw = localStorage.getItem("cart");
        if (!raw) return setCartCount(0);
        const arr = JSON.parse(raw);
        // Đếm các sản phẩm riêng biệt (productId) để icon cart hiển thị số lượng loại sản phẩm, thay vì tổng số lượng tất cả món hàng
        const total = Array.isArray(arr)
          ? new Set(
              arr.map((it: any) => it.productId ?? it.id ?? JSON.stringify(it))
            ).size
          : 0;
        setCartCount(total);
      } catch (e) {
        setCartCount(0);
      }
    };

    readCart();
    const onUpdate = () => readCart();
    window.addEventListener("cartUpdated", onUpdate);
    return () => window.removeEventListener("cartUpdated", onUpdate);
  }, []);

  // Tải thông tin người dùng từ API nếu tồn tại mã truy cập (accessToken)
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setUser(null);
        setLoadingUser(false);
        return;
      }

      try {
        const resp = await fetch("http://localhost:5001/api/users/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (resp.ok) {
          const data = await resp.json();
          setUser(data.user || data);
        } else {
          // Token không hợp lệ
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          setUser(null);
        }
      } catch (err) {
        console.error("Failed to load user info", err);
        setUser(null);
      } finally {
        setLoadingUser(false);
      }
    };

    loadUser();
  }, []);

  // Lấy danh sách danh mục
  useEffect(() => {
    let mounted = true;
    const fetchCategories = async () => {
      setCatLoading(true);
      setCatError(null);
      try {
        const res = await apiClient.get("/category");
        if (!mounted) return;
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
    } catch (err) {
      console.error("Logout error", err);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setUser(null);
      setOpen(false);
      // xóa local cart and gửi tín hiệu đến navbar để reset lại
      try {
        localStorage.removeItem("cart");
      } catch (e) {}
      window.dispatchEvent(new Event("cartUpdated"));
      // hướng đến trang đăng nhập
      window.location.href = "/signin";
    }
  };

  const headerHeight = 56; // px (h-14)
  const menuApprox = 260; // Chiều cao ước tính của menu khi đang mở

  return (
    <>
      {/* Cố định đầu trang để luôn luôn hiển thị */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 ${
          isScrolled ? "shadow-sm" : ""
        }`}
      >
        <div className="w-4/5 max-w-7xl mx-auto px-4">
          <div className="h-14 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo22.svg" alt="logo" className="w-10 h-10" />
              <span className="sr-only">KPPaint</span>
            </Link>

            <div className="flex items-center gap-2">
              <Link
                to="/gio-hang"
                aria-label="cart"
                className="relative p-2 rounded hover:bg-gray-100"
              >
                <img src={cartIcon} alt="cart" className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white bg-red-600 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                aria-label="menu"
                className="p-2 rounded hover:bg-gray-100"
                onClick={() => setOpen((s) => !s)}
              >
                {open ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Bảng menu cố định ngay dưới đầu trang khi mở */}
        {open && (
          <div className="fixed left-0 right-0 top-[56px] z-40 border-t border-gray-100 bg-white">
            <div className="w-4/5 max-w-7xl mx-auto px-4 py-3">
              <form className="mb-3" onSubmit={(e) => e.preventDefault()}>
                <div className="relative">
                  <input
                    autoFocus
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Tìm kiếm sản phẩm..."
                  />
                  <img
                    src={searchIcon}
                    alt="search"
                    className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                  />
                </div>
              </form>

              <nav className="space-y-2">
                <Link to="/" className="block py-2 text-gray-800">
                  Trang Chủ
                </Link>
                <Link to="/gioi-thieu" className="block py-2 text-gray-800">
                  Giới Thiệu
                </Link>

                <details className="bg-white">
                  <summary className="py-2 cursor-pointer">Sản Phẩm</summary>
                  <div className="pl-4">
                    {catLoading ? (
                      <div className="py-1 text-sm text-gray-500">
                        Đang tải...
                      </div>
                    ) : catError ? (
                      <div className="py-1 text-sm text-red-500">
                        {catError}
                      </div>
                    ) : categories.length ? (
                      categories.map((cat) => (
                        <Link
                          key={cat._id || cat.id || cat.name}
                          to={`/san-pham?categories=${encodeURIComponent(
                            cat._id || cat.id || cat.name
                          )}`}
                          onClick={() => setOpen(false)}
                          className="block py-1 text-gray-700"
                        >
                          {cat.name}
                        </Link>
                      ))
                    ) : (
                      <>
                        <Link
                          to="/san-pham/dung-cu"
                          className="block py-1 text-gray-700"
                        >
                          Dụng cụ sơn
                        </Link>
                        <Link
                          to="/san-pham/son-nuoc"
                          className="block py-1 text-gray-700"
                        >
                          Sơn nước
                        </Link>
                        <Link
                          to="/san-pham/son-xit"
                          className="block py-1 text-gray-700"
                        >
                          Sơn xịt
                        </Link>
                      </>
                    )}
                  </div>
                </details>

                <details className="bg-white">
                  <summary className="py-2 cursor-pointer">Chiết Khấu</summary>
                  <div className="pl-4">
                    <Link
                      to="/chiet-khau/uu-dai-hom-nay"
                      className="block py-1 text-gray-700"
                    >
                      Ưu đãi hôm nay
                    </Link>
                    <Link
                      to="/chiet-khau/ma-giam-gia"
                      className="block py-1 text-gray-700"
                    >
                      Mã giảm giá
                    </Link>
                  </div>
                </details>

                <Link to="/lien-he" className="block py-2 text-gray-800">
                  Liên Hệ
                </Link>
                {loadingUser ? null : user ? (
                  <>
                    <Link
                      to="/tai-khoan"
                      onClick={() => setOpen(false)}
                      className="block py-2 text-gray-800"
                    >
                      Tài khoản (
                      {user.displayName || user.email || "Người dùng"})
                    </Link>
                    {/* Admin link */}
                    {user.role === "admin" && (
                      <Link
                        to="/quan-ly"
                        onClick={() => setOpen(false)}
                        className="block py-2 text-gray-800"
                      >
                        Trang quản lý
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block py-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <Link
                    to="/signin"
                    className="block py-2 text-gray-800"
                    onClick={() => setOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                )}
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* Phần đệm để tránh nội dung bị che mất bên dưới header cố định */}
      <div
        style={{ height: `${headerHeight + (open ? menuApprox : 0)}px` }}
        aria-hidden
      />
    </>
  );
};

export default MobileHeader;
