// frontend/src/components/Admin/SaleProgramTable.tsx
// Quản lý bảng hiển thị danh sách các chương trình khuyến mãi (Sale Programs)

import React, { useEffect, useState } from "react";
import axios from "axios";
// Import các icon từ thư viện lucide-react
import { Edit2, Trash2, Eye, EyeOff, Plus, Loader2 } from "lucide-react";
// Import Button component từ UI library
import { Button } from "@/components/ui/button";
// Import SweetAlert2 để hiển thị popup xác nhận
import Swal from "sweetalert2";
// Import form để tạo/chỉnh sửa chương trình khuyến mãi
import SaleProgramForm from "./SaleProgramForm";

// Kiểu dữ liệu cho Discount (chứa ID và tên)
type DiscountStub = {
  _id: string;
  name: string;
};

// ========== HÀM ĐỊNH DẠNG NGÀY THÁNG ==========
// Chuyển đổi chuỗi ngày sang định dạng DD/MM/YYYY
const formatDate = (dateString: string) => {
  // Nếu không có dữ liệu, trả về dấu "-"
  if (!dateString) return "-";
  
  const date = new Date(dateString);
  // Lấy ngày (thêm 0 nếu < 10)
  const day = String(date.getDate()).padStart(2, "0");
  // Lấy tháng (thêm 0 nếu < 10, cộng 1 vì tháng bắt đầu từ 0)
  const month = String(date.getMonth() + 1).padStart(2, "0");
  // Lấy năm
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
};

const SaleProgramTable: React.FC = () => {
  // ========== STATE (BIẾN TRẠNG THÁI) ==========
  // Danh sách tất cả các chương trình khuyến mãi
  const [programs, setPrograms] = useState<any[]>([]);
  // Kiểm soát xem form tạo/sửa có đang mở hay không
  const [openForm, setOpenForm] = useState(false);
  // Lưu trữ dữ liệu chương trình đang chỉnh sửa (null nếu tạo mới)
  const [editing, setEditing] = useState<any | null>(null);
  // Hiển thị trạng thái loading khi đang tải dữ liệu
  const [isLoading, setIsLoading] = useState(false);
  
  // ========== LẤY TOKEN VÀ CẤU HÌNH XÁC THỰC ==========
  // Lấy token từ localStorage để đính kèm vào header API request
  const token = localStorage.getItem("accessToken");
  // Cấu hình header với token để gửi API request
  const authHeaders = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // ========== HÀM TẢI DANH SÁCH CHƯƠNG TRÌNH ==========
  const fetchPrograms = async () => {
    try {
      // Bật loading state
      setIsLoading(true);
      
      // Gọi API để lấy danh sách chương trình khuyến mãi từ server
      const res = await axios.get(
        "http://localhost:5001/api/saleprogram",
        authHeaders
      );
      
      // Xử lý dữ liệu một cách an toàn - kiểm tra định dạng response
      let programData = [];
      if (Array.isArray(res.data)) {
        // Nếu response là mảng trực tiếp
        programData = res.data;
      } else if (res.data && Array.isArray(res.data.data)) {
        // Nếu response là object có thuộc tính 'data' là mảng
        programData = res.data.data;
      }
      
      // Cập nhật state với dữ liệu lấy được
      setPrograms(programData);
    } catch (error) {
      // Log lỗi và hiển thị popup SweetAlert lỗi
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: "Không thể tải danh sách chương trình",
      });
    } finally {
      // Tắt loading state dù có lỗi hay thành công
      setIsLoading(false);
    }
  };

  // ========== EFFECT: CHẠY KHI COMPONENT LOAD ==========
  // Tải danh sách chương trình lúc component vừa mount
  useEffect(() => {
    fetchPrograms();
  }, []);

  // ========== HÀM ẨN CHƯƠNG TRÌNH (SOFT DELETE) ==========
  // Ẩn chương trình = vô hiệu hóa nhưng vẫn giữ dữ liệu
  const handleSoftDelete = async (id: string) => {
    // Hiển thị popup xác nhận trước khi ẩn
    const confirm = await Swal.fire({
      title: "Ẩn chương trình này?",
      text: "Chương trình và các discount con sẽ bị vô hiệu hóa (ẩn).",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Vâng, ẩn nó!",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#f97316", // Màu cam
    });
    
    // Nếu người dùng xác nhận
    if (confirm.isConfirmed) {
      try {
        // Gọi API DELETE để ẩn chương trình (không xóa dữ liệu)
        await axios.delete(
          `http://localhost:5001/api/saleprogram/${id}`,
          authHeaders
        );
        
        // Tải lại danh sách để cập nhật UI
        await fetchPrograms();
        
        // Hiển thị thông báo thành công
        Swal.fire("Thành công!", "Chương trình đã được ẩn.", "success");
      } catch (error) {
        // Hiển thị thông báo lỗi nếu không thể ẩn
        Swal.fire("Lỗi!", "Không thể ẩn chương trình.", "error");
      }
    }
  };

  // ========== HÀM XÓA CỨNG CHƯƠNG TRÌNH (HARD DELETE) ==========
  // Xóa chương trình vĩnh viễn khỏi database
  const handleHardDelete = async (id: string) => {
    // Hiển thị popup xác nhận (cảnh báo đỏ vì đây là thao tác nguy hiểm)
    const confirm = await Swal.fire({
      title: "XÓA VĨNH VIỄN?",
      text: "Chương trình sẽ bị xóa. Các discount con sẽ được 'thả' ra.",
      icon: "error",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // Màu đỏ
      confirmButtonText: "Xóa vĩnh viễn",
      cancelButtonText: "Hủy",
    });
    
    // Nếu người dùng xác nhận
    if (confirm.isConfirmed) {
      try {
        // Gọi API DELETE hard-delete để xóa vĩnh viễn
        await axios.delete(
          `http://localhost:5001/api/saleprogram/hard-delete/${id}`,
          authHeaders
        );
        
        // Tải lại danh sách để cập nhật UI
        await fetchPrograms();
        
        // Hiển thị thông báo thành công
        Swal.fire("Thành công!", "Chương trình đã được xóa vĩnh viễn.", "success");
      } catch (error) {
        // Hiển thị thông báo lỗi nếu không thể xóa
        Swal.fire("Lỗi!", "Không thể xóa chương trình.", "error");
      }
    }
  };

  return (
    <div className="animate-in fade-in zoom-in duration-200">
      {/* ========== HEADER VÀ NÚT TẠO MỚI ========== */}
      <div className="flex justify-between items-center mb-6">
        <div>
          {/* Tiêu đề chính */}
          <h2 className="text-2xl font-bold text-gray-900">Chương trình Sale</h2>
          {/* Mô tả phụ */}
          <p className="text-sm text-gray-500 mt-1">
            Quản lý các chương trình khuyến mãi và chiết khấu
          </p>
        </div>
        {/* Nút "Tạo mới" để thêm chương trình khuyến mãi */}
        <Button
          onClick={() => {
            // Reset editing state để tạo mới thay vì sửa
            setEditing(null);
            // Mở form
            setOpenForm(true);
          }}
          className="bg-orange-500 hover:bg-orange-600 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Tạo mới
        </Button>
      </div>

      {/* ========== TRẠNG THÁI LOADING ========== */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          <span className="ml-2 text-gray-600">Đang tải...</span>
        </div>
      )}

      {/* ========== TRẠNG THÁI TRỐNG (KHÔNG CÓ CHƯƠNG TRÌNH) ========== */}
      {!isLoading && programs.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500">Chưa có chương trình nào</p>
        </div>
      )}

      {/* ========== BẢNG HIỂN THỊ DANH SÁCH CHƯƠNG TRÌNH ========== */}
      {!isLoading && programs.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* ===== HEADER CỦA BẢNG ===== */}
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {/* Cột: Hình ảnh */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Hình ảnh
                  </th>
                  {/* Cột: Tên chương trình */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Tên chương trình
                  </th>
                  {/* Cột: Ngày bắt đầu */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Ngày bắt đầu
                  </th>
                  {/* Cột: Ngày kết thúc */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Ngày kết thúc
                  </th>
                  {/* Cột: Discount */}
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                    Discount
                  </th>
                  {/* Cột: Trạng thái */}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Trạng thái
                  </th>
                  {/* Cột: Thao tác */}
                  <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Thao tác
                  </th>
                </tr>
              </thead>

              {/* ===== BODY CỦA BẢNG ===== */}
              <tbody>
                {/* Duyệt qua từng chương trình và render thành 1 hàng */}
                {programs.map((p) => (
                  <tr
                    key={p._id}
                    // Hover effect và làm mờ nếu chương trình không hoạt động
                    className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
                      !p.isActive ? "opacity-60" : ""
                    }`}
                  >
                    {/* ===== CỘT: HÌNH ẢNH ===== */}
                    <td className="px-6 py-4">
                      <img
                        // Hiển thị banner_image nếu có, nếu không dùng ảnh placeholder
                        src={
                          p.banner_image ||
                          "http://localhost:5001/uploads/z7202827791249_3f9f56e84a986117c7fd0030d0bb593a.jpg"
                        }
                        alt={p.name}
                        className="w-16 h-10 object-cover rounded"
                      />
                    </td>

                    {/* ===== CỘT: TÊN CHƯƠNG TRÌNH ===== */}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {p.name}
                    </td>

                    {/* ===== CỘT: NGÀY BẮT ĐẦU ===== */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(p.start_date)}
                    </td>

                    {/* ===== CỘT: NGÀY KẾT THÚC ===== */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(p.end_date)}
                    </td>

                    {/* ===== CỘT: DISCOUNTS ===== */}
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {p.discounts && p.discounts.length > 0 ? (
                        // Hiển thị badge cho mỗi discount
                        <div className="flex flex-wrap gap-1">
                          {p.discounts.map((d: any) => (
                            <span
                              key={d._id}
                              className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                            >
                              {d.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        // Nếu không có discount nào
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* ===== CỘT: TRẠNG THÁI ===== */}
                    <td className="px-6 py-4 text-center">
                      {p.isActive ? (
                        // Nếu hoạt động: hiển thị xanh
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                          Hoạt động
                        </span>
                      ) : (
                        // Nếu không hoạt động: hiển thị đỏ
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-medium px-3 py-1 rounded-full">
                          <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                          Đã ẩn
                        </span>
                      )}
                    </td>

                    {/* ===== CỘT: THAO TÁC ===== */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        {/* ===== NÚT CHỈNH SỬA ===== */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Lưu dữ liệu chương trình để chỉnh sửa
                            setEditing(p);
                            // Mở form
                            setOpenForm(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Chỉnh sửa"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>

                        {/* ===== NÚT ẨN (SOFT DELETE) ===== */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSoftDelete(p._id)}
                          className={`${
                            // Chỉ cho phép ẩn nếu đang hoạt động
                            p.isActive
                              ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                              : "text-gray-400"
                          }`}
                          disabled={!p.isActive}
                          title="Ẩn chương trình"
                        >
                          {/* Hiển thị icon khác nhau tùy trạng thái */}
                          {p.isActive ? (
                            <EyeOff className="w-4 h-4" /> // Đang hoạt động: icon mắt khép
                          ) : (
                            <Eye className="w-4 h-4" /> // Đã ẩn: icon mắt mở
                          )}
                        </Button>

                        {/* ===== NÚT XÓA CỨNG (HARD DELETE) ===== */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleHardDelete(p._id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Xóa vĩnh viễn"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========== FORM MODAL (TẠO/CHỈNH SỬA) ========== */}
      {openForm && (
        <SaleProgramForm
          onClose={() => {
            // Đóng form
            setOpenForm(false);
            // Tải lại danh sách để cập nhật UI
            fetchPrograms();
          }}
          // Truyền dữ liệu chương trình cần chỉnh sửa (null nếu tạo mới)
          editing={editing}
        />
      )}
    </div>
  );
};

export default SaleProgramTable;
