import React, { useEffect, useState } from "react";
import axios from "axios";
import SaleProgramForm from "./SaleProgramForm";
import Swal from "sweetalert2";

const SaleProgramTable: React.FC = () => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);

  const fetchPrograms = async () => {
    try {
      const res = await axios.get("http://localhost:5001/api/saleprogram");
      setPrograms(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const deleteProgram = async (id: string) => {
    const confirm = await Swal.fire({
      title: "Xóa chương trình?",
      showCancelButton: true,
      confirmButtonText: "Xóa",
    });
    if (confirm.isConfirmed) {
      await axios.delete(`http://localhost:5001/api/saleprogram/${id}`);
      fetchPrograms();
    }
  };

  useEffect(() => {
    fetchPrograms();
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Danh sách chương trình</h2>
        <button
          onClick={() => {
            setEditing(null);
            setOpenForm(true);
          }}
          className="px-4 py-2 bg-primary text-white rounded"
        >
          Tạo mới
        </button>
      </div>

      <table className="w-full bg-white border">
        <thead>
          <tr>
            <th className="p-2 border">Tên</th>
            <th className="p-2 border">Ngày bắt đầu</th>
            <th className="p-2 border">Ngày kết thúc</th>
            <th className="p-2 border">Trạng thái</th>
            <th className="p-2 border">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {programs.map((p) => (
            <tr key={p._id}>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">
                {new Date(p.start_date).toLocaleDateString()}
              </td>
              <td className="border p-2">
                {new Date(p.end_date).toLocaleDateString()}
              </td>
              <td className="border p-2">
                {p.isActive ? "Đang hoạt động" : "Không"}
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
            fetchPrograms();
          }}
          editing={editing}
        />
      )}
    </div>
  );
};

export default SaleProgramTable;
