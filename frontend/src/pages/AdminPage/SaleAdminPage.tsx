// frontend/src/pages/AdminPage/SaleAdminPage.tsx
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { toast } from "sonner";
import Swal from "sweetalert2";
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
  tiers?: Tier[] | string[]; // when fetched, tiers are objects (populated) or ids
};

const PAGE_SIZE = 10;

const SaleAdminPage: React.FC = () => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);

  // modal state
  const [openModal, setOpenModal] = useState(false);
  const [editing, setEditing] = useState<Discount | null>(null);

  // form state
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

  // search & pagination
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/discount", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store", // <-- FIX 1: Thêm dòng này để chống caching
      });
      const data = await res.json();

      // === FIX 2: Thêm logic parsing an toàn ===
      if (Array.isArray(data)) {
        setDiscounts(data);
      } else if (data && Array.isArray(data.discounts)) {
        // Nếu API trả về { discounts: [...] }
        setDiscounts(data.discounts);
      } else if (data && Array.isArray(data.data)) {
        // Nếu API trả về { data: [...] }
        setDiscounts(data.data);
      } else {
        setDiscounts([]);
      }
      // === Kết thúc FIX 2 ===
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách discount");
    } finally {
      setLoading(false);
    }
  };
  const fetchSelectData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("http://localhost:5001/api/product"),
        fetch("http://localhost:5001/api/category"),
      ]);
      if (!prodRes.ok || !catRes.ok) {
        throw new Error("Failed to fetch product/category data");
      }

      const prodData = await prodRes.json();
      const catData = await catRes.json();

      // === BẮT ĐẦU SỬA ===
      // Kiểm tra xem prodData có phải là mảng không
      if (Array.isArray(prodData)) {
        setProducts(prodData);
      }
      // Kiểm tra xem nó có được bọc trong key 'products' không
      else if (prodData && Array.isArray(prodData.products)) {
        setProducts(prodData.products);
      }
      // Kiểm tra xem nó có được bọc trong key 'data' không
      else if (prodData && Array.isArray(prodData.data)) {
        setProducts(prodData.data);
      }
      // Nếu không thì fallback về mảng rỗng
      else {
        setProducts([]);
      }

      // Làm tương tự cho categories
      if (Array.isArray(catData)) {
        setCategories(catData);
      } else if (catData && Array.isArray(catData.categories)) {
        setCategories(catData.categories);
      } else if (catData && Array.isArray(catData.data)) {
        setCategories(catData.data);
      } else {
        setCategories([]);
      }
      // === KẾT THÚC SỬA ===
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách sản phẩm/danh mục");
    }
  };
  useEffect(() => {
    fetchDiscounts();
    fetchSelectData();
  }, []);

  // open create modal
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

  // open edit modal
  const openEdit = (d: Discount) => {
    // 1. Normalize tiers (bạn đã làm)
    const normalizedTiers = Array.isArray(d.tiers)
      ? (d.tiers as any[])
          .map((t) =>
            typeof t === "string"
              ? null
              : {
                  // === SỬA TÊN TRƯỜNG KHI ĐỌC VÀO ===
                  condition_type: t.condition_type || "QUANTITY", // (Giả sử)
                  min_value: t.min_quantity, // <-- Đổi t.min_value
                  percent: t.discount_percent, // <-- Đổi t.percent
                }
          )
          .filter(Boolean)
      : [];

    // 2. Format lại toàn bộ object cho Form
    const formattedDiscount = {
      ...d,
      // === FORMAT DATE CHO Ô INPUT ===
      start_sale: d.start_sale
        ? new Date(d.start_sale).toISOString().slice(0, 10)
        : "",
      end_sale: d.end_sale
        ? new Date(d.end_sale).toISOString().slice(0, 10)
        : "",
      // === GÁN LẠI TIERS ĐÃ CHUẨN HÓA ===
      tiers: normalizedTiers,
    };

    setEditing(d);
    setForm(formattedDiscount); // <-- Dùng object đã format
    setOpenModal(true);
  };

  // Add/Remove tier in form
  const addTier = () => {
    setForm((prev) => ({
      ...prev,
      tiers: [
        ...(prev.tiers as Tier[]),
        { condition_type: "QUANTITY", min_value: 1, percent: 5 },
      ],
    }));
  };
  const removeTier = (index: number) => {
    setForm((prev) => ({
      ...prev,
      tiers: (prev.tiers as Tier[]).filter((_, i) => i !== index),
    }));
  };
  const updateTier = (index: number, key: keyof Tier, value: any) => {
    setForm((prev) => {
      const t = [...((prev.tiers as Tier[]) || [])];
      t[index] = { ...t[index], [key]: value };
      return { ...prev, tiers: t };
    });
  };

  // Submit create/update
  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    // === BẮT ĐẦU SỬA ĐỔI ===

    // 1. "Dịch" lại mảng tiers từ FE -> BE
    const formattedTiers = ((form.tiers as Tier[]) || []).map((t) => ({
      min_quantity: t.min_value, // <-- Đổi 'min_value' thành 'min_quantity'
      discount_percent: t.percent, // <-- Đổi 'percent' thành 'discount_percent'
      // Lưu ý: 'condition_type' sẽ bị bỏ qua
    }));

    // 2. Tách mảng 'tiers' gốc ra khỏi 'form'
    const { tiers, ...restOfForm } = form;

    // 3. Tạo payload cuối cùng để gửi đi
    const payload = {
      ...restOfForm, // Gồm: name, type, target_type, target_id...
      tiers: formattedTiers, // Sử dụng mảng tiers đã được "dịch"
    };

    // === KẾT THÚC SỬA ĐỔI ===

    try {
      // Logic gửi request (bạn đã làm ở tin nhắn trước)
      const method = editing ? "PUT" : "POST";
      const url = editing
        ? `http://localhost:5001/api/discount/${editing!._id}`
        : "http://localhost:5001/api/discount";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify(payload), // <-- Gửi payload đã được "dịch"
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Lỗi khi lưu");
      } else {
        toast.success(
          editing ? "Cập nhật thành công" : "Tạo discount thành công"
        );
        setOpenModal(false);
        setQuery(""); // Reset thanh tìm kiếm
        setPage(1); // Đưa về trang 1
        await fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu discount");
    }
  };

  // Delete
  const handleDelete = async (id?: string) => {
    if (!id) return;

    // === BẮT ĐẦU THAY THẾ ===
    // Dùng Swal.fire() thay cho confirm()
    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Bạn sẽ XÓA VĨNH VIỄN discount này! Không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // Màu đỏ cho nút xóa
      cancelButtonColor: "#3085d6", // Màu xanh cho nút hủy
      confirmButtonText: "Vâng, xóa vĩnh viễn!",
      cancelButtonText: "Hủy",
    });

    // Nếu người dùng bấm "Hủy" (hoặc đóng)
    if (!result.isConfirmed) {
      return;
    }
    // === KẾT THÚC THAY THẾ ===

    // Logic xóa giữ nguyên
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(
        `http://localhost:5001/api/discount/hard-delete/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: token ? `Bearer ${token}` : "" },
        }
      );

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Xóa thất bại");
      } else {
        toast.success("Đã xóa vĩnh viễn");
        fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Xảy ra lỗi");
    }
  };
  // filtered & pagination
  const filtered = discounts.filter((d) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      (d.name || "").toLowerCase().includes(q) ||
      (d.type || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageData = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold">Quản lý Discount</h1>
          <div className="flex items-center gap-3">
            <input
              className="border rounded px-3 py-1"
              placeholder="Tìm theo tên hoặc loại..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button
              onClick={openCreate}
              className="bg-orange-500 text-white px-4 py-2 rounded"
            >
              Tạo mới
            </button>
          </div>
        </div>

        {loading ? (
          <p>Đang tải...</p>
        ) : (
          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="min-w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Tên</th>
                  <th className="p-3 text-left">Loại</th>
                  <th className="p-3 text-left">Áp dụng cho</th>
                  <th className="p-3 text-left">% cơ bản</th>
                  <th className="p-3 text-left">Tiers</th>
                  <th className="p-3 text-left">Trạng thái</th>
                  <th className="p-3 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {pageData.map((d) => (
                  <tr key={d._id} className="border-t">
                    <td className="p-3">{d.name}</td>
                    <td className="p-3">{d.type}</td>
                    <td className="p-3">{d.target_type}</td>
                    <td className="p-3">{d.discount_percent ?? "-"}</td>
                    <td className="p-3">
                      {d.tiers && (d.tiers as any[]).length > 0 ? (
                        (d.tiers as any[]).map((t: any, i: number) => (
                          <div key={i} className="text-sm">
                            {/* API (t) không có 'condition_type' hoặc 'min_value'.
                           Nó có 'min_quantity' và 'discount_percent'.
                            Chúng ta sẽ hiển thị theo tên trường đúng từ API.
                            */}
                            {`Mua >= ${t.min_quantity}`} → {t.discount_percent}%
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Không có</span>
                      )}
                    </td>
                    <td className="p-3">
                      {d.isActive ? (
                        <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Đang hoạt động
                        </span>
                      ) : (
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          Đã ẩn
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => openEdit(d)}
                        className="px-3 py-1 bg-yellow-400 rounded mr-2"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(d._id)}
                        className="px-3 py-1 bg-red-500 text-white rounded"
                      >
                        Xoá{" "}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <small>{filtered.length} kết quả</small>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-2"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              {page} / {totalPages}
            </span>
            <button
              className="px-2"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modal (Create / Edit) */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 p-6">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editing ? "Chỉnh sửa Discount" : "Tạo Discount"}
              </h3>
              <button onClick={() => setOpenModal(false)} className="text-sm">
                Đóng
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input
                  className="border p-2 rounded"
                  placeholder="Tên"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <select
                  className="border p-2 rounded"
                  value={form.type}
                  onChange={(e) =>
                    setForm({ ...form, type: e.target.value as any })
                  }
                >
                  <option value="SALE">SALE</option>
                  <option value="AGENCY">AGENCY</option>
                </select>
                <select
                  className="border p-2 rounded"
                  value={form.target_type}
                  onChange={(e) => {
                    const newTargetType = e.target.value as any;
                    setForm({
                      ...form,
                      target_type: newTargetType,
                      target_id: null,
                      // Nếu là ORDER_TOTAL, tự động xóa hết tier
                      tiers: newTargetType === "ORDER_TOTAL" ? [] : form.tiers,
                    });
                  }}
                >
                  <option value="PRODUCT">PRODUCT</option>
                  <option value="CATEGORY">CATEGORY</option>
                  <option value="ORDER_TOTAL">ORDER_TOTAL</option>
                </select>
                {/* 2. THÊM DROPDOWN MỚI NÀY VÀO */}
                <select
                  className="border p-2 rounded"
                  value={form.target_id || ""}
                  onChange={(e) =>
                    setForm({ ...form, target_id: e.target.value || null })
                  }
                  // Vô hiệu hóa khi áp dụng cho tổng đơn
                  disabled={form.target_type === "ORDER_TOTAL"}
                  required={form.target_type !== "ORDER_TOTAL"}
                >
                  <option value="">— Chọn đối tượng —</option>
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
                  {form.target_type === "ORDER_TOTAL" && (
                    <option value="">(Áp dụng tổng đơn)</option>
                  )}
                </select>
                <input
                  type="number"
                  className="border p-2 rounded"
                  placeholder="% giảm cơ bản (tùy chọn)"
                  value={form.discount_percent ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_percent: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full mt-1"
                    value={form.start_sale ? form.start_sale.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm({ ...form, start_sale: e.target.value })
                    }
                    required // <-- Rất quan trọng vì schema yêu cầu
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ngày kết thúc (tùy chọn)
                  </label>
                  <input
                    type="date"
                    className="border p-2 rounded w-full mt-1"
                    value={form.end_sale ? form.end_sale.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm({ ...form, end_sale: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={form.isActive ?? true} // Mặc định là true
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-900"
                >
                  Kích hoạt (cho phép discount này hoạt động)
                </label>
              </div>
              {/* Tiers list */}
              {form.target_type !== "ORDER_TOTAL" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="font-medium">
                      Discount tiers (mức giảm theo điều kiện)
                    </label>
                    <button
                      type="button"
                      onClick={addTier}
                      className="text-sm bg-green-500 text-white px-3 py-1 rounded"
                    >
                      Thêm tier
                    </button>
                  </div>
                  <div className="space-y-2">
                    {((form.tiers as Tier[]) || []).map((t, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-6 gap-2 items-center"
                      >
                        <select
                          value={t.condition_type}
                          onChange={(e) =>
                            updateTier(
                              idx,
                              "condition_type",
                              e.target.value as any
                            )
                          }
                          className="col-span-2 border p-2 rounded"
                        >
                          <option value="QUANTITY">Số lượng</option>
                          <option value="TOTAL_PRICE">Tổng tiền</option>
                        </select>
                        <input
                          type="number"
                          value={t.min_value}
                          onChange={(e) =>
                            updateTier(idx, "min_value", Number(e.target.value))
                          }
                          className="col-span-2 border p-2 rounded"
                        />
                        <input
                          type="number"
                          value={t.percent}
                          onChange={(e) =>
                            updateTier(idx, "percent", Number(e.target.value))
                          }
                          className="col-span-1 border p-2 rounded"
                        />
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className="col-span-1 bg-red-500 text-white p-2 rounded"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    {((form.tiers as Tier[]) || []).length === 0 && (
                      <div className="text-sm text-gray-500">Chưa có tier</div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 border rounded"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded"
                >
                  {editing ? "Cập nhật" : "Tạo mới"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default SaleAdminPage;
