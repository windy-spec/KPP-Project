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
  tiers?: Tier[] | string[];
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

  // search & phân trang
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // --- LẤY DATA ---
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/discount", {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        setDiscounts(data);
      } else if (data && Array.isArray(data.discounts)) {
        setDiscounts(data.discounts);
      } else if (data && Array.isArray(data.data)) {
        setDiscounts(data.data);
      } else {
        setDiscounts([]);
      }
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
      const prodData = await prodRes.json();
      const catData = await catRes.json();

      if (Array.isArray(prodData)) setProducts(prodData);
      else if (prodData?.products) setProducts(prodData.products);
      else if (prodData?.data) setProducts(prodData.data);
      else setProducts([]);

      if (Array.isArray(catData)) setCategories(catData);
      else if (catData?.categories) setCategories(catData.categories);
      else if (catData?.data) setCategories(catData.data);
      else setCategories([]);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách sản phẩm/danh mục");
    }
  };

  useEffect(() => {
    fetchDiscounts();
    fetchSelectData();
  }, []);

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

    const formattedDiscount = {
      ...d,
      start_sale: d.start_sale
        ? new Date(d.start_sale).toISOString().slice(0, 10)
        : "",
      end_sale: d.end_sale
        ? new Date(d.end_sale).toISOString().slice(0, 10)
        : "",
      tiers: normalizedTiers,
    };

    setEditing(d);
    setForm(formattedDiscount);
    setOpenModal(true);
  };

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

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("accessToken");

    const formattedTiers = ((form.tiers as Tier[]) || []).map((t) => ({
      min_quantity: t.min_value,
      discount_percent: t.percent,
    }));

    const { tiers, ...restOfForm } = form;
    const payload = { ...restOfForm, tiers: formattedTiers };

    try {
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
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Lỗi khi lưu");
      } else {
        toast.success(
          editing ? "Cập nhật thành công" : "Tạo discount thành công"
        );
        setOpenModal(false);
        setQuery("");
        setPage(1);
        await fetchDiscounts();
      }
    } catch (err) {
      console.error(err);
      toast.error("Lỗi khi lưu discount");
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    const result = await Swal.fire({
      title: "Bạn có chắc chắn?",
      text: "Bạn sẽ XÓA VĨNH VIỄN discount này! Không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Vâng, xóa vĩnh viễn!",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

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
      <div className="max-w-[95%] mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Quản lý Chương trình Khuyến mãi
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                className="border border-gray-300 rounded-lg pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 w-64 transition-all"
                placeholder="Tìm theo tên hoặc loại..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <span className="absolute right-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              onClick={openCreate}
              className="bg-orange-600 hover:bg-orange-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
            >
              <span>+</span> Tạo mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <p className="text-gray-500">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-xl shadow-md border border-gray-100">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">Tên</th>
                  <th className="px-6 py-4 whitespace-nowrap">Loại</th>
                  <th className="px-6 py-4 whitespace-nowrap">Áp dụng cho</th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">
                    % Giảm
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">Bắt đầu</th>
                  <th className="px-6 py-4 whitespace-nowrap">Kết thúc</th>
                  <th className="px-6 py-4 whitespace-nowrap min-w-[200px]">
                    Tiers (Mức giảm)
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap text-center">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageData.map((d) => (
                  <tr
                    key={d._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {d.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
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
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {d.target_type}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-orange-600">
                      {d.discount_percent ? `${d.discount_percent}%` : "-"}
                    </td>

                    {/* Ngày bắt đầu */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {d.start_sale
                        ? new Date(d.start_sale).toLocaleDateString("vi-VN")
                        : "-"}
                    </td>

                    {/* Ngày kết thúc */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {d.end_sale ? (
                        new Date(d.end_sale).toLocaleDateString("vi-VN")
                      ) : (
                        <span className="text-green-600 font-medium text-xs">
                          ♾️ Vĩnh viễn
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {d.tiers && (d.tiers as any[]).length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {(d.tiers as any[]).map((t: any, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200"
                            >
                              🛒 Mua &ge; {t.min_quantity}{" "}
                              <span className="mx-1 text-gray-400">→</span>{" "}
                              <b className="text-red-500">
                                Giảm {t.discount_percent}%
                              </b>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          Không có bậc thang
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {d.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                          Hoạt động
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <span className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-1.5"></span>
                          Đã ẩn
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEdit(d)}
                          className="p-1.5 text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Chỉnh sửa"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(d._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Xóa vĩnh viễn"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pageData.length === 0 && (
              <div className="text-center py-10">
                <p className="text-gray-400">Không tìm thấy dữ liệu nào.</p>
              </div>
            )}
          </div>
        )}

        {/* Phân trang */}
        <div className="flex items-center justify-between mt-6 px-2">
          <div className="text-sm text-gray-500">
            Hiển thị <span className="font-medium">{pageData.length}</span> trên
            tổng số <span className="font-medium">{filtered.length}</span> kết
            quả
          </div>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Trước
            </button>
            <span className="text-sm font-medium px-2">
              Trang {page} / {totalPages}
            </span>
            <button
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Sau
            </button>
          </div>
        </div>
      </div>

      {/* Modal Form */}
      {openModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6 mt-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editing ? "Chỉnh sửa Chương trình" : "Tạo Chương trình Mới"}
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitForm} className="space-y-4">
              {/* Row 1: Tên & Loại */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên chương trình
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    placeholder="Nhập tên..."
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as any })
                    }
                  >
                    <option value="SALE">SALE (Giảm giá thường)</option>
                    <option value="AGENCY">AGENCY (Đại lý)</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Target */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Áp dụng cho
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    value={form.target_type}
                    onChange={(e) => {
                      const newTargetType = e.target.value as any;
                      setForm({
                        ...form,
                        target_type: newTargetType,
                        target_id: null,
                        tiers:
                          newTargetType === "ORDER_TOTAL" ? [] : form.tiers,
                      });
                    }}
                  >
                    <option value="PRODUCT">Sản phẩm cụ thể</option>
                    <option value="CATEGORY">Danh mục</option>
                    <option value="ORDER_TOTAL">Tổng đơn hàng</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Đối tượng
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all disabled:bg-gray-100"
                    value={form.target_id || ""}
                    onChange={(e) =>
                      setForm({ ...form, target_id: e.target.value || null })
                    }
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
                      <option value="">(Áp dụng toàn bộ đơn)</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Row 3: Percent & Date */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    % Giảm (Cơ bản)
                  </label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.start_sale ? form.start_sale.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm({ ...form, start_sale: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 outline-none"
                    value={form.end_sale ? form.end_sale.slice(0, 10) : ""}
                    onChange={(e) =>
                      setForm({ ...form, end_sale: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="h-5 w-5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
                  checked={form.isActive ?? true}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                <label
                  htmlFor="isActive"
                  className="text-sm font-medium text-gray-800 cursor-pointer"
                >
                  Kích hoạt chương trình ngay lập tức
                </label>
              </div>

              {/* Tiers Section */}
              {form.target_type !== "ORDER_TOTAL" && (
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <label className="font-bold text-gray-700 text-sm">
                      ⚡ Mức giảm theo số lượng (Tiers)
                    </label>
                    <button
                      type="button"
                      onClick={addTier}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      + Thêm mức
                    </button>
                  </div>
                  <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
                    {((form.tiers as Tier[]) || []).map((t, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-6 gap-2 items-center bg-gray-50 p-2 rounded border"
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
                          className="col-span-2 border p-1.5 rounded text-sm"
                        >
                          <option value="QUANTITY">Số lượng &ge;</option>
                          <option value="TOTAL_PRICE">Tổng tiền &ge;</option>
                        </select>
                        <input
                          type="number"
                          value={t.min_value}
                          onChange={(e) =>
                            updateTier(idx, "min_value", Number(e.target.value))
                          }
                          className="col-span-2 border p-1.5 rounded text-sm"
                          placeholder="Giá trị"
                        />
                        <div className="col-span-1 relative">
                          <input
                            type="number"
                            value={t.percent}
                            onChange={(e) =>
                              updateTier(idx, "percent", Number(e.target.value))
                            }
                            className="w-full border p-1.5 rounded text-sm text-center font-bold text-orange-600"
                          />
                          <span className="absolute right-1 top-1.5 text-xs text-gray-400">
                            %
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTier(idx)}
                          className="col-span-1 text-red-500 hover:bg-red-100 p-1.5 rounded text-xs font-bold"
                        >
                          Xóa
                        </button>
                      </div>
                    ))}
                    {((form.tiers as Tier[]) || []).length === 0 && (
                      <div className="text-sm text-gray-400 italic text-center py-2">
                        Chưa có mức giảm giá nào
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Form Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t mt-6">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                >
                  Huỷ bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium shadow-sm transition-colors"
                >
                  {editing ? "Lưu thay đổi" : "Tạo mới"}
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
