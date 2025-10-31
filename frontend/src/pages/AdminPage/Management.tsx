import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Product from "../Product";

const sections = [
  { id: "products", label: "Sản phẩm" },
  { id: "categories", label: "Danh mục" },
  { id: "orders", label: "Đơn hàng" },
  { id: "users", label: "Người dùng" },
];
const getImageUrl = (path?: string) => {
  if (!path) return "";
  return path.startsWith("http") ? path : `http://localhost:5001${path}`;
};
type AdminChildProps = { openFromParent?: boolean; onParentClose?: () => void };

type ProductItem = {
  _id: string;
  name: string;
  price: number;
  category?: { _id: string; name: string };
  description?: string;
  image_url?: string;
};

type Category = {
  _id: string;
  name: string;
};

const Management: React.FC = () => {
  const [active, setActive] = useState<string>("products");
  const [parentModalFor, setParentModalFor] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full bg-white overflow-hidden">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r p-6 bg-white h-screen sticky top-0 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold mb-4">Quản trị</h3>
              <nav className="flex flex-col space-y-2">
                {sections.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={`text-left px-3 py-2 rounded-lg transition-colors ${
                      active === s.id
                        ? "bg-orange-50 text-orange-600 font-semibold"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="mt-6">
              <Button onClick={() => window.history.back()} className="w-full">
                Quay lại
              </Button>
            </div>
          </aside>

          {/* Main */}
          <main className="flex-1 p-8 min-h-screen">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold">
                  {sections.find((s) => s.id === active)?.label}
                </h2>
              </div>

              <Button
                onClick={() => setParentModalFor(active)}
                className="flex items-center gap-2"
              >
                <Plus size={16} /> Thêm
              </Button>
            </div>

            <div className="border rounded-lg p-4 min-h-[320px] bg-white">
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
              {active === "users" && <UsersAdmin />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- ProductsAdmin ---------------------- */
const ProductsAdmin: React.FC<AdminChildProps> = ({
  openFromParent,
  onParentClose,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [allItems, setAllItems] = useState<ProductItem[]>([]);
  const [page, setPage] = useState<number>(1);
  const PAGE_SIZE = 7;

  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [oldImage, setOldImage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const start = (page - 1) * PAGE_SIZE;
  const displayedItems = allItems.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));

  const goToPage = (n: number) => setPage(Math.min(Math.max(1, n), totalPages));

  const resetForm = () => {
    setName("");
    setPrice(0);
    setCategory("");
    setDescription("");
    setImageFile(null);
    setImagePreview(null);
    setOldImage(null);
    setEditingId(null);
    setEditingProduct(null);
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("http://localhost:5001/api/category");
        if (!res.ok) throw new Error("Lỗi tải danh mục");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5001/api/product");
      if (!response.ok) throw new Error("Lỗi khi tải sản phẩm");
      const data = await response.json();
      setAllItems(
        Array.isArray(data) ? data : data.products || data.data || []
      );
    } catch (error) {
      console.error("API GET lỗi:", error);
      toast.error("Không thể tải sản phẩm.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const submit = async () => {
    if (!name || !category) {
      toast.error("Vui lòng nhập đủ thông tin sản phẩm");
      return;
    }

    let endpoint = "http://localhost:5001/api/product";
    let method: "POST" | "PUT" = "POST";
    let successMessage = "Thêm sản phẩm thành công";

    if (editingId) {
      endpoint = `http://localhost:5001/api/product/${editingId}`;
      method = "PUT";
      successMessage = "Cập nhật sản phẩm thành công";
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("price", price.toString());
      formData.append("category", category);
      formData.append("description", description);
      if (imageFile) formData.append("image", imageFile);

      const res = await fetch(endpoint, { method, body: formData });
      if (!res.ok) throw new Error("Lỗi thêm/cập nhật sản phẩm");

      await fetchProducts();
      toast.success(successMessage);
      resetForm();
    } catch (err) {
      console.error("❌ API lỗi:", err);
      toast.error("Không thể lưu sản phẩm.");
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
    setCategory(it.category?._id || "");
    setDescription(it.description || "");
    setOldImage(it.image_url ? `http://localhost:5001${it.image_url}` : null);
    setImagePreview(null);
    setImageFile(null);
  };

  const remove = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) return;
    try {
      const res = await fetch(`http://localhost:5001/api/product/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Lỗi khi xóa");
      await fetchProducts();
      toast.success("Đã xóa sản phẩm");
    } catch (err) {
      console.error(err);
      toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">
        Danh sách sản phẩm (tổng {allItems.length})
      </h3>

      {editingId && (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 space-y-3">
              <input
                className="w-full border rounded px-3 py-3"
                placeholder="Tên sản phẩm"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                type="number"
                className="w-full border rounded px-3 py-3"
                placeholder="Giá (VND)"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border rounded px-3 py-3"
              >
                <option value="">-- Chọn danh mục --</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full border rounded px-3 py-3"
                placeholder="Mô tả"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />

              <div>
                <label className="block text-sm font-medium mb-1">
                  Hình ảnh
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (file) {
                      setImageFile(file);
                      setImagePreview(URL.createObjectURL(file));
                      setOldImage(null);
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={resetForm}>
                  Hủy
                </Button>
                <Button onClick={submit} disabled={isLoading}>
                  {isLoading ? "Đang lưu..." : "Lưu"}
                </Button>
              </div>
            </div>

            <div>
              {imagePreview ? (
                // 🖼 Nếu vừa chọn ảnh mới
                <img
                  src={imagePreview}
                  alt="preview"
                  className="w-40 h-40 object-cover rounded border"
                />
              ) : oldImage ? (
                // 🧾 Nếu có ảnh cũ trong DB
                <img
                  src={getImageUrl(oldImage)}
                  alt="current"
                  className="w-40 h-40 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src =
                      "https://placehold.co/160x160/CCCCCC/333333?text=No+Image";
                  }}
                />
              ) : (
                // 🚫 Không có ảnh
                <div className="w-40 h-40 border flex items-center justify-center text-gray-400">
                  Chưa có ảnh
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="p-4 border rounded-lg bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th>Tên</th>
              <th>Giá</th>
              <th>Danh mục</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayedItems.map((it) => (
              <tr key={it._id} className="border-t hover:bg-gray-50">
                <td className="py-3">{it.name}</td>
                <td className="py-3">
                  {new Intl.NumberFormat("vi-VN").format(it.price)} đ
                </td>
                <td className="py-3">{it.category?.name || "—"}</td>
                <td className="py-3">
                  <div className="flex gap-2">
                    <Button onClick={() => openEdit(it._id)}>Sửa</Button>
                    <Button
                      variant="destructive"
                      onClick={() => remove(it._id)}
                    >
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ---------------------- CategoriesAdmin ---------------------- */
const CategoriesAdmin: React.FC<AdminChildProps> = () => {
  return (
    <div>
      <h3>Danh mục (Placeholder)</h3>
    </div>
  );
};

/* ---------------------- Orders & Users ---------------------- */
const OrdersAdmin: React.FC = () => (
  <div className="text-gray-600">(Placeholder) Đơn hàng</div>
);
const UsersAdmin: React.FC = () => (
  <div className="text-gray-600">(Placeholder) Người dùng</div>
);

export default Management;
