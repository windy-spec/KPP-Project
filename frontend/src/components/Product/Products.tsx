import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const SERVER_BASE_URL = "http://localhost:5001";

type Category = { _id?: string; name: string; productCount?: number };
type Product = {
  _id?: string;
  name: string;
  price?: number;
  avatar?: string;
  quantity?: number;
  final_price?: number;
  discount_info?: { percent: number; code: string } | null;
};

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const normalizeImageUrl = (path?: string) =>
  path?.startsWith("http")
    ? path
    : path
    ? `${SERVER_BASE_URL}${path}`
    : "https://placehold.co/200x200/CCCCCC/333333?text=No+Image";

const Products: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const query = useQuery();
  const limit = 9;

  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sortingType, setSortingType] = useState(query.get("sort") || "null");
  const [price, setPrice] = useState<number | null>(
    query.get("price") ? Number(query.get("price")) : null
  );
  const [tempPrice, setTempPrice] = useState<number>(price || 0);
  const [activeCategory, setActiveCategory] = useState<string | null>(
    query.get("categories")
  );
  const [currentPage, setCurrentPage] = useState<number>(
    Number(query.get("page")) || 1
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productRef = useRef<HTMLDivElement | null>(null);

  const PRICE_MIN = 0;
  const PRICE_MAX = 5000000;
  const PRICE_STEP = 50000;

  const buildUrl = () => {
    const params = new URLSearchParams();
    params.set("page", String(currentPage));
    params.set("limit", String(limit));
    if (price !== null) params.set("price", String(price));
    if (sortingType && sortingType !== "null") params.set("sort", sortingType);
    if (activeCategory) params.set("categories", activeCategory);
    return "/api/product?" + params.toString();
  };

  useEffect(() => {
    axios
      .get("/api/category?limit=20&page=1")
      .then((res) => setCategories(res.data?.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    axios
      .get(buildUrl())
      .then((res) => {
        const data = res.data;
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
      })
      .catch((err) => setError(err.message || "Lỗi tải sản phẩm"))
      .finally(() => setLoading(false));
  }, [currentPage, price, sortingType, activeCategory]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (price !== null) params.set("price", String(price));
    else params.delete("price");
    if (sortingType !== "null") params.set("sort", sortingType);
    else params.delete("sort");
    if (activeCategory) params.set("categories", activeCategory);
    else params.delete("categories");
    params.set("page", String(currentPage));
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

  const [bgStyle, setBgStyle] = useState({});
  useEffect(() => {
    const percent = ((tempPrice - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100;
    setBgStyle({
      background: `linear-gradient(to right, #f97316 ${percent}%, #e5e7eb ${percent}%)`,
    });
  }, [tempPrice]);

  useEffect(() => {
    productRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentPage]);

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      {/* HEADER */}
      <header className="bg-orange-500 text-white shadow-md py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold">
            MyShop
          </Link>
          <nav className="space-x-4">
            <Link to="/" className="hover:underline">
              Trang chủ
            </Link>
            <Link to="/products" className="hover:underline">
              Sản phẩm
            </Link>
            <Link to="/contact" className="hover:underline">
              Liên hệ
            </Link>
          </nav>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-4 py-8 max-w-7xl mx-auto md:px-8 lg:px-16">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* SIDEBAR */}
          <aside className="lg:w-1/4 bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Lọc theo giá
            </h3>
            <input
              type="number"
              value={tempPrice}
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              onChange={(e) => setTempPrice(Number(e.target.value))}
              onKeyDown={(e) => e.key === "Enter" && handleApplyPrice()}
              className="w-full p-2 border rounded mb-2 text-right"
            />
            <input
              type="range"
              min={PRICE_MIN}
              max={PRICE_MAX}
              step={PRICE_STEP}
              value={tempPrice}
              onChange={(e) => setTempPrice(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-2"
              style={bgStyle}
            />
            <Button
              variant="outline"
              className="w-full bg-orange-300 hover:bg-white text-white hover:text-orange-300"
              onClick={handleApplyPrice}
              disabled={price === tempPrice}
            >
              Áp dụng
            </Button>

            <hr className="my-6" />

            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Danh mục
            </h3>
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map((cat) => {
                const isActive = activeCategory === cat._id;
                return (
                  <li
                    key={cat._id}
                    onClick={() => {
                      setActiveCategory(isActive ? null : cat._id);
                      setCurrentPage(1);
                    }}
                    className={`flex justify-between cursor-pointer ${
                      isActive
                        ? "text-orange-500 font-semibold"
                        : "hover:text-orange-500"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        isActive ? "bg-orange-500 text-white" : "bg-gray-200"
                      }`}
                    >
                      {cat.productCount ?? "-"}
                    </span>
                  </li>
                );
              })}
            </ul>
          </aside>

          {/* PRODUCT LIST */}
          <section className="lg:w-3/4 space-y-6" ref={productRef}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
                {error}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {products.length === 0 && <div>Không có sản phẩm nào.</div>}
                {products.map((p) => (
                  <div
                    key={p._id || p.name}
                    className="bg-white rounded-lg shadow-md overflow-hidden group border border-gray-100 relative"
                  >
                    {p.discount_info && (
                      <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">{`-${p.discount_info.percent}%`}</div>
                    )}
                    <Link to={`/san-pham/${p._id}`}>
                      <div className="h-44 flex items-center justify-center overflow-hidden bg-gray-100">
                        <img
                          src={normalizeImageUrl(p.avatar)}
                          alt={p.name}
                          className="object-contain h-full p-2 group-hover:scale-105 transition-transform duration-300"
                        />
                        {p.quantity !== undefined && p.quantity <= 0 && (
                          <div className="absolute left-2 top-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                            Hết hàng
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-sm font-semibold text-gray-800 truncate group-hover:text-orange-500">
                          {p.name}
                        </h3>
                        <div className="mt-2">
                          {p.discount_info ? (
                            <div className="flex justify-between items-end">
                              <span className="text-lg font-extrabold text-red-600">
                                {formatVND(p.final_price || 0)}
                              </span>
                              <div className="flex flex-col items-start">
                                <span className="text-xs text-gray-400 line-through">
                                  {formatVND(p.price || 0)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="text-lg font-bold text-orange-500 mt-2">
                              {p.price ? formatVND(p.price) : "Liên hệ"}
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
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
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage >= totalPages}
              >
                Sau
              </Button>
            </div>
          </section>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="bg-orange-500 text-white py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <span>© 2025 MyShop. All rights reserved.</span>
          <div className="space-x-4 mt-2 md:mt-0">
            <a href="#" className="hover:underline">
              Facebook
            </a>
            <a href="#" className="hover:underline">
              Instagram
            </a>
            <a href="#" className="hover:underline">
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Products;
