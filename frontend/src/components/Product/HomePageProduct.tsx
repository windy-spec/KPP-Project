import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Product = {
  _id?: string;
  id?: string;
  name: string;
  price?: number;
  image?: string;
  image_url?: string;
  description?: string;
  quantity?: number;
  is_Active?: boolean;
  category?: string | { _id?: string; name?: string };
};

type PaginationState = {
  currentPage: number;
  totalPages: number;
  totalProductsCount: number;
};

const HomePageProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Khai báo useRef bên trong component
  const productHeaderRef = useRef<HTMLHeadingElement>(null);

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    totalPages: 1,
    totalProductsCount: 0,
  });

  const fetchProducts = useCallback(async (page: number) => {
    try {
      setLoading(true);
      // Gọi API với tham số page hiện tại
      const res = await axios.get(`/api/product/partition?page=${page}`);

      const data = res.data;
      // Đảm bảo lấy đúng key 'products'
      const list: Product[] = data?.products || [];

      setProducts(list);
      // Cập nhật State phân trang từ dữ liệu trả về
      setPagination({
        currentPage: data?.currentPage || 1,
        totalPages: data?.totalPages || 1,
        totalProductsCount: data?.totalProducts || 0,
      });
    } catch (err: any) {
      console.error("Failed to load products", err);
      // Xử lý lỗi từ response backend hoặc lỗi mạng
      setError(
        err?.response?.data?.error || err.message || "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Gọi hàm fetch khi component mount và khi currentPage thay đổi
    fetchProducts(pagination.currentPage);
  }, [pagination.currentPage, fetchProducts]);

  const handlePageChange = (page: number) => {
    if (
      page >= 1 &&
      page <= pagination.totalPages &&
      page !== pagination.currentPage
    ) {
      setPagination((prev) => ({ ...prev, currentPage: page }));

      // LOGIC CUỘN TRANG VỪA PHẢI: Cuộn đến tiêu đề sản phẩm với offset nhỏ
      if (productHeaderRef.current) {
        const yOffset = -50; // Offset 50px từ phía trên
        const y =
          productHeaderRef.current.getBoundingClientRect().top +
          window.scrollY +
          yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  const renderPaginationButtons = () => {
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(
        <Button
          key={i}
          variant={pagination.currentPage === i ? "default" : "outline"}
          onClick={() => handlePageChange(i)}
          className={`mx-1 ${
            pagination.currentPage === i
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-white hover:bg-gray-100 text-gray-700"
          }`}
        >
          {i}
        </Button>
      );
    }
    return pages;
  };

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  if (loading)
    return (
      <div className="text-center py-16 text-xl font-medium text-orange-500">
        Đang tải sản phẩm...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-600 py-16 text-lg font-medium">
        Lỗi: {error}
      </div>
    );

  return (
    <section className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto py-12">
      {/* ⚠️ GẮN REF VÀO TIÊU ĐỀ SẢN PHẨM */}
      <h2
        ref={productHeaderRef}
        className="text-2xl font-bold mb-6 text-slate-800"
      >
        Sản phẩm ({pagination.totalProductsCount})
      </h2>

  {/* Mobile-first: 1 cột trên mobile, 2 cột trên tablet, 3 cột trên desktop */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            Không có sản phẩm nào để hiển thị.
          </div>
        )}
        {products
          .filter((p) => p.is_Active !== false)
          .map((p) => (
            <div
              key={p._id || p.id || p.name}
              className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100"
            >
              <Link to={`/san-pham/${p._id || p.id}`} className="block">
                <div className="h-40 sm:h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                  {p.image_url || p.image ? (
                    <img
                      src={p.image_url || p.image}
                      alt={p.name}
                      className="object-contain h-full w-full p-2"
                      // Fallback khi hình ảnh bị lỗi
                      onError={(
                        e: React.SyntheticEvent<HTMLImageElement, Event>
                      ) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = `https://placehold.co/300x200/CCCCCC/333333?text=${p.name.substring(
                          0,
                          15
                        )}`;
                      }}
                    />
                  ) : (
                    <div className="text-sm text-slate-400">
                      Không có hình ảnh
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-3 sm:p-4">
                <h3 className="text-sm sm:text-base font-semibold text-slate-800 truncate hover:text-orange-500 transition-colors">
                  {p.name}
                </h3>
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="text-lg sm:text-xl font-extrabold text-orange-500">
                    {typeof p.price === "number"
                      ? formatVND(p.price)
                      : "Liên hệ"}
                  </div>
                  {/* Link Xem chi tiết đã được sửa thành /san-pham/:id */}
                  <Link to={`/san-pham/${p._id || p.id}`}>
                    <Button
                      variant={"outline"}
                      className="w-full sm:w-auto border-orange-500 text-orange-500 hover:bg-orange-50 hover:text-orange-600 transition-colors text-sm"
                    >
                      Xem chi tiết
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* --- PHÂN TRANG (PAGINATION) --- */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-12">
          {/* Nút Previous */}
          <Button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            variant="outline"
            className="bg-white hover:bg-gray-100 text-gray-700"
          >
            Trước
          </Button>

          {/* Các nút số trang */}
          {renderPaginationButtons()}

          {/* Nút Next */}
          <Button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            variant="outline"
            className="bg-white hover:bg-gray-100 text-gray-700"
          >
            Tiếp
          </Button>
        </div>
      )}

      {/* --- Xem tất cả sản phẩm --- */}
      <div className="mt-6 text-center">
        <Link to="/san-pham">
          <Button
            variant={"outline"}
            className="w-full sm:w-auto bg-orange-300 hover:bg-white text-white font-semibold border-2 border-orange-300 hover:text-orange-500 transition-colors"
          >
            Xem tất cả sản phẩm
          </Button>
        </Link>
      </div>
    </section>
  );
};

export default HomePageProduct;
