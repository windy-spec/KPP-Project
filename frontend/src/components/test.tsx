import apiClient from "../utils/api-user"; // Đảm bảo đường dẫn đúng
import { toast } from "react-hot-toast";

const TokenTest = () => {
  const handleTestApi = async () => {
    try {
      // 🚨 GỌI API /me (API được bảo vệ)
      const response = await apiClient.get("/users/me");

      console.log("SUCCESS: API /me trả về:", response.data);
      toast.success("Token vẫn hợp lệ! Dữ liệu đã được tải.");
    } catch (error) {
      // Interceptor sẽ bắt lỗi 401 và tự động logout.
      // Nếu có lỗi khác (ví dụ: 403, 500) mà Interceptor không chặn, nó sẽ hiển thị ở đây.
      console.error("Lỗi khi gọi API /me:", error);
      toast.error("Lỗi khi tải dữ liệu. Kiểm tra Console.");
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-4">Kiểm thử Token Hết hạn (10s)</h2>
      <p className="mb-4 text-sm text-red-600">
        Đảm bảo Server Backend đang chạy token 10s và bạn đã đăng nhập lại.
      </p>
      <button
        onClick={handleTestApi}
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition duration-200"
      >
        Gọi API /me (Bảo vệ)
      </button>
      <p className="mt-4 text-sm text-gray-500">
        Hãy nhấn nút này TRƯỚC 10s và SAU 15s để kiểm tra.
      </p>
    </div>
  );
};

export default TokenTest;
