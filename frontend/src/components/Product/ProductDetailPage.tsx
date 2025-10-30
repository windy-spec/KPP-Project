import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { Heart, Share2, Minus, Plus, ShoppingCart } from "lucide-react";

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
  const [quantity, setQuantity] = useState<number>(1);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [triedHighRes, setTriedHighRes] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    // reset image source when product changes
    setImageSrc(product?.image_url ?? null);
    setTriedHighRes(false);
    setQuantity(1);
  }, [product]);

  // Try a few common filename/url patterns to discover a higher-resolution image
  const attemptHighRes = (url: string) => {
    if (!url) return;
    // prevent multiple simultaneous attempts
    if (triedHighRes) return;
    setTriedHighRes(true);

    const candidates: string[] = [];
    // common patterns
    candidates.push(url.replace(/thumb/i, "large"));
    candidates.push(url.replace(/thumbnail/i, "original"));
    candidates.push(url.replace(/-thumb/i, ""));
    candidates.push(url.replace(/_thumb/i, ""));
    candidates.push(url.replace(/small/i, "large"));
    candidates.push(url.replace(/\/thumbs\//i, "/original/"));
    candidates.push(url.replace(/-150x150/i, ""));
    // also try removing query size params
    candidates.push(url.replace(/([?&])size=[^&]*/i, ""));

    // try each candidate in order and use the first that loads
    (async () => {
      for (const candidate of candidates) {
        if (!candidate || candidate === url) continue;
        try {
          await new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject();
            img.src = candidate;
          });
          // if loaded, update source and stop
          setImageSrc(candidate);
          return;
        } catch (e) {
          // ignore and continue
        }
      }
    })();
  };

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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Navbar />

      {/* Page content */}
      <main className="px-4 md:px-8 lg:px-16 max-w-6xl mx-auto py-12 flex-1 w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 border border-gray-100">
          {/* Breadcrumb / Navigation */}
          <div className="mb-6 text-sm text-gray-500">
            <Link to="/" className="hover:text-orange-500 transition-colors">
              Trang chủ
            </Link>
            <span className="mx-2">/</span>
            <Link to="/san-pham" className="hover:text-orange-500 transition-colors">
              Sản phẩm
            </Link>
            <span className="mx-2">/</span>
            <span className="font-semibold text-gray-700">{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: image */}
            <div className="lg:w-1/2 flex items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200 relative">
              <img
                ref={imgRef}
                src={imageSrc ?? product.image_url}
                alt={product.name}
                loading="eager"
                decoding="async"
                className="w-full max-h-[500px] object-contain rounded-lg shadow-md"
                onLoad={(e) => {
                  const naturalWidth = e.currentTarget.naturalWidth || 0;
                  const clientWidth = e.currentTarget.clientWidth || 0;
                  // if the loaded image is smaller than the displayed size, try to find a higher-res variant
                  if (naturalWidth && clientWidth && naturalWidth < clientWidth && !triedHighRes) {
                    attemptHighRes(imageSrc ?? product.image_url);
                  }
                }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://placehold.co/600x400/CCCCCC/333333?text=Không+có+hình+ảnh";
                }}
              />

              {/* Favorite & Share */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <button
                  onClick={() => setIsFavorite((v) => !v)}
                  className={`p-2 rounded-full transition-colors shadow-sm flex items-center justify-center ${
                    isFavorite ? "bg-red-500 text-white" : "bg-white/80 text-gray-600 hover:bg-white"
                  }`}
                  aria-pressed={isFavorite}
                >
                  <Heart size={18} fill={isFavorite ? "currentColor" : "none"} />
                </button>
                <button className="p-2 rounded-full bg-white/80 text-gray-600 hover:bg-white transition-colors shadow-sm">
                  <Share2 size={18} />
                </button>
              </div>
            </div>

            {/* Right: details */}
            <div className="lg:w-1/2 space-y-6">
              <div>
                <div className="inline-block">
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                    {product.category?.name || "Chưa phân loại"}
                  </span>
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight mt-4">
                  {product.name}
                </h1>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-blue-600">
                  {formatVND(product.price)}
                </span>
                <span className="text-sm text-gray-500">(VAT đã bao gồm)</span>
              </div>

              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>

              {/* Quantity selector & total */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">Số lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value || "1", 10);
                        if (!isNaN(val) && val >= 1) setQuantity(val);
                      }}
                      className="w-16 text-center py-3 border-0 focus:ring-0 focus:outline-none"
                      min="1"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-3 hover:bg-gray-50 transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </div>

                  <div className="text-sm text-gray-600">
                    Tổng: <span className="font-semibold">{formatVND(product.price * quantity)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 font-semibold flex items-center justify-center gap-3"
                  disabled={product.quantity <= 0}
                >
                  <ShoppingCart size={18} />
                  Thêm vào Giỏ hàng
                </Button>

                <Button variant={"outline"} className="sm:w-auto px-6 py-3 border-orange-500 text-orange-500 hover:border-orange-400 hover:bg-orange-400 hover:text-white transition-colors">
                  Mua ngay
                </Button>
              </div>

              {/* Additional Info */}
              <div className="border-t pt-6 space-y-3 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>SKU:</span>
                  <span className="font-medium">#{product._id}</span>
                </div>
                <div className="flex justify-between">
                  <span>Kho hàng:</span>
                  <span className={`font-medium ${product.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                    {product.quantity > 0 ? `Còn ${product.quantity}` : "Hết hàng"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Vận chuyển:</span>
                  <span className="font-medium">Miễn phí vận chuyển cho đơn hàng trên 1.000.000₫</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
