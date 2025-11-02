import React, { useEffect, useState } from "react";
import axios from "axios";

type Props = { editing?: any | null; onClose: () => void };

const SaleProgramForm: React.FC<Props> = ({ editing, onClose }) => {
  const [name, setName] = useState(editing?.name || "");
  const [description, setDescription] = useState(editing?.description || "");
  const [startDate, setStartDate] = useState(
    editing ? editing.start_date.slice(0, 10) : ""
  );
  const [endDate, setEndDate] = useState(
    editing ? editing.end_date.slice(0, 10) : ""
  );
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [selectedDiscounts, setSelectedDiscounts] = useState<string[]>(
    editing?.discounts || []
  );
  const [isActive, setIsActive] = useState(editing?.isActive ?? true);

  const fetchDiscounts = async () => {
    const res = await axios.get("http://localhost:5001/api/discount");
    setDiscounts(res.data);
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
    };

    if (editing) {
      await axios.put(
        `http://localhost:5001/api/saleprogram/${editing._id}`,
        payload
      );
    } else {
      await axios.post("http://localhost:5001/api/saleprogram", payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 flex justify-center items-start bg-black/20 p-6">
      <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-lg">
        <h3 className="font-semibold text-lg mb-4">
          {editing ? "Chỉnh sửa chương trình" : "Tạo mới chương trình"}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Tên chương trình</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border rounded px-2 py-1"
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm">Ngày bắt đầu</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-sm">Ngày kết thúc</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border rounded px-2 py-1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm">Chọn discount</label>
            <select
              multiple
              value={selectedDiscounts}
              onChange={(e) =>
                setSelectedDiscounts(
                  Array.from(e.target.selectedOptions, (opt) => opt.value)
                )
              }
              className="w-full border rounded px-2 py-1 h-32"
            >
              {discounts.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name} ({d.discount_percent}%)
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Kích hoạt
            </label>
            <button
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded"
            >
              Lưu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleProgramForm;
