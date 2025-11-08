// frontend/src/components/Admin/SaleProgramForm.tsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

type Props = { editing?: any | null; onClose: () => void };

// Cần định nghĩa Discount type đầy đủ
type Discount = {
  _id: string;
  name: string;
  type: "SALE" | "AGENCY";
  discount_percent: number;
  start_sale: string;
  end_sale: string;
  program_id: string | null;
};

const SaleProgramForm: React.FC<Props> = ({ editing, onClose }) => {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [startDate, setStartDate] = useState(
    editing ? (editing.start_date || "").slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    editing ? (editing.end_date || "").slice(0, 10) : ""
  );
  const [bannerImage, setBannerImage] = useState(editing?.banner_image || "");
  const token = localStorage.getItem("accessToken");
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const [allDiscounts, setAllDiscounts] = useState<Discount[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>(
    editing?.discounts.map((d: any) => d._id || d) || []
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);
  const [typeFilter, setTypeFilter] = useState<"SALE" | "AGENCY">("SALE");
  const [discountToAdd, setDiscountToAdd] = useState<string>("");

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/discount", {
        ...authHeaders,
        params: { cache: "no-store" },
      });
      let discountData: Discount[] = [];
      if (Array.isArray(res.data)) {
        discountData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        discountData = res.data.data;
      } else if (res.data && Array.isArray(res.data.discounts)) {
        discountData = res.data.discounts;
      }
      setAllDiscounts(discountData);
    } catch (err) {
      console.error("Lỗi khi tải discounts:", err);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      description,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      discounts: selectedDiscounts,
      isActive,
      banner_image: bannerImage,
    };
    if (editing) {
      await axios.put(
        `http://localhost:5001/api/saleprogram/${editing._id}`,
        payload,
        authHeaders
      );
    } else {
      await axios.post(
        "http://localhost:5001/api/saleprogram",
        payload,
        authHeaders
      );
    }
    onClose();
  }; // Logic lọc nâng cao

  const availableDiscounts = useMemo(() => {
    const p_start = startDate ? new Date(startDate) : null;
    const p_end = endDate
      ? new Date(new Date(endDate).getTime() + 86400000)
      : null;
    const currentProgramId = editing?._id;

    return allDiscounts.filter((d) => {
      // Lọc theo loại (SALE/AGENCY)
      if (d.type !== typeFilter) return false; // Lọc theo "đã chọn" (trong lần này)
      if (selectedDiscounts.includes(d._id)) return false; // LỌC MỚI: LỌC DISCOUNT ĐÃ CÓ CHỦ

      if (d.program_id && d.program_id !== currentProgramId) {
        return false;
      } // Lọc theo ngày (Discount phải nằm TRONG Program)

      const d_start = new Date(d.start_sale);
      const d_end = d.end_sale ? new Date(d.end_sale) : null;
      if (p_start && d_start < p_start) return false;
      if (p_end && (!d_end || d_end > p_end)) return false;
      return true;
    });
  }, [
    allDiscounts,
    typeFilter,
    selectedDiscounts,
    startDate,
    endDate,
    editing,
  ]);

  const selectedDiscountsFull = useMemo(() => {
    return selectedDiscounts
      .map((id) => allDiscounts.find((d) => d._id === id))
      .filter((d): d is Discount => !!d);
  }, [selectedDiscounts, allDiscounts]);

  const handleAddDiscount = () => {
    if (discountToAdd && !selectedDiscounts.includes(discountToAdd)) {
      setSelectedDiscounts([...selectedDiscounts, discountToAdd]);
      setDiscountToAdd("");
    }
  };

  const handleRemoveDiscount = (idToRemove: string) => {
    setSelectedDiscounts(selectedDiscounts.filter((id) => id !== idToRemove));
  };

  return (
    <div className="fixed inset-0 flex justify-center items-start bg-black/20 p-6 overflow-y-auto z-50">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-lg mt-10">
        <h3 className="font-semibold text-lg mb-4">
          {editing ? "Chỉnh sửa chương trình" : "Tạo mới chương trình"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hàng 1: Tên, Mô tả */}
          <div>
            <label className="block text-sm">Tên chương trình</label>

            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-2 py-1"
              required
            />
          </div>
          <div>
            <label className="block text-sm">Mô tả</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>
          {/* Hàng 2: Banner Image URL */}
          <div>
            <label className="block text-sm">Banner Image URL (tùy chọn)</label>

            <input
              value={bannerImage}
              onChange={(e) => setBannerImage(e.target.value)}
              className="w-full border rounded px-2 py-1"
              placeholder="https://example.com/image.png"
            />
          </div>
          {/* Hàng 3: Ngày */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Ngày bắt đầu</label>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>

            <div>
              <label className="block text-sm">Ngày kết thúc</label>

              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded px-2 py-1"
                required
              />
            </div>
          </div>
          {/* Khu vực Discount đã chọn */}
          <div>
            <label className="block text-sm font-medium">
              Các Discount đã thêm
            </label>

            <div className="border rounded p-2 mt-1 min-h-[50px] space-y-1">
              {selectedDiscountsFull.length === 0 && (
                <p className="text-sm text-gray-500">Chưa có discount nào</p>
              )}

              {selectedDiscountsFull.map((d) => (
                <div
                  key={d._id}
                  className="flex justify-between items-center bg-gray-100 p-1 rounded"
                >
                  <span className="text-sm">{d.name}</span>

                  <button
                    type="button"
                    onClick={() => handleRemoveDiscount(d._id)}
                    className="text-red-500 hover:text-red-700 font-bold px-2"
                  >
                     Xóa
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Bộ lọc RADIO */}
          <div>
            <label className="block text-sm font-medium">
              Lọc để thêm Discount
            </label>

            <div className="flex gap-4 mt-1">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="discountType"
                  value="SALE"
                  checked={typeFilter === "SALE"}
                  onChange={() => setTypeFilter("SALE")}
                />
                SALE
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="discountType"
                  value="AGENCY"
                  checked={typeFilter === "AGENCY"}
                  onChange={() => setTypeFilter("AGENCY")}
                />{" "}
                AGENCY
              </label>
            </div>
          </div>
          {/* Dropdown "Thêm discount" */}
          <div className="flex items-end gap-2">
            <div className="flex-grow">
              <label className="block text-sm">Chọn discount để thêm</label>

              <select
                value={discountToAdd}
                onChange={(e) => setDiscountToAdd(e.target.value)}
                className="w-full border rounded px-2 py-1.5"
              >
                <option value="">— Chọn —</option>

                {availableDiscounts.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name} (
                    {d.discount_percent
                      ? `${d.discount_percent}%`
                      : "Bậc thang"}
                    )
                  </option>
                ))}

                {availableDiscounts.length === 0 && (
                  <option disabled>Không có discount nào khớp</option>
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={handleAddDiscount}
              disabled={!discountToAdd}
              className="bg-green-500 text-white px-4 py-1.5 rounded disabled:opacity-50"
            >
              Thêm
            </button>
          </div>
          {/* Nút cuối */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Kích hoạt
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
              >
                Hủy
              </button>

              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded"
              >
                Lưu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleProgramForm;
