import React, { useEffect, useState } from "react";
import axios from "axios";
import DiscountForm from "./DiscountForm";
import Swal from "sweetalert2";

const DiscountTable: React.FC = () => {
  const [discounts, setDiscounts] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const fetchDiscounts = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/discount");
      setDiscounts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteDiscount = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Xóa discount?",
      showCancelButton: true,
      confirmButtonText: "Xóa",
    });
    if (confirm.isConfirmed) {
      await axios.delete(`http://localhost:5001/api/discount/${id}`);
      fetchDiscounts();
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Danh sách Discount</h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Thêm discount
        </button>
      </div>

      <table className="w-full bg-white border">
        <thead>
          <tr>
            <th className="p-2 border">Tên</th>
            <th className="p-2 border">Loại</th>
            <th className="p-2 border">Áp dụng</th>
            <th className="p-2 border">Giảm (%)</th>
            <th className="p-2 border">Bắt đầu</th>
            <th className="p-2 border">Kết thúc</th>
            <th className="p-2 border">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {discounts.map((d) => (
            <tr key={d._id}>
              <td className="border p-2">{d.name}</td>
              <td className="border p-2">{d.type}</td>
              <td className="border p-2">{d.target_type}</td>
              <td className="border p-2">{d.discount_percent}%</td>
              <td className="border p-2">
                {new Date(d.start_sale).toLocaleDateString()}
              </td>
              <td className="border p-2">
                {new Date(d.end_sale).toLocaleDateString()}
              </td>
              <td className="border p-2">
                <button
                  onClick={() => {
                    setEditing(d);
                    setOpenForm(true);
                  }}
                  className="px-2 py-1 bg-yellow-400 rounded mr-2"
                >
                  Sửa
                </button>
                <button
                  onClick={() => deleteDiscount(d._id)}
                  className="px-2 py-1 bg-red-500 text-white rounded"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {openForm && (
        <DiscountForm
          editing={editing}
          onClose={() => {
            setOpenForm(false);
            fetchDiscounts();
          }}
        />
      )}
    </div>
  );
};

export default DiscountTable;
