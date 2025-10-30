import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// Khai báo lại kiểu dữ liệu Product
type Category = {
  _id: string;
  name: string;
  description?: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  image_url: string;
  description: string;
  quantity: number;
  is_Active: boolean;
  category: Category | null;
};

const ProductDetailPage: React.FC = () => {
  // Lấy ID từ URL (đường dẫn: /san-pham/:id).
  // useParams trả về một object có thể chứa undefined, nên cần kiểm tra.
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Ép kiểu id thành string và kiểm tra nếu không có
    if (!id) {
      setError("Không tìm thấy ID sản phẩm.");
      setLoading(false);
      return;
    }

    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        // Gọi API chi tiết sản phẩm
        // API URL: /api/product/69031590f5652f5fb03e54c6
        const res = await axios.get(`/api/product/${id}`);
        // Ép kiểu dữ liệu nhận được
        setProduct(res.data as Product);
      } catch (err: any) {
        console.error("Failed to load product detail", err);
        if (err.response && err.response.status === 404) {
          setError("Sản phẩm không tồn tại hoặc đã bị xóa.");
        } else {
          // Hiển thị lỗi từ backend nếu có (ví dụ: lỗi 500)
          const errorMessage = err.response?.data?.error || err.message;
          setError(`Lỗi khi tải thông tin sản phẩm: ${errorMessage}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  if (loading)
    return (
      <div className="text-center py-20 text-xl font-medium text-orange-500">
        Đang tải chi tiết sản phẩm...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-xl text-red-600 font-medium">
        {error}
        <div className="mt-4">
          <Link to="/">
            <Button
              variant="outline"
              className="border-orange-500 text-orange-500 hover:bg-orange-50"
            >
              Quay về Trang chủ
            </Button>
          </Link>
        </div>
      </div>
    );

  if (!product) return null;

  return (
    <div className="px-4 md:px-8 lg:px-16 max-w-6xl mx-auto py-12">
      <div className="bg-white rounded-xl shadow-2xl p-6 md:p-10 border border-gray-100">
        {/* Breadcrumb / Navigation */}
        <div className="mb-8 text-sm text-gray-500">
          <Link to="/" className="hover:text-orange-500 transition-colors">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          {/* Sửa đường dẫn /san-pham */}
          <Link
            to="/san-pham"
            className="hover:text-orange-500 transition-colors"
          >
            Sản phẩm
          </Link>
          <span className="mx-2">/</span>
          <span className="font-semibold text-gray-700">{product.name}</span>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Cột trái: Hình ảnh */}
          <div className="md:w-1/2 flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
            <img
              src={product.image_url}
              alt={product.name}
              className="max-h-96 object-contain rounded-md shadow-md"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  "https://placehold.co/600x400/CCCCCC/333333?text=Không+có+hình+ảnh";
              }}
            />
          </div>

          {/* Cột phải: Chi tiết */}
          <div className="md:w-1/2">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
              {product.name}
            </h1>

            <div className="text-lg text-gray-500 mb-6">
              <span className="font-semibold">Danh mục: </span>
              <span className="text-orange-600">
                {product.category?.name || "Chưa phân loại"}
              </span>
            </div>

            <div className="text-5xl font-extrabold text-red-600 mb-6 border-b border-gray-200 pb-4">
              {formatVND(product.price)}
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-gray-700 leading-relaxed text-base">
                <span className="font-semibold text-slate-700">
                  Mô tả chi tiết:
                </span>{" "}
                {product.description}
              </p>
              <p className="text-sm text-gray-500 pt-2 border-t border-gray-100">
                <span className="font-semibold text-gray-700">
                  Mã sản phẩm:
                </span>{" "}
                {product._id}
              </p>
              <p
                className={`text-sm font-semibold ${
                  product.quantity > 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {product.quantity > 0
                  ? `Tình trạng: Còn hàng (${product.quantity} sản phẩm)`
                  : "Tình trạng: Hết hàng"}
              </p>
            </div>

            <div className="flex space-x-4">
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-white text-lg px-8 py-6 font-semibold shadow-lg shadow-orange-200 transition-all duration-300"
                disabled={product.quantity <= 0}
              >
                Thêm vào Giỏ hàng
              </Button>
              <Button
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-100 px-6 py-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                Yêu thích
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
