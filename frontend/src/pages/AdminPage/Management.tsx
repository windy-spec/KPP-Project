import React, {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import {
  Plus,
  Loader2,
  Printer,
  Filter,
  Trash2,
  Search,
  X,
  Truck,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import apiClient from "@/utils/api-user";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// 🚨 IMPORT COMPONENT SALE PROGRAM TABLE (Đảm bảo đường dẫn đúng)
// Nếu file Management.tsx nằm ở src/pages/AdminPage/ thì đường dẫn này đúng
import SaleProgramTable from "../../components/Admin/SaleProgramTable";

/* ---------------------- Cấu hình & Helper ---------------------- */
const sections = [
  { id: "products", label: "Sản phẩm" },
  { id: "categories", label: "Danh mục" },
  { id: "orders", label: "Đơn hàng" },
  { id: "sale_programs", label: "Chương trình Sale" }, // 🆕 Mới
  { id: "discounts", label: "Mã giảm giá" }, // 🆕 Mới
  { id: "users", label: "Người dùng" },
];

const SERVER_BASE_URL = "http://localhost:5001";

const getImageUrl = (path?: string) =>
  path ? (path.startsWith("http") ? path : `${SERVER_BASE_URL}${path}`) : "";

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

/* ---------------------- Types (Tổng hợp) ---------------------- */
type AdminChildProps = { openFromParent?: boolean; onParentClose?: () => void };

// Product & Category Types
type ProductItem = {
  _id: string;
  name: string;
  price: number;
  quantity: number;
  category?: { _id: string; name: string };
  description?: string;
  avatar?: string;
  images?: string[];
};

type Category = { _id: string; name: string; description?: string };

// Order Types
interface InvoiceItem {
  product_id: { _id?: string; name: string; price: number } | null;
  quantity: number;
  price?: number;
  discount?: number;
}
interface Invoice {
  _id: string;
  createdAt: string;
  recipient_info?: {
    name: string;
    phone: string;
    address: string;
    note?: string;
  };
  user?: { name?: string; email?: string };
  items: InvoiceItem[];
  totalPrice?: number;
  total_amount?: number;
  shipping_fee?: number;
  status?: string;
  order_status?: string;
  payment_status?: string;
  payment_method?: string;
}
type FilterType = "all" | "today" | "yesterday" | "week" | "month";

// Discount Types
type Tier = {
  condition_type: "QUANTITY" | "TOTAL_PRICE";
  min_value: number;
  percent: number;
};
type Discount = {
  _id?: string;
  name: string;
  type: "SALE" | "AGENCY";
  promotion_type?: string;
  target_type: "PRODUCT" | "CATEGORY" | "ORDER_TOTAL";
  target_id?: string | null;
  discount_percent?: number | null;
  min_quantity?: number;
  start_sale?: string;
  end_sale?: string;
  isActive?: boolean;
  tiers?: Tier[] | string[];
};

/* ---------------------- Main Component: Management ---------------------- */
const Management: React.FC = () => {
  const [active, setActive] = useState<string>("products");
  const [parentModalFor, setParentModalFor] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          #printable-area, #printable-area * { visibility: visible; } 
          #printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0 10mm; box-sizing: border-box; } 
          @page { margin: 5mm; size: auto; } 
          .modal-overlay { background: white; position: fixed; inset: 0; z-index: 9999; }
        }
      `}</style>

      <div className="flex min-h-screen print:hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r shadow-lg border-gray-100 p-6 bg-white h-screen sticky top-0 flex flex-col justify-between z-20">
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-800 uppercase tracking-wide">
              Quản trị
            </h3>
            <nav className="flex flex-col space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`text-left px-4 py-3 rounded-lg transition-all duration-200 font-medium ${
                    active === s.id
                      ? "bg-orange-50 text-orange-600 shadow-sm"
                      : "hover:bg-gray-50 text-gray-600"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </div>
          <div className="mt-6">
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="w-full border-orange-200 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
            >
              Quay lại Website
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 min-h-screen overflow-y-auto bg-gray-50/50">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              {sections.find((s) => s.id === active)?.label}
            </h2>
            {/* Nút Thêm cho Products và Categories */}
            {(active === "products" || active === "categories") && (
              <Button
                onClick={() => setParentModalFor(active)}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white shadow-md"
              >
                <Plus size={16} /> Thêm Mới
              </Button>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 min-h-[600px] p-6 relative">
            {active === "products" && (
              <ProductsAdmin
                openFromParent={parentModalFor === "products"}
                onParentClose={() => setParentModalFor(null)}
              />
            )}
            {active === "categories" && (
              <CategoriesAdmin
                openFromParent={parentModalFor === "categories"}
                onParentClose={() => setParentModalFor(null)}
              />
            )}
            {active === "orders" && <OrdersAdmin />}
            {active === "sale_programs" && <SaleProgramsAdmin />}
            {active === "discounts" && <DiscountsAdmin />}
            {active === "users" && <UsersAdmin />}
          </div>
        </main>
      </div>
    </div>
  );
};

/* =========================================================================================
   1. PRODUCTS ADMIN (Giữ nguyên logic)
   ========================================================================================= */
const ProductsAdmin: React.FC<AdminChildProps> = ({
  openFromParent,
  onParentClose,
}) => {
  // ... (Code ProductsAdmin cũ, tôi thu gọn để tập trung vào phần mới)
  const [categories, setCategories] = useState<Category[]>([]);
  const [allItems, setAllItems] = useState<ProductItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 10;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // Form states...
  const [quantity, setQuantity] = useState<number>(1);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [priceInput, setPriceInput] = useState<string>("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [oldAvatar, setOldAvatar] = useState<string>("");
  const [oldImages, setOldImages] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  const goToPage = (n: number) => setPage(Math.min(Math.max(1, n), totalPages));
  const resetForm = () => {
    setName("");
    setPrice(0);
    setPriceInput("");
    setCategory("");
    setDescription("");
    setQuantity(1);
    setAvatarFile(null);
    setAvatarPreview("");
    setImageFiles([]);
    setImagePreviews([]);
    setOldAvatar("");
    setOldImages([]);
    setEditingId(null);
    setEditingProduct(null);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/category`);
        setCategories(await res.json());
      } catch {
        toast.error("Lỗi tải danh mục");
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `${SERVER_BASE_URL}/api/product/partition?page=${page}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      setAllItems(data.products || []);
      setTotalPages(data.totalPages || 1);
      setSelectedIds(new Set());
    } catch {
      toast.error("Lỗi tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, [page]);

  const submit = async () => {
    if (!name || !category) {
      toast.error("Thiếu thông tin");
      return;
    }
    const endpoint = editingId
      ? `${SERVER_BASE_URL}/api/product/${editingId}`
      : `${SERVER_BASE_URL}/api/product`;
    const method = editingId ? "PUT" : "POST";
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price.toString());
      formData.append("category", category);
      formData.append("description", description);
      formData.append("quantity", quantity.toString());
      if (avatarFile) formData.append("avatar", avatarFile);
      imageFiles.forEach((file) => formData.append("images", file));
      const res = await fetch(endpoint, { method, body: formData });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Đã cập nhật" : "Đã thêm");
      resetForm();
      await fetchProducts();
    } catch {
      toast.error("Lỗi lưu sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  const openEdit = (id: string) => {
    const it = allItems.find((i) => i._id === id);
    if (!it) return;
    setEditingId(id);
    setEditingProduct(it);
    setName(it.name);
    setPrice(it.price);
    setPriceInput(
      it.price ? String(it.price).replace(/\B(?=(\d{3})+(?!\d))/g, ".") : ""
    );
    setCategory(it.category?._id || "");
    setDescription(it.description || "");
    setQuantity(it.quantity || 0);
    setOldAvatar(it.avatar || "");
    setOldImages(it.images || []);
    setAvatarFile(null);
    setAvatarPreview("");
    setImageFiles([]);
    setImagePreviews([]);
  };

  const remove = async (id: string) => {
    try {
      await fetch(`${SERVER_BASE_URL}/api/product/${id}`, { method: "DELETE" });
      toast.success("Đã xóa");
      fetchProducts();
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  const removeMany = async (ids: string[]) => {
    if (ids.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`${SERVER_BASE_URL}/api/product/${id}`, { method: "DELETE" })
        )
      );
      toast.success(`Đã xóa ${ids.length} sản phẩm`);
      setSelectedIds(new Set());
      await fetchProducts();
    } catch {
      toast.error("Lỗi xóa");
    } finally {
      setIsLoading(false);
    }
  };

  const renderForm = (title: string) => (
    <div className="p-6 border border-gray-100 rounded-lg bg-gray-50 mb-6 animate-in fade-in zoom-in duration-200">
      <h3 className="font-bold text-xl mb-4 text-orange-600">{title}</h3>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-3">
          <input
            className="w-full border p-3 rounded bg-white"
            placeholder="Tên sản phẩm"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              className="w-full border p-3 rounded bg-white"
              placeholder="Giá (VND)"
              value={priceInput}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "");
                if (!digits) {
                  setPrice(0);
                  setPriceInput("");
                  return;
                }
                setPrice(parseInt(digits));
                setPriceInput(digits.replace(/\B(?=(\d{3})+(?!\d))/g, "."));
              }}
            />
            <input
              type="number"
              className="w-full border p-3 rounded bg-white"
              placeholder="Số lượng"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-3 rounded bg-white"
          >
            <option value="">-- Chọn danh mục --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <textarea
            className="w-full border p-3 rounded bg-white h-24"
            placeholder="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Nút Upload Avatar & Gallery (Giản lược UI) */}
          <div className="flex gap-4 items-center">
            <Button
              type="button"
              variant="secondary"
              onClick={() => avatarInputRef.current?.click()}
            >
              Ảnh đại diện
            </Button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  setAvatarFile(f);
                  setAvatarPreview(URL.createObjectURL(f));
                  setOldAvatar("");
                }
              }}
            />
            {avatarPreview ? (
              <img src={avatarPreview} className="w-10 h-10 rounded border" />
            ) : (
              oldAvatar && (
                <img
                  src={getImageUrl(oldAvatar)}
                  className="w-10 h-10 rounded border"
                />
              )
            )}

            <Button
              type="button"
              variant="secondary"
              onClick={() => galleryInputRef.current?.click()}
            >
              Ảnh chi tiết
            </Button>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const fs = Array.from(e.target.files ?? []);
                setImageFiles(fs);
                setImagePreviews(fs.map((f) => URL.createObjectURL(f)));
                setOldImages([]);
              }}
            />
            <span className="text-xs text-gray-500">
              {imageFiles.length || oldImages.length} ảnh
            </span>
          </div>

          <div className="flex gap-3 pt-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onParentClose && onParentClose();
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={submit}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isLoading ? "Đang lưu..." : "Lưu sản phẩm"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {openFromParent && !editingId && renderForm("Thêm Sản Phẩm Mới")}
      {editingId && renderForm(`Chỉnh sửa: ${editingProduct?.name}`)}
      {!openFromParent && !editingId && (
        <>
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-lg text-gray-700">
              Danh sách sản phẩm ({allItems.length})
            </h3>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => removeMany(Array.from(selectedIds))}
              >
                Xóa {selectedIds.size} mục
              </Button>
            )}
          </div>
          <div className="border border-gray-100 rounded-lg bg-white overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs">
                <tr>
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      onChange={() => {
                        if (selectedIds.size === allItems.length)
                          setSelectedIds(new Set());
                        else
                          setSelectedIds(new Set(allItems.map((i) => i._id)));
                      }}
                      checked={
                        allItems.length > 0 &&
                        selectedIds.size === allItems.length
                      }
                    />
                  </th>
                  <th className="p-3">Ảnh</th>
                  <th className="p-3">Tên</th>
                  <th className="p-3">Giá</th>
                  <th className="p-3">Kho</th>
                  <th className="p-3">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allItems.map((it) => (
                  <tr
                    key={it._id}
                    className="hover:bg-orange-50/30 transition-colors"
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(it._id)}
                        onChange={() => {
                          const newSet = new Set(selectedIds);
                          if (newSet.has(it._id)) newSet.delete(it._id);
                          else newSet.add(it._id);
                          setSelectedIds(newSet);
                        }}
                      />
                    </td>
                    <td className="p-3">
                      {it.avatar && (
                        <img
                          src={getImageUrl(it.avatar)}
                          className="w-10 h-10 object-cover rounded shadow-sm"
                        />
                      )}
                    </td>
                    <td className="p-3 font-medium text-gray-900">{it.name}</td>
                    <td className="p-3 text-orange-600 font-bold">
                      {formatVND(it.price)}
                    </td>
                    <td className="p-3">{it.quantity}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => openEdit(it._id)}
                        className="text-blue-600 hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => remove(it._id)}
                        className="text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="p-4 flex justify-end gap-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => goToPage(page - 1)}
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* =========================================================================================
   2. CATEGORIES ADMIN (Giữ nguyên)
   ========================================================================================= */
const CategoriesAdmin: React.FC<AdminChildProps> = ({
  openFromParent,
  onParentClose,
}) => {
  const [items, setItems] = useState<Category[]>([]);
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const resetForm = () => {
    setName("");
    setDescription("");
    setEditingId(null);
  };
  const fetchAll = async () => {
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/category`);
      setItems(await res.json());
    } catch {
      toast.error("Lỗi tải danh mục");
    }
  };
  useEffect(() => {
    fetchAll();
  }, []);

  const submit = async () => {
    if (!name.trim()) return toast.error("Nhập tên danh mục");
    setIsLoading(true);
    const url = editingId
      ? `${SERVER_BASE_URL}/api/category/${editingId}`
      : `${SERVER_BASE_URL}/api/category`;
    const method = editingId ? "PUT" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });
      if (!res.ok) throw new Error();
      toast.success(editingId ? "Đã cập nhật" : "Đã thêm");
      resetForm();
      onParentClose && onParentClose();
      fetchAll();
    } catch {
      toast.error("Lỗi lưu danh mục");
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Xóa danh mục này?")) return;
    try {
      await fetch(`${SERVER_BASE_URL}/api/category/${id}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa");
      fetchAll();
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  return (
    <div className="space-y-4">
      {(openFromParent || editingId) && (
        <div className="p-6 border rounded-lg bg-gray-50 mb-6 animate-in fade-in zoom-in duration-200">
          <h4 className="font-bold mb-4 text-orange-600">
            {editingId ? "Sửa Danh Mục" : "Thêm Danh Mục"}
          </h4>
          <input
            className="w-full border p-3 rounded bg-white mb-3"
            placeholder="Tên danh mục"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full border p-3 rounded bg-white mb-4"
            placeholder="Mô tả"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onParentClose && onParentClose();
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={submit}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Lưu
            </Button>
          </div>
        </div>
      )}
      {!openFromParent && !editingId && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 uppercase text-xs text-gray-700">
              <tr className="border-b">
                <th className="p-3">Tên</th>
                <th className="p-3">Mô tả</th>
                <th className="p-3 w-32">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((c) => (
                <tr key={c._id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-gray-500">{c.description}</td>
                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => {
                        setEditingId(c._id);
                        setName(c.name);
                        setDescription(c.description || "");
                      }}
                      className="text-blue-600 hover:underline"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => remove(c._id)}
                      className="text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/* =========================================================================================
   3. ORDERS ADMIN (Tích hợp từ OrderHistory)
   ========================================================================================= */
const OrdersAdmin: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [productSearch, setProductSearch] = useState<string>("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const limit = 9;

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/invoice", {
        params: { page: currentPage, limit },
      });
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.invoices || res.data?.docs || [];
      const total = res.data?.totalPages || Math.ceil(data.length / limit) || 1;
      setInvoices(data);
      setTotalPages(total);
    } catch {
      toast.error("Không tải được đơn hàng");
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );
    const dateFiltered =
      filterType === "all"
        ? invoices
        : invoices.filter((inv) => {
            const invDate = new Date(inv.createdAt);
            switch (filterType) {
              case "today":
                return invDate >= todayStart && invDate <= todayEnd;
              case "yesterday": {
                const yestStart = new Date(todayStart);
                yestStart.setDate(yestStart.getDate() - 1);
                const yestEnd = new Date(todayEnd);
                yestEnd.setDate(yestEnd.getDate() - 1);
                return invDate >= yestStart && invDate <= yestEnd;
              }
              case "week": {
                const w = new Date(todayStart);
                w.setDate(w.getDate() - 7);
                return invDate >= w;
              }
              case "month": {
                const m = new Date(todayStart);
                m.setMonth(m.getMonth() - 1);
                return invDate >= m;
              }
              default:
                return true;
            }
          });
    const q = productSearch.trim().toLowerCase();
    if (!q) return dateFiltered;
    return dateFiltered.filter((inv) =>
      (inv.items || []).some((it) =>
        ((it as any)?.product_id?.name || "").toLowerCase().includes(q)
      )
    );
  }, [invoices, filterType, productSearch]);

  const handleSelectInvoice = async (invoiceId: string) => {
    try {
      const res = await apiClient.get(`/invoice/${invoiceId}`);
      setSelectedInvoice(res.data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi tải chi tiết");
    }
  };

  const handleDeleteInvoice = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Xóa hóa đơn?",
      text: "Không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Xóa",
    });
    if (result.isConfirmed) {
      try {
        await apiClient.delete(`/invoice/${invoiceId}`);
        setInvoices((prev) => prev.filter((i) => i._id !== invoiceId));
        Swal.fire("Đã xóa!", "", "success");
      } catch (err: any) {
        Swal.fire("Lỗi!", err.response?.data?.message, "error");
      }
    }
  };

  const handleAdminShipOrder = async (
    e: React.MouseEvent,
    invoiceId: string
  ) => {
    e.stopPropagation();
    const result = await Swal.fire({
      title: "Giao Shipper?",
      text: "Đơn hàng sẽ chuyển sang Đang giao.",
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#3b82f6",
      confirmButtonText: "Giao ngay",
    });
    if (result.isConfirmed) {
      try {
        await apiClient.put(`/invoice/${invoiceId}`, {
          order_status: "SHIPPING",
          status: "SHIPPING",
        });
        setInvoices((prev) =>
          prev.map((i) =>
            i._id === invoiceId
              ? { ...i, status: "SHIPPING", order_status: "SHIPPING" }
              : i
          )
        );
        Swal.fire("Đã giao!", "", "success");
      } catch {
        Swal.fire("Lỗi", "", "error");
      }
    }
  };

  const getStatusText = (status: string | undefined) => {
    switch (status) {
      case "COMPLETED":
        return "Hoàn thành";
      case "SHIPPING":
        return "Đang giao";
      case "CANCELLED":
        return "Đã hủy";
      default:
        return "Mới đặt";
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4 items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
        <Filter className="w-4 h-4 text-gray-500 mr-2" />
        {(["all", "today", "yesterday", "week"] as FilterType[]).map((type) => (
          <Button
            key={type}
            variant={filterType === type ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType(type)}
            className={`text-xs ${
              filterType === type ? "bg-orange-500 hover:bg-orange-600" : ""
            }`}
          >
            {type === "all"
              ? "Tất cả"
              : type === "today"
              ? "Hôm nay"
              : type === "yesterday"
              ? "Hôm qua"
              : "Tuần này"}
          </Button>
        ))}
        <div className="flex items-center border rounded-md bg-white px-3 py-1 w-full md:w-64 md:ml-auto">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            placeholder="Tìm đơn hàng..."
            className="text-sm outline-none w-full"
          />
          {productSearch && (
            <button onClick={() => setProductSearch("")}>
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <Loader2 className="animate-spin inline text-orange-500" /> Loading...
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg text-gray-500">
          Chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInvoices.map((inv) => (
            <div
              key={inv._id}
              onClick={() => handleSelectInvoice(inv._id)}
              className="bg-white p-5 rounded-xl shadow-sm border hover:shadow-md cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between"
            >
              <div
                className={`absolute top-0 left-0 w-1 h-full ${
                  inv.status === "COMPLETED"
                    ? "bg-green-500"
                    : inv.status === "CANCELLED"
                    ? "bg-red-500"
                    : "bg-orange-500"
                }`}
              ></div>
              <div>
                <div className="flex justify-between items-start mb-3 pl-2">
                  <div>
                    <div className="text-[10px] text-gray-400 uppercase font-bold">
                      Mã đơn
                    </div>
                    <div className="font-mono font-bold text-gray-800 text-lg">
                      #{inv._id.slice(-6).toUpperCase()}
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-gray-300 hover:text-red-500"
                    onClick={(e) => handleDeleteInvoice(e, inv._id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="pl-2 mb-3 flex flex-wrap gap-2">
                  <span className="px-2 py-1 text-[10px] rounded border bg-gray-100 font-bold uppercase">
                    {getStatusText(inv.order_status || inv.status)}
                  </span>
                  <span
                    className={`px-2 py-1 text-[10px] rounded border font-bold uppercase ${
                      inv.payment_status === "PAID"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    {inv.payment_status === "PAID"
                      ? "Đã thanh toán"
                      : "Chưa TT"}
                  </span>
                </div>
                <div className="mb-3 pl-2 pb-3 border-b border-gray-50">
                  <p className="text-xs text-gray-400 uppercase mb-1">
                    Khách hàng
                  </p>
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {inv.recipient_info?.name || inv.user?.name || "Khách lẻ"}
                  </p>
                </div>
              </div>
              <div className="pl-2 mb-3 space-y-2">
                {(inv.status === "PLACED" || inv.order_status === "PLACED") && (
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs shadow-sm"
                    onClick={(e) => handleAdminShipOrder(e, inv._id)}
                  >
                    <Truck className="w-3 h-3 mr-1" /> Giao Shipper
                  </Button>
                )}
              </div>
              <div className="pl-2 pt-2 flex justify-between items-center border-t border-dashed border-gray-200 mt-2">
                <span className="text-sm text-gray-500">Tổng tiền:</span>
                <span className="font-bold text-lg text-orange-600">
                  {formatVND(inv.totalPrice || inv.total_amount || 0)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {invoices.length > 0 && filterType === "all" && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            Trước
          </Button>
          <span className="px-4 py-2 bg-white border rounded text-sm font-medium flex items-center">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            Sau
          </Button>
        </div>
      )}
      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
};

/* =========================================================================================
   4. SALE PROGRAMS ADMIN (Chỉ cần render Table)
   ========================================================================================= */
const SaleProgramsAdmin: React.FC = () => {
  return (
    <div className="animate-in fade-in zoom-in duration-200">
      {/* Component này sẽ hiển thị bảng chương trình Sale */}
      <SaleProgramTable />
    </div>
  );
};

/* =========================================================================================
   5. DISCOUNTS ADMIN (Tích hợp từ SaleAdminPage)
   ========================================================================================= */
const DiscountsAdmin: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const PAGE_SIZE = 10;

  // Form State
  const [form, setForm] = useState<Discount>({
    name: "",
    type: "SALE",
    target_type: "PRODUCT",
    discount_percent: 0,
    min_quantity: 1,
    isActive: true,
    tiers: [],
    start_sale: "",
    end_sale: "",
  });

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SERVER_BASE_URL}/api/discount`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data)) setDiscounts(data);
      else if (data?.discounts) setDiscounts(data.discounts);
      else if (data?.data) setDiscounts(data.data);
      else setDiscounts([]);
    } catch {
      toast.error("Lỗi tải discount");
    } finally {
      setLoading(false);
    }
  };

  const fetchSelectData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch(`${SERVER_BASE_URL}/api/product`),
        fetch(`${SERVER_BASE_URL}/api/category`),
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData.products || prodData.data || []);
      setCategories(catData.categories || catData.data || []);
    } catch {
      toast.error("Lỗi tải dữ liệu phụ");
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchSelectData();
  }, []);

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");
    const formattedTiers = ((form.tiers as Tier[]) || []).map((t) => ({
      min_quantity: t.min_value,
      discount_percent: t.percent,
    }));
    const payload = { ...form, tiers: formattedTiers };
    try {
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `${SERVER_BASE_URL}/api/discount/${editing!._id}`
        : `${SERVER_BASE_URL}/api/discount`;
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Lỗi lưu");
      } else {
        toast.success(editing ? "Đã cập nhật" : "Đã tạo");
        setOpenModal(false);
        setQuery("");
        setPage(1);
        await fetchDiscounts();
      }
    } catch {
      toast.error("Lỗi hệ thống");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const result = await Swal.fire({
      title: "Xóa vĩnh viễn?",
      text: "Không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
    });
    if (!result.isConfirmed) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `${SERVER_BASE_URL}/api/discount/hard-delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );
      if (!res.ok) toast.error("Xóa thất bại");
      else {
        toast.success("Đã xóa");
        fetchDiscounts();
      }
    } catch {
      toast.error("Lỗi xóa");
    }
  };

  // Helper functions for modal
  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      type: "SALE",
      promotion_type: "GENERAL",
      target_type: "PRODUCT",
      discount_percent: 0,
      min_quantity: 1,
      isActive: true,
      tiers: [],
      start_sale: "",
      end_sale: "",
    });
    setOpenModal(true);
  };
  const openEdit = (d: Discount) => {
    const normalizedTiers = Array.isArray(d.tiers)
      ? (d.tiers as any[])
          .map((t) =>
            typeof t === "string"
              ? null
              : {
                  condition_type: t.condition_type || "QUANTITY",
                  min_value: t.min_quantity,
                  percent: t.discount_percent,
                }
          )
          .filter(Boolean)
      : [];
    setEditing(d);
    setForm({
      ...d,
      start_sale: d.start_sale
        ? new Date(d.start_sale).toISOString().slice(0, 10)
        : "",
      end_sale: d.end_sale
        ? new Date(d.end_sale).toISOString().slice(0, 10)
        : "",
      tiers: normalizedTiers,
    });
    setOpenModal(true);
  };
  const addTier = () =>
    setForm((p) => ({
      ...p,
      tiers: [
        ...(p.tiers as Tier[]),
        { condition_type: "QUANTITY", min_value: 1, percent: 5 },
      ],
    }));
  const removeTier = (idx: number) =>
    setForm((p) => ({
      ...p,
      tiers: (p.tiers as Tier[]).filter((_, i) => i !== idx),
    }));
  const updateTier = (idx: number, key: keyof Tier, val: any) =>
    setForm((p) => {
      const t = [...(p.tiers as Tier[])];
      t[idx] = { ...t[idx], [key]: val };
      return { ...p, tiers: t };
    });

  const filtered = discounts.filter(
    (d) =>
      (d.name || "").toLowerCase().includes(query.toLowerCase()) ||
      (d.type || "").toLowerCase().includes(query.toLowerCase())
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              className="border rounded-lg pl-3 pr-8 py-2 text-sm w-64"
              placeholder="Tìm kiếm..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={openCreate}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex gap-2 items-center"
          >
            <Plus size={16} /> Tạo Mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-500">Đang tải...</div>
      ) : (
        <div className="border border-gray-100 rounded-lg bg-white overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 uppercase text-xs text-gray-700">
              <tr>
                <th className="p-4">Tên</th>
                <th className="p-4">Loại</th>
                <th className="p-4">Áp dụng</th>
                <th className="p-4 text-center">% Giảm</th>
                <th className="p-4">Thời gian</th>
                <th className="p-4 text-center">Trạng thái</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pageData.map((d) => (
                <tr key={d._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{d.name}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        d.type === "SALE"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-purple-100 text-purple-700"
                      }`}
                    >
                      {d.type}
                    </span>
                  </td>
                  <td className="p-4">{d.target_type}</td>
                  <td className="p-4 text-center font-bold text-orange-600">
                    {d.discount_percent}%
                  </td>
                  <td className="p-4 text-xs text-gray-600">
                    {d.start_sale
                      ? new Date(d.start_sale).toLocaleDateString("vi-VN")
                      : "-"}{" "}
                    <br />{" "}
                    {d.end_sale
                      ? new Date(d.end_sale).toLocaleDateString("vi-VN")
                      : "Vĩnh viễn"}
                  </td>
                  <td className="p-4 text-center">
                    {d.isActive ? (
                      <span className="text-green-600 font-bold text-xs">
                        Hoạt động
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">Ẩn</span>
                    )}
                  </td>
                  <td className="p-4 flex gap-2 justify-center">
                    <button
                      onClick={() => openEdit(d)}
                      className="text-yellow-600 hover:bg-yellow-50 p-1 rounded"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDelete(d._id)}
                      className="text-red-600 hover:bg-red-50 p-1 rounded"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageData.length === 0 && (
            <div className="p-10 text-center text-gray-400">
              Không có dữ liệu
            </div>
          )}
        </div>
      )}

      {/* MODAL FORM */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 mt-10 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between mb-4 border-b pb-2">
              <h3 className="text-xl font-bold">
                {editing ? "Sửa Discount" : "Tạo Discount"}
              </h3>
              <button onClick={() => setOpenModal(false)}>✕</button>
            </div>
            <form onSubmit={submitForm} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên</label>
                  <input
                    className="w-full border p-2 rounded"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Loại</label>
                  <select
                    className="w-full border p-2 rounded"
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as any })
                    }
                  >
                    <option value="SALE">SALE</option>
                    <option value="AGENCY">AGENCY</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Áp dụng
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={form.target_type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        target_type: e.target.value as any,
                        target_id: null,
                      })
                    }
                  >
                    <option value="PRODUCT">Sản phẩm</option>
                    <option value="CATEGORY">Danh mục</option>
                    <option value="ORDER_TOTAL">Tổng đơn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Đối tượng
                  </label>
                  <select
                    className="w-full border p-2 rounded"
                    value={form.target_id || ""}
                    onChange={(e) =>
                      setForm({ ...form, target_id: e.target.value || null })
                    }
                    disabled={form.target_type === "ORDER_TOTAL"}
                  >
                    <option value="">-- Chọn --</option>
                    {form.target_type === "PRODUCT" &&
                      products.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    {form.target_type === "CATEGORY" &&
                      categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    % Giảm
                  </label>
                  <input
                    type="number"
                    className="w-full border p-2 rounded"
                    value={form.discount_percent ?? 0}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        discount_percent: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded"
                    value={form.start_sale ? form.start_sale.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm({ ...form, start_sale: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full border p-2 rounded"
                    value={form.end_sale ? form.end_sale.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm({ ...form, end_sale: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  checked={form.isActive ?? true}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label>Kích hoạt ngay</label>
              </div>

              {/* Tiers */}
              {form.target_type !== "ORDER_TOTAL" && (
                <div className="border-t pt-4">
                  <div className="flex justify-between mb-2">
                    <label className="font-bold text-sm">
                      Mức giảm bậc thang
                    </label>
                    <button
                      type="button"
                      onClick={addTier}
                      className="text-xs bg-green-600 text-white px-2 py-1 rounded"
                    >
                      + Thêm
                    </button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {((form.tiers as Tier[]) || []).map((t, idx) => (
                      <div
                        key={idx}
                        className="flex gap-2 items-center bg-gray-50 p-2 rounded"
                      >
                        <select
                          value={t.condition_type}
                          onChange={(e) =>
                            updateTier(idx, "condition_type", e.target.value)
                          }
                          className="border p-1 text-xs"
                        >
                          <option value="QUANTITY">SL &ge;</option>
                          <option value="TOTAL_PRICE">Tiền &ge;</option>
                        </select>
                        <input
                          type="number"
                          value={t.min_value}
                          onChange={(e) =>
                            updateTier(idx, "min_value", Number(e.target.value))
                          }
                          className="border p-1 w-16 text-xs"
                        />
                        <span className="text-xs">→ Giảm</span>
                        <input
                          type="number"
                          value={t.percent}
                          onChange={(e) =>
                            updateTier(idx, "percent", Number(e.target.value))
                          }
                          className="border p-1 w-12 text-xs font-bold text-orange-600"
                        />
                        <span className="text-xs">%</span>
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className="text-red-500 text-xs ml-auto"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------------------- 6. UsersAdmin (Placeholder) ---------------------- */
const UsersAdmin: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 10;

  // Fetch Users
  const fetchUsers = async () => {
    setLoading(true);
    const token = localStorage.getItem("accessToken");
    try {
      // Gọi API Backend (Đảm bảo bạn đã tạo route GET /api/users)
      const res = await fetch(
        `${SERVER_BASE_URL}/api/users?page=${page}&limit=${PAGE_SIZE}&search=${encodeURIComponent(
          search
        )}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (res.ok) {
        setUsers(data.users || []);
        setTotalPages(data.totalPages || 1);
      } else {
        toast.error("Không tải được danh sách người dùng");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(timer);
  }, [page, search]);

  const handleDeleteUser = async (id: string) => {
    const result = await Swal.fire({
      title: "Xóa người dùng?",
      text: "Hành động này sẽ xóa vĩnh viễn tài khoản và dữ liệu liên quan!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa ngay",
    });

    if (result.isConfirmed) {
      const token = localStorage.getItem("accessToken");
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/users/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          toast.success("Đã xóa người dùng");
          fetchUsers();
        } else {
          toast.error("Lỗi khi xóa");
        }
      } catch {
        toast.error("Lỗi kết nối");
      }
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in zoom-in duration-200">
      {/* Header & Search */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
        <h3 className="font-bold text-lg text-gray-800">Quản lý Người dùng</h3>
        <div className="relative">
          <input
            className="border border-gray-300 rounded-lg pl-3 pr-8 py-2 text-sm w-64 focus:ring-2 focus:ring-orange-500 outline-none"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Search className="absolute right-2 top-2.5 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-500">
          <Loader2 className="animate-spin inline mr-2" /> Đang tải...
        </div>
      ) : (
        <div className="border border-gray-100 rounded-lg bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-semibold">
              <tr>
                <th className="p-4">Khách hàng</th>
                <th className="p-4">Liên hệ</th>
                <th className="p-4 text-center">Vai trò</th>
                <th className="p-4 text-center">Ngày tham gia</th>
                <th className="p-4 text-center">Truy cập cuối</th>
                <th className="p-4 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr
                    key={u._id}
                    className="hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            getImageUrl(u.avatarUrl) ||
                            "https://placehold.co/40x40?text=U"
                          }
                          alt="avatar"
                          className="w-10 h-10 rounded-full object-cover border border-gray-200"
                        />
                        <div>
                          <p className="font-medium text-gray-900">
                            {u.displayName || "Chưa đặt tên"}
                          </p>
                          <p className="text-xs text-gray-500">
                            @{u.username || "user"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-gray-600">
                      <p className="flex items-center gap-1">📧 {u.email}</p>
                      {u.phone && (
                        <p className="flex items-center gap-1 mt-1">
                          📞 {u.phone}
                        </p>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : "bg-blue-50 text-blue-700 border border-blue-100"
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4 text-center text-gray-500">
                      {new Date(u.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="p-4 text-center">
                      {u.lastLogin ? (
                        <div className="flex flex-col items-center">
                          <span className="text-sm font-medium text-gray-700">
                            {new Date(u.lastLogin).toLocaleDateString("vi-VN")}
                          </span>
                          <span className="text-xs text-gray-400">
                            {new Date(u.lastLogin).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {/* Logic hiển thị trạng thái Online (ví dụ: trong vòng 5 phút) */}
                          {new Date().getTime() -
                            new Date(u.lastLogin).getTime() <
                            5 * 60 * 1000 && (
                            <span className="text-[10px] text-green-600 font-bold animate-pulse">
                              ● Online
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">Chưa rõ</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {u.role !== "admin" && (
                        <button
                          onClick={() => handleDeleteUser(u._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa người dùng"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-gray-400 italic"
                  >
                    Không tìm thấy người dùng nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <span className="px-4 py-2 text-sm bg-white border rounded shadow-sm">
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}
    </div>
  );
};

/* ---------------------- Helper Component: Modal Hóa Đơn ---------------------- */
const InvoiceDetailModal = ({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) => {
  const finalTotal = invoice.totalPrice || invoice.total_amount || 0;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `${window.location.origin}/invoice/${invoice._id}`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm modal-overlay overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-[420px] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="printable-area" className="p-6 font-mono text-sm bg-white">
          <div className="border-b-2 border-dashed border-gray-300 pb-4 mb-4">
            <h2 className="text-xl font-bold text-center uppercase">
              Hóa Đơn Bán Hàng
            </h2>
            <div className="text-center text-xs text-gray-500 mt-1">
              Mã: #{invoice._id.slice(-6).toUpperCase()}
            </div>
            <div className="text-center text-xs text-gray-400">
              {formatDateSafe(invoice.createdAt)}
            </div>
          </div>
          <div className="mb-4 text-xs space-y-1">
            <div className="flex justify-between">
              <span>Khách:</span>{" "}
              <span className="font-bold">
                {invoice.recipient_info?.name || invoice.user?.name}
              </span>
            </div>
            <div className="flex justify-between">
              <span>SĐT:</span> <span>{invoice.recipient_info?.phone}</span>
            </div>
            <div className="flex justify-between items-start">
              <span>Đ/C:</span>{" "}
              <span className="text-right max-w-[200px]">
                {invoice.recipient_info?.address}
              </span>
            </div>
            {invoice.recipient_info?.note && (
              <div className="flex justify-between items-start text-gray-500 italic mt-1 border-t border-dashed pt-1">
                <span>Note:</span>{" "}
                <span className="text-right max-w-[200px]">
                  {invoice.recipient_info.note}
                </span>
              </div>
            )}
          </div>
          <div className="border-t border-b border-gray-200 py-2 mb-4">
            {invoice.items.map((item, idx) => (
              <div key={idx} className="flex justify-between py-1">
                <div>
                  <div className="font-medium">{item.product_id?.name}</div>
                  <div className="text-xs text-gray-500">x{item.quantity}</div>
                </div>
                <div className="font-medium">
                  {formatVND((item.price || 0) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-1 text-right mb-4">
            <div className="text-xs text-gray-500">
              Phí ship: {formatVND(invoice.shipping_fee || 0)}
            </div>
            <div className="text-lg font-bold text-gray-900">
              Tổng: {formatVND(finalTotal)}
            </div>
          </div>
          <div className="text-center text-xs mb-4 p-2 bg-gray-50 rounded border border-gray-100">
            Trạng thái: <b>{invoice.status}</b> <br />
            Thanh toán:{" "}
            <b
              className={
                invoice.payment_status === "PAID"
                  ? "text-green-600"
                  : "text-yellow-600"
              }
            >
              {invoice.payment_status === "PAID"
                ? "ĐÃ THANH TOÁN"
                : "CHƯA THANH TOÁN"}
            </b>{" "}
            ({invoice.payment_method})
          </div>
          <div className="flex justify-center mb-2">
            <img
              src={qrSrc}
              alt="QR"
              className="w-16 h-16 mix-blend-multiply"
            />
          </div>
          <div className="text-center text-xs italic text-gray-400">
            Cảm ơn quý khách!
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex gap-2 print:hidden">
          <Button
            onClick={() => window.print()}
            className="flex-1 bg-orange-500 hover:bg-orange-600"
          >
            <Printer className="w-4 h-4 mr-2" /> In hóa đơn
          </Button>
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
};
export default Management;
