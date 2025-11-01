import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

type User = {
  username: string;
  email: string;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: "admin" | "user";
};

const UserPage: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }
      try {
        const res = await fetch("http://localhost:5001/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Không lấy được thông tin người dùng");
        const data = await res.json();
        const u: User = data.user || data;
        setUser(u);
        setDisplayName(u.displayName || "");
        setPhone(u.phone || "");
      } catch (e: any) {
        console.error(e);
        toast.error("Không thể tải thông tin tài khoản");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const initials = (name?: string) =>
    (name || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  const onSave = () => {
    setUser((prev) => (prev ? { ...prev, displayName, phone } : prev));
    setEditMode(false);
    toast.success("Đã cập nhật trên giao diện (API sẽ được bổ sung sau)");
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto p-6">Đang tải thông tin tài khoản…</div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white border-gray-1500 rounded-lg p-6 shadow-sm text-center">
          <h1 className="text-xl font-semibold mb-2">Bạn chưa đăng nhập</h1>
          <p className="text-gray-600 mb-4">
            Vui lòng đăng nhập để xem và chỉnh sửa thông tin tài khoản.
          </p>
          <div className="flex items-center justify-center gap-3">
            <a href="/signin">
              <Button className="border hover:border-orange-500 hover:bg-white hover:text-orange-500">Đăng nhập</Button>
            </a>
            <a href="/signup">
              <Button className="border hover:border-orange-500 hover:bg-white hover:text-orange-500">Đăng ký</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      {/* Layout: Sidebar (left) + Content (right) */}
      <div className="min-h-svh bg-gradient-pattern pt-8 md:pt-10 pb-16 md:pb-24 px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-7xl bg-white rounded-lg border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-[260px_1fr] shadow-sm mb-6">
          {/* Sidebar */}
          <aside className="bg-white md:border-r border-gray-200 border-b md:border-b-0 md:sticky md:top-24">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-base">Tài khoản</div>
            <nav className="divide-y divide-gray-200">
              <button className="w-full text-left px-4 py-4 sm:py-3 bg-orange-50 text-orange-600 font-medium">
                Thông tin user
              </button>
              <button className="w-full text-left px-4 py-4 sm:py-3 hover:bg-gray-50">Đơn hàng</button>
            </nav>
          </aside>

          {/* Content */}
          <section className="bg-white p-4 sm:p-6 md:p-8">
          {/* Avatar + action buttons (stacked to avoid being too tight) */}
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="flex flex-col items-center gap-3">
              {avatarPreview || user.avatarUrl ? (
                <img
                  src={avatarPreview || user.avatarUrl!}
                  alt="avatar"
                  className="w-20 h-20 md:w-16 md:h-16 rounded-full object-cover border"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = `https://placehold.co/64x64/CCCCCC/333333?text=${initials(
                      user.displayName
                    )}`;
                  }}
                />
              ) : (
                <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                  {initials(user.displayName)}
                </div>
              )}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setAvatarPreview(URL.createObjectURL(f));
                  }}
                />
                <Button size="sm" className="w-full sm:w-auto" onClick={() => fileRef.current?.click()} disabled={!editMode}>
                  Chọn ảnh
                </Button>
                {avatarPreview && (
                  <Button
                    size="sm"
                    className="w-full sm:w-auto"
                    variant="ghost"
                    onClick={() => {
                      setAvatarPreview(null);
                      if (fileRef.current) fileRef.current.value = "";
                    }}
                  >
                    Bỏ ảnh
                  </Button>
                )}
              </div>
            </div>
          </div>

            {/* Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div>
                <label className="block text-sm mb-1">Tên hiển thị</label>
                <Input
                className="border-gray-300"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!editMode}
                />
            </div>
            <div>
                <label className="block text-sm mb-1">Số điện thoại</label>
                <Input
                className="border-gray-300"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!editMode}
                />
            </div>
            <div>
                <label className="block text-sm mb-1">Email</label>
                <Input className="border-gray-300" value={user.email} disabled readOnly />
            </div>
            <div>
                <label className="block text-sm mb-1">Tên đăng nhập</label>
                <Input className="border-gray-300" value={user.username} disabled readOnly />
            </div>
            <div>
                <label className="block text-sm mb-1">Vai trò</label>
                <Input className="border-gray-300" value={user.role || "user"} disabled readOnly />
            </div>
            </div>

            <div className="mt-6 flex gap-3">
            {!editMode ? (
                <Button onClick={() => setEditMode(true)}>Chỉnh sửa</Button>
            ) : (
                <>
                <Button onClick={onSave}>Lưu</Button>
                <Button className="border border-red-700 bg-white text-red-700 hover:bg-red-700 hover:text-white" onClick={() => {
                    setEditMode(false);
                    setDisplayName(user.displayName || "");
                    setPhone(user.phone || "");
                    setAvatarPreview(null);
                }}>Hủy</Button>
                </>
            )}
            </div>

            {editMode && (
            <p className="text-xs text-gray-500 mt-3">
                Lưu ý: tính năng cập nhật hồ sơ sẽ được kết nối API sau. Hiện tại lưu sẽ chỉ cập nhật trên giao diện.
            </p>
            )}
          </section>
        </div>
      </div>
      <Footer/>
    </div>
  );
};

export default UserPage;