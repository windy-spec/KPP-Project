import React, { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
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

/* ---------------------- Cấu hình ---------------------- */
const sections = [
  { id: "products", label: "Sản phẩm" },
  { id: "categories", label: "Danh mục" },
  { id: "orders", label: "Đơn hàng" },
  { id: "users", label: "Người dùng" },
];

const getImageUrl = (path?: string) =>
  path ? (path.startsWith("http") ? path : `http://localhost:5001${path}`) : "";

/* ---------------------- Kiểu dữ liệu ---------------------- */
type AdminChildProps = { openFromParent?: boolean; onParentClose?: () => void };

type ProductItem = {
  _id: string;
  name: string;
  price: number;
  category?: { _id: string; name: string };
  description?: string;
  avatar?: string;
  images?: string[];
};

type Category = {
  _id: string;
  name: string;
};

/* ---------------------- Component chính ---------------------- */
const Management: React.FC = () => {
  const [active, setActive] = useState<string>("products");
  const [parentModalFor, setParentModalFor] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gray-50">
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
            <h2 className="text-2xl font-bold">
              {sections.find((s) => s.id === active)?.label}
            </h2>
            <Button
              onClick={() => setParentModalFor(active)}
              className="flex items-center gap-2"
            >
              <Plus size={16} /> Thêm
            </Button>
          </div>

          <div className="border rounded-lg p-4 bg-white">
            {active === "products" && (
              <ProductsAdmin
                openFromParent={parentModalFor === "products"}
                onParentClose={() => setParentModalFor(null)}
              />
            )}
            {active === "categories" && <CategoriesAdmin />}
            {active === "orders" && <OrdersAdmin />}
            {active === "users" && <UsersAdmin />}
          </div>
        </main>
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
  const PAGE_SIZE = 10;

  const [quantity, setQuantity] = useState<number>(1);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number>(0);
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
        const res = await fetch("http://localhost:5001/api/category");
        setCategories(await res.json());
      } catch {
        toast.error("Không tải được danh mục");
      }
    };
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `http://localhost:5001/api/product/partition?page=${page}&limit=${PAGE_SIZE}`
      );
      const data = await res.json();
      setAllItems(data.products || []);
      setTotalPages(data.totalPages || 1);
    } catch {
      toast.error("Không thể tải sản phẩm");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const submit = async () => {
    if (!name || !category) {
      toast.error("Vui lòng nhập đủ thông tin sản phẩm");
      return;
    }

    const endpoint = editingId
      ? `http://localhost:5001/api/product/${editingId}`
      : "http://localhost:5001/api/product";

    const method = editingId ? "PUT" : "POST";
    const message = editingId
      ? "Cập nhật sản phẩm thành công"
      : "Thêm sản phẩm thành công";

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
      toast.success(message);
      resetForm();
      await fetchProducts();
    } catch {
      toast.error("Lưu sản phẩm thất bại");
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
    setOldAvatar(it.avatar || "");
    setOldImages(it.images || []);
    setAvatarFile(null);
    setAvatarPreview("");
    setImageFiles([]);
    setImagePreviews([]);
  };

  const remove = async (id: string) => {
    try {
      await fetch(`http://localhost:5001/api/product/${id}`, {
        method: "DELETE",
      });
      toast.success("Đã xóa sản phẩm");
      fetchProducts();
    } catch {
      toast.error("Xóa thất bại");
    }
  };

  const renderForm = (title: string) => (
    <div className="p-6 border rounded-lg bg-white shadow-sm mb-6">
      <h3 className="font-bold text-xl mb-4 text-orange-600">{title}</h3>
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
          <input
            type="number"
            className="w-full border rounded px-3 py-3"
            placeholder="Số lượng"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
          />

          {/* Ảnh đại diện */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Ảnh đại diện
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setAvatarFile(file);
                    setAvatarPreview(URL.createObjectURL(file));
                    setOldAvatar("");
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => avatarInputRef.current?.click()}
              >
                Chọn ảnh
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview("");
                  setOldAvatar("");
                  if (avatarInputRef.current) avatarInputRef.current.value = "";
                }}
                disabled={!avatarFile && !avatarPreview && !oldAvatar}
              >
                Xóa
              </Button>
            </div>

            <div className="mt-3">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="preview"
                  className="w-40 h-40 object-cover rounded border"
                />
              ) : oldAvatar ? (
                <img
                  src={getImageUrl(oldAvatar)}
                  alt="old avatar"
                  className="w-40 h-40 object-cover rounded border"
                />
              ) : (
                <div className="w-40 h-40 border flex items-center justify-center text-gray-400">
                  Chưa có ảnh
                </div>
              )}
            </div>
          </div>

          {/* Ảnh chi tiết */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Ảnh chi tiết (gallery)
            </label>
            <div className="flex items-center gap-3">
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  setImageFiles(files);
                  setImagePreviews(files.map((f) => URL.createObjectURL(f)));
                  setOldImages([]);
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => galleryInputRef.current?.click()}
              >
                Chọn ảnh
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setImageFiles([]);
                  setImagePreviews([]);
                  setOldImages([]);
                  if (galleryInputRef.current)
                    galleryInputRef.current.value = "";
                }}
                disabled={
                  imageFiles.length === 0 &&
                  imagePreviews.length === 0 &&
                  oldImages.length === 0
                }
              >
                Xóa
              </Button>
              <span className="text-sm text-gray-600">
                {imageFiles.length > 0
                  ? `${imageFiles.length} ảnh`
                  : oldImages.length > 0
                  ? "Đang dùng ảnh cũ"
                  : "Chưa chọn ảnh"}
              </span>
            </div>

            <div className="flex gap-3 flex-wrap mt-3">
              {imagePreviews.length > 0
                ? imagePreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="preview"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  ))
                : oldImages.map((img, i) => (
                    <img
                      key={i}
                      src={getImageUrl(img)}
                      alt="old"
                      className="w-32 h-32 object-cover rounded border"
                    />
                  ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onParentClose && onParentClose();
              }}
            >
              Hủy
            </Button>
            <Button onClick={submit} disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu"}
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
          <h3 className="font-semibold text-lg mb-2">
            Danh sách sản phẩm ({allItems.length})
          </h3>
          <div className="p-4 border rounded-lg bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-600">
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Giá</th>
                  <th>Danh mục</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {allItems.map((it) => (
                  <tr key={it._id} className="border-t hover:bg-gray-50">
                    <td className="py-3">
                      {it.avatar && (
                        <img
                          src={getImageUrl(it.avatar)}
                          alt={it.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                    </td>
                    <td className="py-3">{it.name}</td>
                    <td className="py-3">
                      {new Intl.NumberFormat("vi-VN").format(it.price)} đ
                    </td>
                    <td className="py-3">{it.category?.name || "—"}</td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button onClick={() => openEdit(it._id)}>Sửa</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive">Xóa</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Hành động này sẽ xóa vĩnh viễn sản phẩm{" "}
                                <b>{it.name}</b>. Bạn có chắc chắn muốn tiếp
                                tục?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Hủy</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => remove(it._id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Xóa
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Trang {page}/{totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => goToPage(page - 1)}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    disabled={page === totalPages}
                    onClick={() => goToPage(page + 1)}
                  >
                    Tiếp
                  </Button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

/* ---------------------- Placeholder ---------------------- */
const CategoriesAdmin = () => <div>Danh mục (Placeholder)</div>;
const OrdersAdmin = () => <div>Đơn hàng (Placeholder)</div>;
const UsersAdmin = () => <div>Người dùng (Placeholder)</div>;

export default Management;
