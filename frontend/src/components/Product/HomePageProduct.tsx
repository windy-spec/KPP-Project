import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const BASE_URL = "http://localhost:5001";

type Product = {
  _id?: string;
  id?: string;
  name: string;
  price?: number;
  image?: string;
  image_url?: string;
  images?: string[];
  quantity?: number;
  is_Active?: boolean;

  // Dữ liệu mới từ BE (có thể undefined)
  final_price?: number;
  discount_info?: { percent: number; code: string } | null;
};

const HomePageProduct: React.FC = () => {
  const MAX_HOME_ITEMS = 9;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const productHeaderRef = useRef<HTMLHeadingElement>(null);

  // Hàm chuẩn hóa ảnh an toàn hơn
  const normalizeImageUrl = (
    img?: string,
    img_url?: string
  ): string | undefined => {
    if (!img && !img_url) return undefined;

    let path = img_url || img || "";

    // Nếu là base64 hoặc http thì trả về luôn
    if (path.startsWith("data:") || path.startsWith("http")) return path;

    // Xử lý đường dẫn tương đối
    if (path.includes("public")) path = path.split("public")[1];
    path = path.replace(/\\/g, "/");

    if (!path.startsWith("/")) path = `/${path}`;

    // Loại bỏ /uploads thừa nếu có (tùy cấu hình server)
    // path = path.replace(/^\/uploads\/uploads/, "/uploads");

    return `${BASE_URL}${path}`;
  };

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Gọi API partition
      const res = await axios.get(
        `${BASE_URL}/api/product/partition?page=1&limit=${MAX_HOME_ITEMS}`
      );
      const data = res.data;
      const list: Product[] = data?.products || [];

      console.log("📦 Data received:", list); // Debug xem dữ liệu về chưa

      const normalized = list.map((p) => {
        // Tìm ảnh đầu tiên có thể dùng được
        const rawImg =
          (Array.isArray(p.images) && p.images.length > 0
            ? p.images[0]
            : undefined) ||
          p.image_url ||
          p.image;
        return { ...p, image: normalizeImageUrl(rawImg) };
      });

      setProducts(normalized);
    } catch (err: any) {
      console.error("❌ Lỗi load sản phẩm:", err);
      setError(err.message || "Không thể tải sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  if (loading)
    return (
      <div className="text-center py-16 text-orange-500 font-medium">
        Đang tải sản phẩm nổi bật...
      </div>
    );
  if (error)
    return (
      <div className="text-center text-red-500 py-16">Lỗi kết nối: {error}</div>
    );

  return (
    <section className="px-4 md:px-8 lg:px-16 w-5/5 max-w-7xl mx-auto py-12">
      <h2
        ref={productHeaderRef}
        className="text-2xl font-bold mb-6 text-slate-800"
      >
        Sản phẩm nổi bật
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {products.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-500">
            Chưa có sản phẩm nào.
          </div>
        )}

        {products.map((p) => (
          <div
            key={p._id || p.id || Math.random()}
            className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden border border-gray-100 relative group"
          >
            {/* BADGE KHUYẾN MÃI (Chỉ hiện nếu có discount_info hợp lệ) */}
            {p.discount_info && p.discount_info.percent > 0 && (
              <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow-sm animate-pulse">
                -{p.discount_info.percent}%
              </div>
            )}

            <Link to={`/san-pham/${p._id || p.id}`} className="block">
              <div className="h-40 sm:h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                <img
                  src={p.image}
                  alt={p.name}
                  className="object-contain h-full w-full p-2 group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://placehold.co/300x200/CCCCCC/333333?text=No+Image";
                  }}
                />
                {/* Badge Hết Hàng */}
                {p.quantity !== undefined && p.quantity <= 0 && (
                  <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                    <span className="bg-black/70 text-white px-3 py-1 rounded font-bold text-sm">
                      HẾT HÀNG
                    </span>
                  </div>
                )}
              </div>
            </Link>

            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-800 truncate hover:text-orange-500 transition-colors">
                {p.name}
              </h3>

              <div className="mt-2">
                {p.discount_info ? (
                  // 🚨 SỬA: Giá bán bên trái --- Giá gốc/Badge bên phải
                  <div className="flex items-end justify-between w-full">
                    {/* 1. BÊN TRÁI: GIÁ ĐÃ GIẢM (Màu đỏ, to) */}
                    <span className="text-lg font-extrabold text-red-600">
                      {formatVND(p.final_price || 0)}
                    </span>
                    {/* 2. BÊN PHẢI: GIÁ GỐC + BADGE (Nhỏ hơn, nằm sát lề phải) */}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-bold mt-0.5">
                        -{p.discount_info.percent}%
                      </span>
                      <span className="text-xs text-gray-400 line-through">
                        {formatVND(p.price || 0)}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Trường hợp không giảm giá
                  <div className="text-lg font-bold text-orange-500 mt-2">
                    {typeof p.price === "number"
                      ? formatVND(p.price)
                      : "Liên hệ"}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

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
