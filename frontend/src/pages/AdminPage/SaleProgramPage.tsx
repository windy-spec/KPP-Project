import React, { useEffect, useState } from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

interface SaleProgram {
  _id?: string;
  name: string;
  description?: string;
  discounts?: string[];
  start_date?: string;
  end_date?: string;
}

const SaleProgramPage: React.FC = () => {
  const [programs, setPrograms] = useState<SaleProgram[]>([]);
  const [discounts, setDiscounts] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [form, setForm] = useState<SaleProgram>({
    name: "",
    description: "",
    discounts: [],
  });
  const [editId, setEditId] = useState<string | null>(null);

  // Fetch sale programs
  const fetchPrograms = async () => {
    const res = await fetch("http://localhost:5001/api/saleprogram");
    const data = await res.json();
    setPrograms(data);
  };

  // Fetch available discounts
  const fetchDiscounts = async () => {
    const res = await fetch("http://localhost:5001/api/discount");
    const data = await res.json();
    setDiscounts(data);
  };

  useEffect(() => {
    fetchPrograms();
    fetchDiscounts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editId ? "PUT" : "POST";
    const url = editId
      ? `http://localhost:5001/api/saleprogram/${editId}`
      : "http://localhost:5001/api/saleprogram";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      await fetchPrograms();
      setForm({ name: "", description: "", discounts: [] });
      setEditId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa chương trình này?")) return;
    await fetch(`http://localhost:5001/api/saleprogram/${id}`, {
      method: "DELETE",
    });
    fetchPrograms();
  };

  const handleEdit = (p: SaleProgram) => {
    setForm(p);
    setEditId(p._id || null);
  };

  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Quản lý Chương trình Sale</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white shadow rounded-lg p-4 mb-6 grid grid-cols-2 gap-4"
        >
          <input
            type="text"
            placeholder="Tên chương trình"
            className="border p-2 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Mô tả"
            className="border p-2 rounded"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <select
            multiple
            value={form.discounts}
            onChange={(e) =>
              setForm({
                ...form,
                discounts: Array.from(
                  e.target.selectedOptions,
                  (option) => option.value
                ),
              })
            }
            className="border p-2 rounded col-span-2 h-24"
          >
            {discounts.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="col-span-2 bg-orange-500 text-white py-2 rounded hover:bg-orange-600"
          >
            {editId ? "Cập nhật" : "Thêm mới"}
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow rounded-lg">
            <thead>
              <tr className="bg-gray-100 text-left">
                <th className="p-3 border">Tên</th>
                <th className="p-3 border">Mô tả</th>
                <th className="p-3 border">Discounts</th>
                <th className="p-3 border text-center">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {programs.map((p) => (
                <tr key={p._id}>
                  <td className="border p-3">{p.name}</td>
                  <td className="border p-3">{p.description}</td>
                  <td className="border p-3">
                    {p.discounts?.map((id) => {
                      const d = discounts.find((x) => x._id === id);
                      return d ? `${d.name}, ` : "";
                    })}
                  </td>
                  <td className="border p-3 text-center">
                    <button
                      onClick={() => handleEdit(p)}
                      className="px-3 py-1 bg-blue-500 text-white rounded mr-2"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p._id!)}
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
      </div>
      <Footer />
    </>
  );
};

export default SaleProgramPage;
