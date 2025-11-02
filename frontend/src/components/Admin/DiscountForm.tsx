import React, { useEffect, useState } from "react";
import axios from "axios";

type Props = { editing?: any | null; onClose: () => void };

const DiscountForm: React.FC<Props> = ({ editing, onClose }) => {
  const [name, setName] = useState(editing?.name || "");
  const [type, setType] = useState(editing?.type || "SALE");
  const [promotionType, setPromotionType] = useState(
    editing?.promotion_type || "GENERAL"
  );
  const [targetType, setTargetType] = useState(
    editing?.target_type || "PRODUCT"
  );
  const [targetId, setTargetId] = useState(editing?.target_id || "");
  const [discountPercent, setDiscountPercent] = useState(
    editing?.discount_percent || 0
  );
  const [minQuantity, setMinQuantity] = useState(editing?.min_quantity || 1);
  const [startSale, setStartSale] = useState(
    editing ? editing.start_sale.slice(0, 10) : ""
  );
  const [endSale, setEndSale] = useState(
    editing ? editing.end_sale.slice(0, 10) : ""
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchSelectData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get("http://localhost:5001/api/product"),
        axios.get("http://localhost:5001/api/category"),
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSelectData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      type,
      promotion_type: promotionType,
      target_type: targetType,
      target_id: targetId || null,
      discount_percent: discountPercent,
      min_quantity: minQuantity,
      start_sale: new Date(startSale),
      end_sale: new Date(endSale),
      isActive,
    };

    if (editing) {
      await axios.put(
        `http://localhost:5001/api/discount/${editing._id}`,
        payload
      );
    } else {
      await axios.post("http://localhost:5001/api/discount", payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 flex items-start justify-center p-6">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-xl">
        <h3 className="text-lg font-semibold mb-3">
          {editing ? "Chỉnh sửa Discount" : "Tạo Discount mới"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Tên discount</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-2 py-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Loại (SALE/AGENCY)</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="SALE">SALE</option>
                <option value="AGENCY">AGENCY</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Kiểu khuyến mãi</label>
              <select
                value={promotionType}
                onChange={(e) => setPromotionType(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="GENERAL">GENERAL</option>
                <option value="FLASHSALE">FLASHSALE</option>
                <option value="SEASONAL">SEASONAL</option>
                <option value="COMBO">COMBO</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Áp dụng cho</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="PRODUCT">PRODUCT</option>
                <option value="CATEGORY">CATEGORY</option>
                <option value="ORDER_TOTAL">ORDER_TOTAL</option>
              </select>
            </div>
            <div>
              <label className="block text-sm">Đối tượng</label>
              <select
                value={targetId || ""}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full border rounded px-2 py-1"
              >
                <option value="">— Chọn —</option>
                {targetType === "PRODUCT" &&
                  products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                {targetType === "CATEGORY" &&
                  categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                {targetType === "ORDER_TOTAL" && (
                  <option value="">Áp dụng theo tổng đơn</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm">Phần trăm</label>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm">Số lượng tối thiểu</label>
              <input
                type="number"
                min={1}
                value={minQuantity}
                onChange={(e) => setMinQuantity(Number(e.target.value))}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm">Kích hoạt</label>
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Ngày bắt đầu</label>
              <input
                type="date"
                value={startSale}
                onChange={(e) => setStartSale(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm">Ngày kết thúc</label>
              <input
                type="date"
                value={endSale}
                onChange={(e) => setEndSale(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded"
            >
              {editing ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiscountForm;
