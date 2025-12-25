import React, { useEffect, useRef, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Loader2,
  Printer,
  Trash2,
  PackageOpen,
} from "lucide-react";
import Swal from "sweetalert2";

// 🚨 BASE URL SERVER
const SERVER_BASE_URL = "http://localhost:5001";

// --- HELPER FORMATS ---
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateSafe = (dateString: string | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "-"
    : `${date.getHours()}:${String(date.getMinutes()).padStart(
        2,
        "0"
      )} - ${date.toLocaleDateString("vi-VN")}`;
};

// --- TYPES ---
type User = {
  _id: string;
  username: string;
  email: string;
  displayName: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role?: "admin" | "user";
};

interface InvoiceItem {
  product_id: { _id?: string; name: string; price: number } | null;
  quantity: number;
  price?: number;
  discount?: number;
}

interface Invoice {
  _id: string;
  createdAt: string;
  recipient_info?: { name: string; phone: string; address: string };
  user?: { name?: string; email?: string };
  items: InvoiceItem[];
  totalPrice?: number;
  total_amount?: number;
  shipping_fee?: number;
  status?: string;
  payment_method?: string;
}

type FilterType = "all" | "today" | "week" | "month";

// --- Validation schemas ---
const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => {
      if (!val) return true;
      return /^0\d{9}$/.test(val);
    },
    { message: "Số điện thoại không hợp lệ" }
  );

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(0, local.length - 2))}@${domain}`;
};

const UserPage: React.FC = () => {
  // === 1. USER STATE ===
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  // === 2. TAB STATE ===
  const [activeTab, setActiveTab] = useState<"info" | "orders" | "password">(
    "info"
  );

  // === 3. PASSWORD STATE ===
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [strength, setStrength] = useState(0);
  const [confirmStrength, setConfirmStrength] = useState(0);

  // === 4. ORDER HISTORY STATE (Mới thêm) ===
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 6;

  // === INIT DATA ===
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

  // === LOGIC ORDERS (Mới thêm) ===
  // Chỉ fetch orders khi tab là "orders" và user đã load xong
  useEffect(() => {
    if (activeTab === "orders" && user) {
      const fetchInvoices = async () => {
        setOrdersLoading(true);
        const token = localStorage.getItem("accessToken");
        try {
          // Logic phân quyền: Admin xem tất cả (/invoice), User xem của mình (/invoice/me)
          const endpoint =
            user.role === "admin" ? "/api/invoice" : "/api/invoice/me";

          const res = await fetch(
            `${SERVER_BASE_URL}${endpoint}?page=${currentPage}&limit=${limit}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          const list = Array.isArray(data)
            ? data
            : data.invoices || data.docs || [];
          const total = data.totalPages || Math.ceil(list.length / limit) || 1;

          setInvoices(list);
          setTotalPages(total);
        } catch (err) {
          console.error(err);
        } finally {
          setOrdersLoading(false);
        }
      };
      fetchInvoices();
    }
  }, [activeTab, user, currentPage]);

  // Client-side filter cho orders
  const filteredInvoices = useMemo(() => {
    if (filterType === "all") return invoices;
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );

    return invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      if (filterType === "today") return invDate >= todayStart;
      if (filterType === "week") {
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);
        return invDate >= weekStart;
      }
      if (filterType === "month") {
        const monthStart = new Date(todayStart);
        monthStart.setMonth(monthStart.getMonth() - 1);
        return invDate >= monthStart;
      }
      return true;
    });
  }, [invoices, filterType]);

  const handleSelectInvoice = async (invoiceId: string) => {
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/invoice/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setSelectedInvoice(data);
    } catch (e) {
      toast.error("Lỗi tải chi tiết đơn hàng");
    }
  };

  const handleDeleteInvoice = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Xóa đơn hàng?",
      text: "Không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("accessToken");
      try {
        await fetch(`${SERVER_BASE_URL}/api/invoice/${invoiceId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices((prev) => prev.filter((inv) => inv._id !== invoiceId));
        if (selectedInvoice?._id === invoiceId) setSelectedInvoice(null);
        Swal.fire("Đã xóa!", "", "success");
      } catch {
        Swal.fire("Lỗi!", "Không xóa được", "error");
      }
    }
  };

  // === HELPER FUNCTIONS ===
  const initials = (name?: string) =>
    (name || "U")
      .split(" ")
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  const calculateStrength = (password: string) => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (password.length >= 10) score++;
    return score;
  };
  const getStrengthLabel = (score: number) => {
    const labels = ["", "Yếu", "Trung bình", "Khá mạnh", "Mạnh", "Rất mạnh"];
    const colors = [
      "bg-gray-200",
      "bg-red-500",
      "bg-yellow-500",
      "bg-orange-500",
      "bg-green-500",
      "bg-blue-500",
    ];
    const texts = [
      "text-gray-500",
      "text-red-500",
      "text-yellow-600",
      "text-orange-500",
      "text-green-500",
      "text-blue-500",
    ];
    return {
      label: labels[score],
      color: colors[score],
      textColor: texts[score],
    };
  };

  useEffect(() => {
    setStrength(calculateStrength(newPassword));
  }, [newPassword]);
  useEffect(() => {
    setConfirmStrength(calculateStrength(confirmPassword));
  }, [confirmPassword]);

  // === SAVE PROFILE ===
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
    const formData = new FormData();
    formData.append("displayName", displayName.trim());
    formData.append("phone", phone.trim());
    if (newAvatarFile) formData.append("avatar", newAvatarFile);
    else if (
      !newAvatarFile &&
      user.avatarUrl === null &&
      user.avatarUrl !== undefined
    ) {
      formData.append("avatarUrl", "null");
    }

    try {
      setLoading(true);
      toast.loading("Đang lưu...");
      const res = await fetch(`${SERVER_BASE_URL}/api/users/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      toast.dismiss();
      if (!res.ok) throw new Error(data.message);
      setUser(data.user);
      setEditMode(false);
      toast.success("Cập nhật thành công!");
    } catch (e: any) {
      toast.dismiss();
      toast.error(e.message || "Lỗi cập nhật.");
    } finally {
      setLoading(false);
    }
  };

  // === LOGOUT ===
  const performLogout = () => {
    localStorage.clear();
    window.location.href = "/signin";
  };

  if (loading)
    return <div className="p-6 text-center">Đang tải thông tin...</div>;
  if (!user) return <div className="p-6 text-center">Vui lòng đăng nhập.</div>;

  const strengthInfo = getStrengthLabel(strength);
  const confirmStrengthInfo = getStrengthLabel(confirmStrength);

  return (
    <div>
      <Navbar />

      {/* CSS cho In ấn */}
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #printable-area, #printable-area * { visibility: visible; } 
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; } 
          .modal-overlay { background: white; position: fixed; inset: 0; z-index: 9999; }
        }
      `}</style>

      <div className="min-h-svh bg-gradient-pattern pt-8 md:pt-10 pb-16 md:pb-24 px-3 sm:px-4 md:px-6">
        <div className="mx-auto max-w-7xl bg-white rounded-lg border border-gray-200 overflow-hidden grid grid-cols-1 md:grid-cols-[260px_1fr] shadow-sm mb-6">
          {/* SIDEBAR */}
          <aside className="bg-white md:border-r border-gray-200 border-b md:border-b-0 md:sticky md:top-24">
            <div className="px-4 py-3 border-b border-gray-200 font-semibold text-base">
              Tài khoản
            </div>
            <nav className="divide-y divide-gray-200">
              <button
                className={`w-full text-left px-4 py-4 sm:py-3 ${
                  activeTab === "info"
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("info")}
              >
                Thông tin user
              </button>
              <button
                className={`w-full text-left px-4 py-4 sm:py-3 ${
                  activeTab === "orders"
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("orders")}
              >
                Đơn hàng
              </button>
              <button
                className={`w-full text-left px-4 py-4 sm:py-3 ${
                  activeTab === "password"
                    ? "bg-orange-50 text-orange-600 font-medium"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setActiveTab("password")}
              >
                Quản lý mật khẩu
              </button>
            </nav>
          </aside>

          {/* CONTENT AREA */}
          <section className="bg-white p-4 sm:p-6 md:p-8">
            {/* --- TAB: INFO --- */}
            {activeTab === "info" && (
              <div className="animate-in fade-in duration-300">
                <div className="flex justify-center mb-6">
                  <div className="flex flex-col items-center gap-3">
                    {avatarPreview || user.avatarUrl ? (
                      <img
                        src={
                          avatarPreview ||
                          (user.avatarUrl
                            ? `${SERVER_BASE_URL}${user.avatarUrl}`
                            : "")
                        }
                        alt="avatar"
                        className="w-20 h-20 rounded-full object-cover border"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/64x64?text=${initials(
                            user.displayName
                          )}`;
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                        {initials(user.displayName)}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setAvatarPreview(URL.createObjectURL(f));
                            setNewAvatarFile(f);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => fileRef.current?.click()}
                        disabled={!editMode}
                      >
                        Chọn ảnh
                      </Button>
                      {(avatarPreview || user.avatarUrl) && editMode && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAvatarPreview(null);
                            setNewAvatarFile(null);
                            if (fileRef.current) fileRef.current.value = "";
                            if (user.avatarUrl)
                              setUser((prev) =>
                                prev ? { ...prev, avatarUrl: null } : prev
                              );
                          }}
                        >
                          Bỏ ảnh
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm mb-1 block">Tên hiển thị</label>
                    <Input
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={!editMode}
                    />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Số điện thoại</label>
                    <Input
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        setPhoneError("");
                      }}
                      disabled={!editMode}
                    />
                    {phoneError && (
                      <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                    )}
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Email</label>
                    <Input value={maskEmail(user.email)} disabled readOnly />
                  </div>
                  <div>
                    <label className="text-sm mb-1 block">Tên đăng nhập</label>
                    <Input value={user.username} disabled readOnly />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  {!editMode ? (
                    <Button onClick={() => setEditMode(true)}>Chỉnh sửa</Button>
                  ) : (
                    <>
                      <Button onClick={onSave} disabled={loading}>
                        Lưu
                      </Button>
                      <Button
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                        onClick={() => {
                          setEditMode(false);
                          setDisplayName(user.displayName || "");
                          setPhone(user.phone || "");
                          setAvatarPreview(null);
                          setNewAvatarFile(null);
                        }}
                      >
                        Hủy
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* --- TAB: ORDERS (Đã tích hợp Full Code) --- */}
            {activeTab === "orders" && (
              <div className="animate-in fade-in duration-300">
                {/* Header Filter */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {user.role === "admin"
                        ? "Quản lý Đơn hàng"
                        : "Lịch sử đơn hàng"}
                    </h2>
                    <p className="text-xs text-gray-500">
                      Danh sách các đơn hàng gần đây
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {(["all", "today", "week", "month"] as FilterType[]).map(
                      (type) => (
                        <Button
                          key={type}
                          variant={filterType === type ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType(type)}
                          className={`text-xs h-8 ${
                            filterType === type
                              ? "bg-orange-500 hover:bg-orange-600"
                              : ""
                          }`}
                        >
                          {type === "all"
                            ? "Tất cả"
                            : type === "today"
                            ? "Hôm nay"
                            : type === "week"
                            ? "Tuần này"
                            : "Tháng này"}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {/* Loading / Error / Empty / List */}
                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="animate-spin w-8 h-8 text-orange-500" />
                  </div>
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <PackageOpen className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500">
                      Không tìm thấy đơn hàng nào.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filteredInvoices.map((inv) => (
                      <div
                        key={inv._id}
                        onClick={() => handleSelectInvoice(inv._id)}
                        className="bg-white p-4 rounded-lg border border-gray-200 hover:border-orange-400 hover:shadow-md cursor-pointer transition-all relative overflow-hidden"
                      >
                        <div
                          className={`absolute top-0 left-0 w-1 h-full ${
                            inv.status === "COMPLETED" || inv.status === "PAID"
                              ? "bg-green-500"
                              : inv.status === "CANCELLED"
                              ? "bg-red-500"
                              : "bg-orange-500"
                          }`}
                        />

                        <div className="flex justify-between items-center mb-2 pl-3">
                          <span className="font-mono font-bold text-gray-700">
                            #{inv._id.slice(-6).toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                              inv.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : "bg-orange-100 text-orange-700"
                            }`}
                          >
                            {inv.status === "PAID" ? "Đã TT" : inv.status}
                          </span>
                        </div>

                        <div className="pl-3 text-sm text-gray-600 space-y-1">
                          <div className="font-medium truncate">
                            {inv.recipient_info?.name ||
                              inv.user?.name ||
                              "Khách lẻ"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {formatDateSafe(inv.createdAt)}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100 pl-3">
                          <span className="font-bold text-orange-600">
                            {formatVND(inv.totalPrice || inv.total_amount || 0)}
                          </span>
                          {(user.role === "admin" ||
                            (inv.status !== "COMPLETED" &&
                              inv.status !== "PAID")) && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={(e) => handleDeleteInvoice(e, inv._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {invoices.length > 0 && filterType === "all" && (
                  <div className="flex justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                    >
                      Trước
                    </Button>
                    <span className="text-sm flex items-center px-2 text-gray-600">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage >= totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                )}

                {/* --- MODAL CHI TIẾT (IN ĐƯỢC) --- */}
                {selectedInvoice && (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    <div
                      className="bg-white rounded-lg shadow-2xl w-full max-w-[400px] max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        id="printable-area"
                        className="p-5 font-mono text-sm bg-white"
                      >
                        {/* Bill Header */}
                        <div className="text-center mb-4 border-b border-dashed pb-4">
                          <h3 className="text-lg font-bold uppercase">
                            Hóa Đơn
                          </h3>
                          <p className="text-xs text-gray-500">
                            #{selectedInvoice._id.slice(-6).toUpperCase()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDateSafe(selectedInvoice.createdAt)}
                          </p>
                        </div>
                        {/* Customer Info */}
                        <div className="mb-4 text-xs space-y-1">
                          <div className="flex">
                            <span className="w-16 text-gray-500">Khách:</span>{" "}
                            <span className="font-bold">
                              {selectedInvoice.recipient_info?.name ||
                                selectedInvoice.user?.name}
                            </span>
                          </div>
                          <div className="flex">
                            <span className="w-16 text-gray-500">SĐT:</span>{" "}
                            <span>{selectedInvoice.recipient_info?.phone}</span>
                          </div>
                          <div className="flex">
                            <span className="w-16 text-gray-500">Đ/C:</span>{" "}
                            <span>
                              {selectedInvoice.recipient_info?.address}
                            </span>
                          </div>
                        </div>
                        {/* Items */}
                        <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4">
                          {selectedInvoice.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between mb-1"
                            >
                              <div className="truncate w-2/3">
                                <span className="font-bold mr-1">
                                  {item.quantity}x
                                </span>{" "}
                                {item.product_id?.name || "SP"}
                              </div>
                              <div className="font-medium">
                                {formatVND(
                                  (item.price || item.product_id?.price || 0) *
                                    item.quantity
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Total */}
                        <div className="flex justify-between items-end mb-6">
                          <span className="font-bold text-gray-800">
                            TỔNG CỘNG
                          </span>
                          <span className="text-xl font-bold text-orange-600">
                            {formatVND(
                              selectedInvoice.totalPrice ||
                                selectedInvoice.total_amount ||
                                0
                            )}
                          </span>
                        </div>
                        <div className="text-center text-[10px] text-gray-400">
                          Cảm ơn quý khách!
                        </div>
                      </div>
                      {/* Action Buttons */}
                      <div className="p-4 pt-0 flex flex-col gap-2 print:hidden">
                        <Button
                          onClick={() => window.print()}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white gap-2"
                        >
                          <Printer className="w-4 h-4" /> In Hóa Đơn
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedInvoice(null)}
                          className="w-full"
                        >
                          Đóng
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: PASSWORD --- */}
            {activeTab === "password" && (
              <div className="max-w-md mx-auto p-4 animate-in fade-in duration-300">
                <h2 className="text-xl font-bold text-center mb-6">
                  ĐỔI MẬT KHẨU
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!oldPassword || !newPassword || !confirmPassword)
                      return Swal.fire(
                        "Lỗi",
                        "Vui lòng nhập đủ thông tin",
                        "error"
                      );
                    if (newPassword !== confirmPassword)
                      return Swal.fire(
                        "Lỗi",
                        "Mật khẩu xác nhận không khớp",
                        "error"
                      );
                    if (newPassword.length < 6)
                      return Swal.fire(
                        "Lỗi",
                        "Mật khẩu phải từ 6 ký tự",
                        "warning"
                      );

                    setIsSubmitting(true);
                    const token = localStorage.getItem("accessToken");
                    try {
                      const res = await fetch(
                        `${SERVER_BASE_URL}/api/users/change-password`,
                        {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                          },
                          body: JSON.stringify({
                            currentPassword: oldPassword,
                            newPassword,
                            confirmNewPassword: confirmPassword,
                          }),
                        }
                      );
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.message);

                      Swal.fire({
                        title: "Thành công!",
                        text: "Vui lòng đăng nhập lại.",
                        icon: "success",
                        confirmButtonText: "Đăng xuất",
                      }).then(() => performLogout());
                    } catch (err: any) {
                      Swal.fire("Thất bại", err.message, "error");
                    } finally {
                      setIsSubmitting(false);
                    }
                  }}
                  className="flex flex-col gap-4"
                >
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Mật khẩu cũ</label>
                    <div className="relative">
                      <Input
                        type={showOld ? "text" : "password"}
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOld(!showOld)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                      >
                        {showOld ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Mật khẩu mới</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="mt-1">
                        <div
                          className={`h-1 rounded-full ${strengthInfo.color}`}
                          style={{ width: `${(strength / 5) * 100}%` }}
                        />
                        <p className={`text-xs ${strengthInfo.textColor}`}>
                          {strengthInfo.label}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">
                      Xác nhận mật khẩu
                    </label>
                    <div className="relative">
                      <Input
                        type={showConfirm ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm(!showConfirm)}
                        className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="bg-orange-600 hover:bg-orange-700 w-full mt-2"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Đang xử lý..." : "Đổi mật khẩu"}
                  </Button>
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
