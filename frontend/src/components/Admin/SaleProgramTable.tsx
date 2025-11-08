// frontend/src/components/Admin/SaleProgramTable.tsx
import React, { useEffect, useState } from "react";
import axios from "axios";
// Đảm bảo import form từ đúng vị trí
import SaleProgramForm from "./SaleProgramForm";
import Swal from "sweetalert2";

// Định nghĩa kiểu cho Discount (chỉ cần ID và tên)
type DiscountStub = {
  _id: string;
  name: string;
};

const SaleProgramTable: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [allDiscounts, setAllDiscounts] = useState<DiscountStub[]>([]);
  const token = localStorage.getItem("accessToken");
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };
  const fetchData = async () => {
    try {
      const [programRes, discountRes] = await Promise.all([
        axios.get("http://localhost:5001/api/saleprogram", authHeaders),
        axios.get("http://localhost:5001/api/discount", {
          ...authHeaders, // Dùng spread (...) để gộp headers
          params: { cache: "no-store" }, // Gộp cả params
        }),
      ]);

      // Xử lý an toàn cho Programs
      let programData = [];
      if (Array.isArray(programRes.data)) {
        programData = programRes.data;
      } else if (programRes.data && Array.isArray(programRes.data.data)) {
        programData = programRes.data.data;
      }
      setPrograms(programData);

      // Xử lý an toàn cho Discounts
      let discountData = [];
      if (Array.isArray(discountRes.data)) {
        discountData = discountRes.data;
      } else if (discountRes.data && Array.isArray(discountRes.data.data)) {
        discountData = discountRes.data.data;
      } else if (
        discountRes.data &&
        Array.isArray(discountRes.data.discounts)
      ) {
        discountData = discountRes.data.discounts;
      }
      setAllDiscounts(discountData);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProgram = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Xóa chương trình?",
      text: "Việc này không xóa các discount con, chỉ gỡ chúng ra.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });
    if (confirm.isConfirmed) {
      await axios.delete(
        `http://localhost:5001/api/saleprogram/${id}`,
        authHeaders
      );
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getDiscountName = (id: string) => {
    const found = allDiscounts.find((d) => d._id === id);
    return found ? found.name : "Discount không tồn tại";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Danh sách chương trình</h2>

        {/* === SỬA CLASS NÚT Ở ĐÂY === */}
        <button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="px-4 py-2 bg-orange-500 text-white rounded" // Đổi từ bg-primary
        >
          Tạo mới
        </button>
        {/* ========================== */}
      </div>

      <table className="w-full bg-white border">
        <thead>
          <tr>
            <th className="p-2 border">Tên</th>
            <th className="p-2 border">Ngày bắt đầu</th>
            <th className="p-2 border">Ngày kết thúc</th>
            <th className="p-2 border">Các Discount</th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr key={p._id} className={!p.isActive ? "opacity-50" : ""}>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">
                {new Date(p.start_date).toLocaleDateString()}
              </td>
              <td className="border p-2">
                {new Date(p.end_date).toLocaleDateString()}
              </td>
              <td className="border p-2 text-sm">
                {p.discounts && p.discounts.length > 0 ? (
                  (p.discounts as any[])
                    .map((d) => d._id || d)
                    .map((discountId: string) => (
                      <div key={discountId}>
                        - {getDiscountName(discountId)}
                      </div>
                    ))
                ) : (
                  <span className="text-gray-400">Không có</span>
                )}
              </td>
              <td className="border p-2">
                {p.isActive ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Hoạt động
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Đã ẩn
                  </span>
                )}
              </td>
              <td className="border p-2">
                <button
                  onClick={() => {
                    setEditing(p);
                    setOpenForm(true);
                  }}
                  className="px-2 py-1 bg-yellow-400 rounded mr-2"
                >
                  Sửa
                </button>
                <button
                  onClick={() => deleteProgram(p._id)}
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
        <SaleProgramForm
          onClose={() => {
            setOpenForm(false);
            fetchData(); // Gọi hàm fetch mới
          }}
          editing={editing}
        />
      )}
    </div>
  );
};

export default SaleProgramTable;
