import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";

// 🚨 BASE URL SERVER
const SERVER_BASE_URL = "http://localhost:5001";

// --- Type User ---
type User = {
  username: string;
  email: string;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: "admin" | "user";
};

// --- Validation schemas ---
const phoneSchema = z
  .string()
  .optional()
  .refine((val) => {
    if (!val) return true;
    return /^0\d{9}$/.test(val);
  }, {
    message: "Số điện thoại không hợp lệ (bắt đầu bằng 0 và có 10 chữ số)",
  });

const changePassSchema = z.object({
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  confirmPassword: z.string().min(6, "Vui lòng nhập lại mật khẩu")
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu nhập lại không khớp",
  path: ["confirmPassword"],
});

// --- Mask email ---
const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(0, local.length - 2))}@${domain}`;
};

const UserPage: React.FC = () => {
  // === State user info ===
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "orders" | "password">("info");

  // === Password management ===
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState(0);
  const [confirmStrength, setConfirmStrength] = useState(0);
  const [oldPasswordError, setOldPasswordError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // === Load user info ===
  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/users/me`, {
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

  // === Helper ===
  const initials = (name?: string) =>
    (name || "U").split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase();

  // === Password strength ===
  const calculateStrength = (password: string) => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 10) score++;
    return score;
  };
  const getStrengthLabel = (score: number) => {
    switch (score) {
      case 0:
      case 1: return { label: "Yếu", color: "bg-red-500" };
      case 2: return { label: "Trung bình", color: "bg-yellow-500" };
      case 3: return { label: "Khá mạnh", color: "bg-orange-500" };
      case 4: return { label: "Mạnh", color: "bg-green-500" };
      case 5: return { label: "Rất mạnh", color: "bg-blue-500" };
      default: return { label: "", color: "" };
    }
  };
  useEffect(() => { setStrength(calculateStrength(newPassword)); }, [newPassword]);
  useEffect(() => { setConfirmStrength(calculateStrength(confirmPassword)); }, [confirmPassword]);

  // === Save user info ===
  const onSave = async () => {
    if (!user) return;

    const result = phoneSchema.safeParse(phone.trim());
    if (!result.success) {
      setPhoneError(result.error.issues[0].message);
      return;
    } else {
      setPhoneError("");
    }

    const token = localStorage.getItem("accessToken");
    if (!token) {
      toast.error("Không tìm thấy token xác thực.");
      return;
    }

    const formData = new FormData();
    formData.append("displayName", displayName.trim());
    formData.append("phone", phone.trim());
    if (newAvatarFile) formData.append("avatar", newAvatarFile);
    else if (!newAvatarFile && user.avatarUrl === null && user.avatarUrl !== undefined) {
      formData.append("avatarUrl", "null");
    }

    try {
      setLoading(true);
      toast.loading("Đang lưu thông tin...");
      const res = await fetch(`${SERVER_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(data.message || "Cập nhật thất bại.");
      const updatedUser: User = data.user;
      setUser(updatedUser);
      setDisplayName(updatedUser.displayName || "");
      setPhone(updatedUser.phone || "");
      setNewAvatarFile(null);
      setAvatarPreview(null);
      if (fileRef.current) fileRef.current.value = "";
      setEditMode(false);
      toast.success(data.message || "Cập nhật thông tin thành công!");
    } catch (e: any) {
      toast.dismiss();
      console.error(e);
      toast.error(e.message || "Đã xảy ra lỗi khi lưu thông tin.");
    } finally { setLoading(false); }
  };

  if (loading) return <div className="max-w-3xl mx-auto p-6">Đang tải thông tin tài khoản…</div>;

  if (!user) return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white border-gray-1500 rounded-lg p-6 shadow-sm text-center">
        <h1 className="text-xl font-semibold mb-2">Bạn chưa đăng nhập</h1>
        <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem và chỉnh sửa thông tin tài khoản.</p>
        <div className="flex items-center justify-center gap-3">
          <a href="/signin"><Button className="border hover:border-orange-500 hover:bg-white hover:text-orange-500">Đăng nhập</Button></a>
          <a href="/signup"><Button className="border hover:border-orange-500 hover:bg-white hover:text-orange-500">Đăng ký</Button></a>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <Navbar />
      <div className="min-h-svh bg-gradient-pattern pt-8 md:pt-10 pb-16 md:pb-24 px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-7xl bg-white rounded-lg border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-[260px_1fr] shadow-sm mb-6">
          
          {/* Sidebar */}
          <aside className="bg-white md:border-r border-gray-200 border-b md:border-b-0 md:sticky md:top-24">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-base">Tài khoản</div>
            <nav className="divide-y divide-gray-200">
              <button className={`w-full text-left px-4 py-4 sm:py-3 ${activeTab === "info" ? "bg-orange-50 text-orange-600 font-medium" : "hover:bg-gray-50"}`} onClick={() => setActiveTab("info")}>Thông tin user</button>
              <button className={`w-full text-left px-4 py-4 sm:py-3 ${activeTab === "orders" ? "bg-orange-50 text-orange-600 font-medium" : "hover:bg-gray-50"}`} onClick={() => setActiveTab("orders")}>Đơn hàng</button>
              <button className={`w-full text-left px-4 py-4 sm:py-3 ${activeTab === "password" ? "bg-orange-50 text-orange-600 font-medium" : "hover:bg-gray-50"}`} onClick={() => setActiveTab("password")}>Quản lý mật khẩu</button>
            </nav>
          </aside>

          {/* Content */}
          <section className="bg-white p-4 sm:p-6 md:p-8">
            {activeTab === "info" && (
              <>
                {/* Avatar */}
                <div className="flex justify-center mb-4 sm:mb-6">
                  <div className="flex flex-col items-center gap-3">
                    {avatarPreview || user.avatarUrl ? (
                      <img
                        src={avatarPreview || (user.avatarUrl ? `${SERVER_BASE_URL}${user.avatarUrl}` : "")}
                        alt="avatar"
                        className="w-20 h-20 md:w-16 md:h-16 rounded-full object-cover border"
                        onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = `https://placehold.co/64x64/CCCCCC/333333?text=${initials(user.displayName)}`; }}
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-16 md:h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">{initials(user.displayName)}</div>
                    )}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAvatarPreview(URL.createObjectURL(f)); setNewAvatarFile(f); }}} />
                      <Button size="sm" className="w-full sm:w-auto" onClick={() => fileRef.current?.click()} disabled={!editMode}>Chọn ảnh</Button>
                      {(avatarPreview || user.avatarUrl) && editMode && (
                        <Button size="sm" className="w-full sm:w-auto" variant="ghost" onClick={() => { setAvatarPreview(null); setNewAvatarFile(null); if (fileRef.current) fileRef.current.value = ""; if(user.avatarUrl) setUser(prev => prev ? { ...prev, avatarUrl: null } : prev); }}>Bỏ ảnh</Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm mb-1">Tên hiển thị</label>
                    <Input className="border-gray-300" value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={!editMode} />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Số điện thoại</label>
                    <Input className="border-gray-300" value={phone} onChange={(e) => { setPhone(e.target.value); setPhoneError(""); }} disabled={!editMode} />
                    {phoneError && <p className="text-xs text-red-500 mt-1">{phoneError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Email</label>
                    <Input className="border-gray-300" value={maskEmail(user.email)} disabled readOnly />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">Tên đăng nhập</label>
                    <Input className="border-gray-300" value={user.username} disabled readOnly />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {!editMode ? (
                    <Button onClick={() => setEditMode(true)}>Chỉnh sửa</Button>
                  ) : (
                    <>
                      <Button onClick={onSave} disabled={loading}>Lưu</Button>
                      <Button className="border border-red-700 bg-white text-red-700 hover:bg-red-700 hover:text-white" onClick={() => { setEditMode(false); setDisplayName(user.displayName || ""); setPhone(user.phone || ""); setAvatarPreview(null); setNewAvatarFile(null); }}>Hủy</Button>
                    </>
                  )}
                </div>
                {editMode && <p className="text-xs text-gray-500 mt-3">Lưu ý: Tất cả các thay đổi (kể cả ảnh) sẽ được lưu trong một yêu cầu.</p>}
              </>
            )}

            {activeTab === "orders" && <div className="text-center text-gray-600 py-10">Danh sách đơn hàng sẽ hiển thị ở đây</div>}

            {activeTab === "password" && (
              <div className="max-w-md mx-auto p-6">
                <h2 className="text-xl font-bold text-center mb-6">ĐỔI MẬT KHẨU</h2>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const result = changePassSchema.safeParse({ password: newPassword, confirmPassword });
                  if (!result.success) { setPasswordError(result.error.issues[0].message); return; }
                  if (!oldPassword) { setOldPasswordError("Vui lòng nhập mật khẩu cũ"); return; }
                  toast.success("Đã simulate đổi mật khẩu (chỉ frontend)");
                  setOldPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(""); setOldPasswordError("");
                }} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1 relative">
                    <Input type={showOld ? "text" : "password"} placeholder="Mật khẩu cũ" value={oldPassword} onChange={(e) => { setOldPassword(e.target.value); setOldPasswordError(""); }} />
                    <button type="button" onClick={() => setShowOld(s => !s)} className="absolute right-3 top-3">{showOld ? <EyeOff /> : <Eye />}</button>
                    {oldPasswordError && <p className="text-red-500 text-xs">{oldPasswordError}</p>}
                  </div>

                  <div className="flex flex-col gap-1 relative">
                    <Input type={showPassword ? "text" : "password"} placeholder="Mật khẩu mới" value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setPasswordError(""); }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute right-3 top-3">{showPassword ? <EyeOff /> : <Eye />}</button>
                    <div className="h-2 rounded mt-1 bg-gray-200">
                      <div className={`h-2 rounded ${getStrengthLabel(strength).color}`} style={{ width: `${(strength/5)*100}%` }} />
                    </div>
                    {passwordError && <p className="text-red-500 text-xs">{passwordError}</p>}
                  </div>

                  <div className="flex flex-col gap-1 relative">
                    <Input type={showConfirm ? "text" : "password"} placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }} />
                    <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-3">{showConfirm ? <EyeOff /> : <Eye />}</button>
                  </div>

                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white w-full">Đổi mật khẩu</Button>
                </form>
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default UserPage;
