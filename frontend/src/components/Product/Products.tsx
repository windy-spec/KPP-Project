import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SERVER_BASE_URL = "http://localhost:5001";

type Category = {
  _id?: string;
  name: string;
  productCount?: number;
};

type Product = {
  _id?: string;
  id?: string;
  name: string;
  price?: number;
  avatar?: string;
  quantity?: number;
  is_Active?: boolean;
  category?: { _id?: string; name?: string };

  // 🚨 Dữ liệu mới từ Backend
  final_price?: number;
  discount_info?: {
    percent: number;
    code: string;
  } | null;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const normalizeImageUrl = (path?: string): string => {
  const defaultImage =
    "https://placehold.co/200x200/CCCCCC/333333?text=No+Image";
  if (!path) return defaultImage;
  return path.startsWith("http") ? path : `${SERVER_BASE_URL}${path}`;
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
  };

  // Lấy danh mục
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/category?limit=20&page=1");
        const data = res.data;
        setCategories(Array.isArray(data) ? data : data?.data || []);
      } catch {}
    };
    fetchCategories();
  }, []);

  // Sync URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("categories") !== activeCategory) {
      setActiveCategory(params.get("categories"));
      setCurrentPage(1);
    }
  }, [location.search]);

  // Lấy sản phẩm (Backend đã tính sẵn giá)
  useEffect(() => {
    let mounted = true;
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(buildUrl());
        if (!mounted) return;
        const data = res.data;
        const list = Array.isArray(data) ? data : data?.products || []; // Backend trả về object { products: [], ... }
        const meta = data?.meta || data?.pagination || {}; // Hoặc lấy total từ root object

        setProducts(list);
        // Cập nhật phân trang dựa trên response mới của Backend
        setTotalItems(data.totalProducts || list.length || 0);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        setError(err?.message || "Lỗi tải sản phẩm");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchProducts();
    return () => {
      mounted = false;
    };
  }, [currentPage, price, sortingType, activeCategory]);

  // Update URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set("page", String(currentPage));
    if (price !== null) params.set("price", String(price));
    else params.delete("price");
    if (sortingType !== "null") params.set("sort", sortingType);
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

  useEffect(() => {
    productRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentPage]);

  const [bgStyle, setBgStyle] = useState({});
  useEffect(() => {
    const percent = ((tempPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
    setBgStyle({
      background: `linear-gradient(to right, #f97316 ${percent}%, #e5e7eb ${percent}%)`,
    });
  }, [tempPrice]);

  return (
    <div className="px-4 py-8 mx-auto md:px-8 lg:px-16 md:py-12 max-w-7xl">
      <div className="flex items-center justify-center gap-6 mb-10">
        <h2 className="text-3xl font-extrabold tracking-tight text-gray-800 md:text-3xl">
          Khám Phá Sản Phẩm
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* SIDEBAR */}
        <aside className="lg:col-span-1">
          <div className="bg-white p-6 shadow-lg border-0.9">
            <div className="mb-8">
              <h3 className="text-mid-night font-semibold text-xl mb-4">
                Lọc theo giá
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium">Giá tối đa</label>
                  <input
                    type="number"
                    value={tempPrice}
                    min={PRICE_MIN}
                    max={PRICE_MAX}
                    step={PRICE_STEP}
                    onChange={(e) => setTempPrice(Number(e.target.value))}
                    onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
                    className="w-28 border rounded p-1 text-sm text-right"
                  />
                </div>
                <input
                  type="range"
                  min={PRICE_MIN}
                  max={PRICE_MAX}
                  step={PRICE_STEP}
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Number(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  style={bgStyle}
                />
                <div className="pt-2">
                  <p className="text-xs text-gray-600 mb-3">
                    {price !== null ? (
                      <>
                        Dưới <strong>{formatVND(price)}</strong>
                      </>
                    ) : (
                      "Không có bộ lọc"
                    )}
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleApplyPrice}
                    className="w-full bg-orange-300 hover:bg-white text-white hover:text-orange-300"
                    disabled={price === tempPrice}
                  >
                    Áp dụng
                  </Button>
                </div>
              </div>
            </div>

            <hr className="my-5 border-gray-200" />

            <div>
              <h3 className="text-xl text-mid-night font-semibold mb-4">
                Danh mục
              </h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {categories.map((cat) => {
                  const isActive = activeCategory === cat._id;
                  return (
                    <li
                      key={cat._id}
                      onClick={() => {
                        if (isActive) setActiveCategory(null);
                        else setActiveCategory(cat._id!);
                        setCurrentPage(1);
                      }}
                      className={`flex items-center justify-between cursor-pointer ${
                        isActive
                          ? "text-orange-500 font-semibold"
                          : "hover:text-orange-500"
                      }`}
                    >
                      <p>{cat.name}</p>
                      <span
                        className={`text-xs border px-2 py-0.5 rounded ${
                          isActive
                            ? "bg-orange-500 text-white border-orange-500"
                            : "group-hover:bg-orange-500 group-hover:text-white"
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

        {/* PRODUCT LIST */}
        <section className="lg:col-span-3 space-y-8" ref={productRef}>
          {/* Categories Topbar */}
          <div className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-4 shadow-sm">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-sm font-semibold text-gray-700 pr-2">
                Danh mục:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => {
                    if (activeCategory === cat._id) setActiveCategory(null);
                    else setActiveCategory(cat._id!);
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-1.5 rounded-full border text-sm transition-all duration-200 ${
                    activeCategory === cat._id
                      ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                      : "border-gray-300 text-gray-600 hover:bg-orange-100"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Summary */}
          {price !== null && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Bộ lọc:</span>
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

          {/* LOADING / ERROR / GRID */}
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
              {products.length === 0 && <div>Không có sản phẩm nào.</div>}

              {products.map((p) => (
                <div
                  key={p._id || p.id || p.name}
                  className="bg-white rounded-lg shadow-sm overflow-hidden relative group border border-gray-100"
                >
                  {/* 🚨 BADGE KHUYẾN MÃI (Dùng discount_info từ BE) */}
                  {p.discount_info && (
                    <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded z-10 shadow-md animate-pulse">
                      -{p.discount_info.percent}%
                    </div>
                  )}

                  <Link to={`/san-pham/${p._id || p.id}`} className="block">
                    <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                      <img
                        src={normalizeImageUrl(p.avatar)}
                        alt={p.name}
                        className="object-contain h-full w-full p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
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
                  {/* ADD TO CART SLIDE UP */}
                  <div
                    className="
                      absolute bottom-0 left-0 right-0 
                      translate-y-full group-hover:translate-y-0
                      bg-white/90 backdrop-blur-sm 
                      flex justify-center py-3 
                      transition-all duration-300
                      z-20
                    "
                  >
                    <button
                      className="
                        bg-orange-500 text-white text-sm px-4 py-2 rounded-lg 
                        shadow-md hover:bg-orange-600 transition
                      "
                    >
                      Thêm vào giỏ hàng
                    </button>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 truncate hover:text-orange-500 transition-colors">
                      {p.name}
                    </h3>

                    <div className="mt-2">
                      {p.discount_info ? (
                        // 🚨 SỬA: Dùng justify-between để đẩy giá KM sang phải
                        <div className="flex items-end justify-between w-full">
                          {/* Bên trái: Giá khuyến mãi */}
                          <span className="text-lg font-extrabold text-red-600">
                            {formatVND(p.final_price || 0)}
                          </span>
                          {/* Bên phải: Giá gốc + % giảm */}
                          <div className="flex flex-col items-start">
                            <span className="text-xs text-gray-400 line-through">
                              {formatVND(p.price || 0)}
                            </span>
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded font-bold mt-0.5">
                              -{p.discount_info.percent}%
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
          )}

          {/* PAGINATION */}
          <div className="flex justify-center gap-2 mt-6">
            <Button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
            >
              Trước
            </Button>
            <span className="py-2 px-3 bg-gray-100 rounded">
              Trang {currentPage} / {totalPages}
            </span>
            <Button
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
