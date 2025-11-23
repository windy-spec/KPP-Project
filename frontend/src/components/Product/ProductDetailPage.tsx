import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { Heart, Share2, Minus, Plus, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast"; // 🚨 Cần cài đặt: npm install react-hot-toast
import MiniCart from "../Cart/MiniCart";

// --- CONFIG SERVER ---
const SERVER_BASE_URL = "http://localhost:5001";

// --- Type Definitions ---
type Category = {
  _id: string;
  name: string;
  description?: string;
};

type Product = {
  _id: string;
  name: string;
  price: number;
  avatar?: string;
  images?: string[];
  description: string;
  quantity: number; // Tồn kho
  is_Active: boolean;
  category: Category | null;
};

const getFullImageUrl = (path?: string) =>
  path ? (path.startsWith("http") ? path : `${SERVER_BASE_URL}${path}`) : "";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State cho logic thêm giỏ hàng
  const [quantity, setQuantity] = useState<number>(1);
  const [isAdding, setIsAdding] = useState(false); // Loading khi đang thêm
  const [showMiniCart, setShowMiniCart] = useState(false);
  const [miniCartItems, setMiniCartItems] = useState<any[]>([]);

  // UI States
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [triedHighRes, setTriedHighRes] = useState<boolean>(false);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // 1. FETCH PRODUCT
  useEffect(() => {
    if (!id) {
      setError("Không tìm thấy ID sản phẩm.");
      setLoading(false);
      return;
    }

    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${SERVER_BASE_URL}/api/product/${id}`);
        const rawData = res.data;
        const normalizedData = {
          ...rawData,
          avatar: rawData.avatar,
          images: rawData.images || [],
        };

        setProduct(normalizedData as Product);
      } catch (err: any) {
        console.error("Failed to load product detail", err);
        if (err.response && err.response.status === 404) {
          setError("Sản phẩm không tồn tại hoặc đã bị xóa.");
        } else {
          setError(`Lỗi khi tải thông tin sản phẩm: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetail();
  }, [id]);

  // 2. XỬ LÝ ẢNH (Giữ nguyên logic cũ của bạn)
  useEffect(() => {
    if (product?.avatar) {
      setCurrentImage(getFullImageUrl(product.avatar));
    } else if (product?.images && product.images.length > 0) {
      setCurrentImage(getFullImageUrl(product.images[0]));
    } else {
      setCurrentImage(null);
    }
    setTriedHighRes(false);
    setQuantity(1);
  }, [product]);

  const attemptHighRes = (url: string) => {
    // ... (Giữ nguyên logic attemptHighRes cũ của bạn để code gọn hơn) ...
    // Logic cũ của bạn ở đây
    if (!url || triedHighRes) return;
    setTriedHighRes(true);
    // ...
  };

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  // 🚨 3. HÀM THÊM VÀO GIỎ HÀNG (LOGIC MỚI)
  const handleAddToCart = async () => {
    if (!product) return;

    // Check tồn kho sơ bộ phía Client
    if (product.quantity < quantity) {
      toast.error("Số lượng vượt quá tồn kho hiện tại!");
      return;
    }

    try {
      setIsAdding(true);
      const token = localStorage.getItem("accessToken");

      // Gọi API Backend
      await axios.post(
        `${SERVER_BASE_URL}/api/cart/add`,
        {
          productId: product._id,
          quantity: quantity,
        },
        {
          withCredentials: true, // QUAN TRỌNG: Để gửi cookie cho Guest
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      toast.success("Đã thêm vào giỏ hàng thành công!");

      // Update localStorage cart (guest quick UX) so navbars that read localStorage update immediately
      try {
        const raw = localStorage.getItem("cart");
        const cart = raw && Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
        const existingIndex = cart.findIndex((it: any) => it.productId === product._id);
        if (existingIndex >= 0) {
          cart[existingIndex].quantity = (cart[existingIndex].quantity || 0) + quantity;
        } else {
          cart.push({
            productId: product._id,
            name: product.name,
            price: product.price,
            avatar: product.avatar || product.images?.[0] || null,
            quantity,
          });
        }
        localStorage.setItem("cart", JSON.stringify(cart));
        setMiniCartItems(cart.slice(-5).reverse());
        setShowMiniCart(true);
        setTimeout(() => setShowMiniCart(false), 6000);
      } catch (e) {
        // ignore localStorage errors
      }

      // Notify any navbar listeners to update immediately
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.message || "Lỗi khi thêm vào giỏ hàng";
      toast.error(msg);
    } finally {
      setIsAdding(false);
    }
  };

  // --- Render UI ---

  if (loading)
    return (
      <div className="text-center py-20 font-medium text-orange-500">
        Đang tải...
      </div>
    );

  if (error)
    return (
      <div className="text-center py-20 text-xl text-red-600 font-medium">
        {error}
        <div className="mt-4">
          <Link to="/">
            <Button variant="outline">Quay về Trang chủ</Button>
          </Link>
        </div>
      </div>
    );

  if (!product) return null;

  const uniqueImages = Array.from(
    new Set([
      ...(product.avatar ? [product.avatar] : []),
      ...(product.images || []),
    ])
  ).map((p) => getFullImageUrl(p));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />{" "}
      {/* Navbar nên tự lắng nghe event "cartUpdated" nếu muốn số nhảy ngay */}
      <main className="px-4 md:px-8 lg:px-16 max-w-6xl mx-auto py-12 flex-1 w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 border border-gray-100">
          {/* Breadcrumb */}
          <div className="mb-6 text-sm text-gray-500">
            <Link to="/">Trang chủ</Link> /{" "}
            <span className="font-semibold">{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Images */}
            <div className="lg:w-1/2">
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border relative h-[450px]">
                <img
                  ref={imgRef}
                  src={currentImage || "https://placehold.co/600x400"}
                  className="w-full h-full object-cover rounded-lg"
                  onLoad={(e) => {
                    try {
                      const src = (e.target as HTMLImageElement).src;
                      attemptHighRes(src);
                    } catch (err) {
                      // ignore
                    }
                  }}
                />
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                  <button
                    onClick={() => setIsFavorite((v) => !v)}
                    className={`p-2 rounded-full shadow-md ${
                      isFavorite ? "bg-red-500 text-white" : "bg-white"
                    }`}
                  >
                    <Heart
                      size={18}
                      fill={isFavorite ? "currentColor" : "none"}
                    />
                  </button>
                  <button className="p-2 rounded-full bg-white shadow-md">
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
              {/* Thumbnails */}
              {uniqueImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {uniqueImages.map((imgUrl, index) => (
                    <div
                      key={index}
                      onClick={() => setCurrentImage(imgUrl)}
                      className={`w-20 h-20 border-2 rounded-lg cursor-pointer overflow-hidden ${
                        currentImage === imgUrl
                          ? "border-orange-500"
                          : "border-gray-200"
                      }`}
                    >
                      <img
                        src={imgUrl}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Details */}
            <div className="lg:w-1/2 space-y-6">
              <div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {product.category?.name || "Chưa phân loại"}
                </span>
                <h1 className="text-3xl font-bold mt-4">{product.name}</h1>
              </div>
              <span className="text-3xl font-bold text-red-500">
                {formatVND(product.price)}
              </span>
              <p className="text-gray-700">{product.description}</p>

              {/* Quantity Selector */}
              <div className="space-y-3">
                <label className="font-medium">Số lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="w-16 text-center py-3 outline-none"
                    />
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Tổng:{" "}
                    <span className="font-semibold">
                      {formatVND(product.price * quantity)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={isAdding || product.quantity <= 0}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-6 text-lg font-semibold flex items-center justify-center gap-3"
                >
                  {isAdding ? (
                    "Đang xử lý..."
                  ) : (
                    <>
                      <ShoppingCart size={20} /> Thêm vào Giỏ hàng
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className="sm:w-auto px-6 py-6 text-lg border-orange-500 text-orange-500"
                >
                  Mua ngay
                </Button>
              </div>

              <div className="border-t pt-6 text-sm text-gray-600 space-y-2">
                <p>
                  Kho hàng:{" "}
                  <span
                    className={
                      product.quantity > 0 ? "text-green-600" : "text-red-600"
                    }
                  >
                    {product.quantity > 0
                      ? `Còn ${product.quantity}`
                      : "Hết hàng"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>  
      <MiniCart/>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;