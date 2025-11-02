// frontend/src/pages/AdminPage/SaleAdminPage.tsx
import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { toast } from "sonner";

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
  });

  // search & pagination
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5001/api/discount", {
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setDiscounts(data);
    } catch (err) {
      console.error(err);
      toast.error("Không tải được danh sách discount");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
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
    });
    setOpenModal(true);
  };

  // open edit modal
  const openEdit = (d: Discount) => {
    // normalize tiers: ensure tiers is Tier[] (API returns populated tiers objects)
    const normalized: Discount = {
      ...d,
      tiers: Array.isArray(d.tiers)
        ? (d.tiers as any[])
            .map((t) =>
              typeof t === "string"
                ? null
                : {
                    condition_type: t.condition_type,
                    min_value: t.min_value,
                    percent: t.percent,
                  }
            )
            .filter(Boolean)
        : [],
    };
    setEditing(d);
    setForm(normalized);
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
    try {
      const payload: any = { ...form };
      // if no tiers, we may keep discount_percent fallback
      if (
        !payload.tiers ||
        (Array.isArray(payload.tiers) && payload.tiers.length === 0)
      ) {
        // allow discount_percent to be used
      }
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
    if (!confirm("Bạn có chắc chắn muốn xoá discount này?")) return;
    const token = localStorage.getItem("accessToken");
    try {
      const res = await fetch(`http://localhost:5001/api/discount/${id}`, {
        method: "DELETE",
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err?.message || "Xóa thất bại");
      } else {
        toast.success("Đã xóa");
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
                            {t.condition_type === "QUANTITY"
                              ? `Mua >= ${t.min_value}`
                              : `Đơn >= ${t.min_value}`}{" "}
                            → {t.percent}%
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">Không có</span>
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
                        Xóa
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
                  onChange={(e) =>
                    setForm({ ...form, target_type: e.target.value as any })
                  }
                >
                  <option value="PRODUCT">PRODUCT</option>
                  <option value="CATEGORY">CATEGORY</option>
                  <option value="ORDER_TOTAL">ORDER_TOTAL</option>
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

              {/* Tiers list */}
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
