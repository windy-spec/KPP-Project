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

// Hàm helper (bên ngoài component)
const formatDate = (dateString: string) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const SaleProgramTable: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const token = localStorage.getItem("accessToken");
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  }; // Chỉ cần fetch Programs (vì backend đã populate 'discounts')
  const fetchPrograms = async () => {
    try {
      const res = await axios.get(
        "http://localhost:5001/api/saleprogram",
        authHeaders
      ); // Xử lý an toàn
      let programData = [];
      if (Array.isArray(res.data)) {
        programData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        programData = res.data.data;
      }
      setPrograms(programData);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []); // HÀM "ẨN" (SOFT DELETE)

  const handleSoftDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Ẩn chương trình này?",
      text: "Chương trình và các discount con sẽ bị vô hiệu hóa (ẩn).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Vâng, ẩn nó!",
      cancelButtonText: "Hủy",
    });
    if (confirm.isConfirmed) {
      // Gọi route DELETE /:id (logic "Ẩn" của backend)
      await axios.delete(
        `http://localhost:5001/api/saleprogram/${id}`,
        authHeaders
      );
      fetchPrograms();
    }
  }; // HÀM "XÓA CỨNG" (HARD DELETE)

  const handleHardDelete = async (id: string) => {
    const confirm = await Swal.fire({
      title: "XÓA VĨNH VIỄN?",
      text: "Chương trình sẽ bị xóa. Các discount con sẽ được 'thả' ra.",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa vĩnh viễn",
      cancelButtonText: "Hủy",
    });
    if (confirm.isConfirmed) {
      // Gọi route /hard-delete/
      await axios.delete(
        `http://localhost:5001/api/saleprogram/hard-delete/${id}`,
        authHeaders
      );
      fetchPrograms();
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Danh sách chương trình</h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="px-4 py-2 bg-orange-500 text-white rounded"
        >
          Tạo mới
        </button>
      </div>

      <table className="w-full bg-white border">
        <thead>
          <tr>
            <th className="p-2 border">Hình ảnh</th>
            <th className="p-2 border">Tên</th>
            <th className="p-2 border">Ngày bắt đầu</th>
            <th className="p-2 border">Ngày kết thúc</th>
            <th className="p-2 border">Các Discount</th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Thao tác</th>
          </tr>
        </thead>

        <tbody>
          {programs.map((p) => {
            // Áp dụng làm mờ cho từng ô, trừ ô "Thao tác"
            const rowClass = !p.isActive ? "opacity-50" : "";
            return (
              <tr key={p._id}>
                <td className={`border p-2 ${rowClass}`}>
                  <img
                    // Nếu p.banner_image CÓ, dùng nó.
                    // Nếu KHÔNG, dùng link placeholder.
                    src={
                      p.banner_image ||
                      "http://localhost:5001/uploads/z7202827791249_3f9f56e84a986117c7fd0030d0bb593a.jpg"
                    }
                    alt={p.name}
                    className="w-24 h-12 object-cover rounded"
                  />
                </td>

                <td className={`border p-2 ${rowClass}`}>{p.name}</td>

                <td className={`border p-2 ${rowClass}`}>
                  {formatDate(p.start_date)}
                </td>
                <td className={`border p-2 ${rowClass}`}>
                  {formatDate(p.end_date)}
                </td>

                <td className={`border p-2 text-sm ${rowClass}`}>
                  {p.discounts && p.discounts.length > 0 ? (
                    p.discounts.map((d: any) => (
                      <div key={d._id}>- {d.name}</div>
                    ))
                  ) : (
                    <span className="text-gray-400">Không có</span>
                  )}
                </td>

                <td className={`border p-2 ${rowClass}`}>
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
                {/* Ô "Thao tác" không có 'rowClass' để luôn sáng */}

                <td className="border p-2 text-center">
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
                    onClick={() => handleSoftDelete(p._id)} // Nút "Ẩn"
                    className="px-2 py-1 bg-gray-500 text-white rounded mr-2"
                  >
                    Ẩn
                  </button>

                  <button
                    onClick={() => handleHardDelete(p._id)} // Nút "Xóa"
                    className="px-2 py-1 bg-red-500 text-white rounded"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {openForm && (
        <SaleProgramForm
          onClose={() => {
            setOpenForm(false);
            fetchPrograms();
          }}
          editing={editing}
        />
      )}
    </div>
  );
};

export default SaleProgramTable;
