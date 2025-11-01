import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AlignJustify, LayoutGrid, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

type Category = {
  _id?: string;
  id?: string;
  name: string;
  productCount?: number;
};

type Product = {
  _id?: string;
  id?: string;
  name: string;
  price?: number;
  avatar?: string; // 🚨 ĐÃ THAY THẾ image_url BẰNG avatar
  quantity?: number;
  is_Active?: boolean;
  category?: { _id?: string; name?: string };
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Hàm Helper để chuẩn hóa URL ảnh (giống logic trong ProductDetailPage.tsx)
const normalizeImageUrl = (path?: string): string => {
  const defaultImage =
    "https://placehold.co/200x200/CCCCCC/333333?text=No+Image";
  if (!path) return defaultImage;
  return path.startsWith("http") ? path : `http://localhost:5001${path}`;
};

const Products: React.FC = () => {
  const limit = 9;
  const location = useLocation();
  const navigate = useNavigate();
  const query = useQuery();

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sortingType, setSortingType] = useState<string>(
    query.get("sort") || "null"
  );

  const PRICE_MIN = 0;
  const PRICE_MAX = 5000000;
  const PRICE_STEP = 50000;

  const [price, setPrice] = useState<number | null>(
    query.get("price") ? Number(query.get("price")) : null
  );
  const [tempPrice, setTempPrice] = useState<number>(price ?? PRICE_MIN);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    query.get("categories")
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(query.get("page")) || 1
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);

  const productRef = useRef<HTMLDivElement | null>(null);

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(limit));
    if (price !== null) params.set("price", String(price));
    if (sortingType && sortingType !== "null") params.set("sort", sortingType);
    if (activeCategory) params.set("categories", activeCategory);
    return "/api/product?" + params.toString();
  }; // 🟢 Lấy danh mục

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/category?limit=20&page=1");
        const data = res.data;
        const list: Category[] = Array.isArray(data)
          ? data
          : data?.data || data?.categories || [];
        setCategories(list);
      } catch {
        /* ignore silently */
      }
    };
    fetchCategories();
  }, []); // 🟢 Lấy sản phẩm

  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = buildUrl();
        const res = await axios.get(url);
        if (!mounted) return;
        const data = res.data;
        const list = Array.isArray(data)
          ? data
          : data?.data || data?.products || [];
        const meta = data?.meta || data?.pagination || {};
        setProducts(list);
        setTotalItems(meta?.total || list.length || 0);
        setTotalPages(
          meta?.totalPages ||
            meta?.pages ||
            Math.max(1, Math.ceil((meta?.total || list.length) / limit))
        );
      } catch (err: any) {
        setError(err?.message || "Không tải được sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [currentPage, price, sortingType, activeCategory]); // 🟢 Cập nhật URL khi thay đổi filter

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(currentPage));
    if (price !== null) params.set("price", String(price));
    else params.delete("price");
    if (sortingType && sortingType !== "null") params.set("sort", sortingType);
    else params.delete("sort");
    if (activeCategory) params.set("categories", activeCategory);
    else params.delete("categories");

    navigate(
      { pathname: location.pathname, search: params.toString() },
      { replace: true }
    );
  }, [currentPage, price, sortingType, activeCategory]);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  const handleApplyPrice = () => {
    setPrice(tempPrice);
    setCurrentPage(1);
  };

  const handleClearFilter = () => {
    setPrice(null);
    setTempPrice(PRICE_MIN);
    setActiveCategory(null);
    setSortingType("null");
    setCurrentPage(1);
  };

  const startItem = (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalItems);

  useEffect(() => {
    productRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentPage]);
  return (
    <div className="px-4 py-8 mx-auto md:px-8 lg:px-16 md:py-12 max-w-7xl">
      <div className="flex items-center justify-center gap-6 mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-800 md:text-4xl">
          Khám Phá Sản Phẩm Của Chúng Tôi
        </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* === SIDEBAR === */}
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 shadow-sm border">
            {/* Lọc theo giá */}
            <div className="mb-8">
              <h3 className="text-mid-night font-semibold text-xl mb-4">
                Lọc theo giá
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Giá (tối đa)</label>   
                  <span className="text-sm text-gray-600">
                    {formatVND(tempPrice)}
                  </span>
                </div>

                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Number(e.target.value))}
                  className="w-full"
                />

                <div className="pt-2">
                  <p className="text-sm text-gray-600 mb-3">
                    {price !== null ? (
                      <>
                        Hiển thị sản phẩm dưới
                        <strong>{formatVND(price)}</strong>
                      </>
                    ) : (
                      "Không có bộ lọc giá"
                    )}
                  </p>

                  <Button
                    variant="outline"
                    onClick={handleApplyPrice}
                    className="w-full bg-orange-300 hover:bg-white text-white hover:text-orange-300"
                    disabled={price === tempPrice}
                  >
                    Áp Dụng
                  </Button>
                </div>
              </div>
            </div>
            <hr className="my-5 border-gray-200" />
            {/* Danh mục */}
            <div>
              <h3 className="text-xl text-mid-night font-semibold mb-4">
                Danh mục
              </h3>

              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat._id;
                  return (
                    <li
                      key={cat._id || cat.id}
                      onClick={() => {
                        if (isActive) setActiveCategory(null);
                        else if (cat._id) setActiveCategory(cat._id);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center justify-between group cursor-pointer transition-colors ${
                        isActive
                          ? "text-blue-600 font-medium"
                          : "hover:text-blue-600"
                      }`}
                    >
                      <p className="truncate">{cat.name}</p>

                      <span
                        className={`text-xs border rounded-md px-2 py-0.5 min-w-[24px] h-5 flex items-center justify-center transition ${
                          isActive
                            ? "bg-blue-600 text-white border-blue-600"
                            : "group-hover:bg-blue-600 group-hover:text-white"
                        }`}
                      >
                        {cat.productCount ?? "-"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </aside>
        {/* === PRODUCT LIST === */}
        <section className="lg:col-span-3 space-y-8" ref={productRef}>
          {/* Filter summary */}
          {price !== null && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Bộ lọc đang áp dụng:
                  </span>

                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Giá: Dưới {formatVND(price)}
                  </span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilter}
                  className="text-xs bg-orange-300 hover:bg-white text-white hover:text-orange-300"
                >
                  Xóa Filter
                </Button>
              </div>
            </div>
          )}
          {/* Product grid/list */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <span className="ml-2">Đang tải sản phẩm...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600">Lỗi: {error}</p>
            </div>
          ) : (
            <div
              className={
                layout === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {products.length === 0 && <div>Không có sản phẩm</div>}
              {products.map((p) => (
                <div
                  key={p._id || p.id || p.name}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <Link to={`/san-pham/${p._id || p.id}`} className="block">
                    <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={normalizeImageUrl(p.avatar)} // 🚨 ĐÃ CẬP NHẬT DÙNG p.avatar
                        alt={p.name}
                        className="object-contain h-full w-full"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src =
                            "https://placehold.co/200x200/CCCCCC/333333?text=No+Image";
                        }}
                      />
                      {p.quantity !== undefined && p.quantity <= 0 && (
                        <div className="absolute left-2 top-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                          Hết hàng
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">
                      {p.name}
                    </h3>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-lg font-bold text-primary">
                        {typeof p.price === "number"
                          ? formatVND(p.price)
                          : "Liên hệ"}
                      </div>

                      <Link to={`/san-pham/${p._id || p.id}`}>
                        <Button variant="outline">Xem</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Pagination */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>

            <span className="px-3">
              Trang {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
            >
              Sau
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Products;
