import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type Product = {
  _id?: string;
  id?: string;
  name: string;
  price?: number;
  image?: string; // keep for backward-compat
  image_url?: string; // matches backend Product.image_url
  description?: string;
  quantity?: number;
  is_Active?: boolean;
  category?: string | { _id?: string; name?: string };
};

const HomePageProduct: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Try a sensible default API path; adjust if your backend uses a different route
        const res = await axios.get("/api/products?limit=6&page=1");
        if (!mounted) return;
        const data = res.data;
        // handle either array or { data: [...] }
        const list: Product[] = Array.isArray(data) ? data : data?.data || data?.products || [];
        setProducts(list);
      } catch (err: any) {
        console.error("Failed to load products", err);
        setError(err?.message || "Failed to load products");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, []);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  if (loading) return <div className="text-center py-8">Loading products...</div>;
  if (error) return <div className="text-center text-red-500 py-8">Error: {error}</div>;

  return (
    <section className="px-4 md:px-8 lg:px-16 max-w-7xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-6">Sản phẩm</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6">
        {products.length === 0 && <div>Không có sản phẩm</div>}
        {products
          .filter((p) => p.is_Active !== false) // show only active products by default
          .map((p) => (
          <div key={p._id || p.id || p.name} className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Link to={`/san-pham/${p._id || p.id}`} className="block">
              <div className="h-44 bg-slate-100 flex items-center justify-center overflow-hidden relative">
                {/* prefer backend image_url if provided */}
                {p.image_url || p.image ? (
                  <img src={p.image_url || p.image} alt={p.name} className="object-contain h-full w-full" />
                ) : (
                  <div className="text-sm text-slate-400">No image</div>
                )}

                {/* badge for out of stock or inactive */}
                {p.quantity !== undefined && p.quantity <= 0 && (
                  <div className="absolute left-2 top-2 bg-red-600 text-white text-xs px-2 py-1 rounded">Hết hàng</div>
                )}
                {p.is_Active === false && (
                  <div className="absolute left-2 top-2 bg-gray-700 text-white text-xs px-2 py-1 rounded">Ngừng bán</div>
                )}
              </div>
            </Link>

            <div className="p-4">
              <h3 className="text-sm font-semibold text-slate-800 truncate">{p.name}</h3>
              <div className="mt-2 flex items-center justify-between">
                <div className="text-lg font-bold text-primary">{typeof p.price === 'number' ? formatVND(p.price) : 'Liên hệ'}</div>
                <Link to={`/san-pham/${p._id || p.id}`}>
                  <Button variant={"outline"}>Xem</Button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <Link to="/san-pham">
          <Button variant={"outline"} className="bg-orange-300 hover:bg-white text-white hover:text-orange-300">Xem tất cả sản phẩm</Button>
        </Link>
      </div>
    </section>
  );
};

export default HomePageProduct;