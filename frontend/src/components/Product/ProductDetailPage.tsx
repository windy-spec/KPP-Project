import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom"; // Thêm useNavigate
import { Button } from "@/components/ui/button";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/Footer";
import { Heart, Share2, Minus, Plus, ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";
import MiniCart from "../Cart/MiniCart";

const SERVER_BASE_URL = "http://localhost:5001";

type Category = { _id: string; name: string; description?: string };
type Product = {
  _id: string;
  name: string;
  price: number;
  avatar?: string;
  images?: string[];
  description: string;
  quantity: number;
  is_Active: boolean;
  category: Category | null;
  final_price?: number;
  discount_info?: { percent: number; code: string } | null;
};

const getFullImageUrl = (path?: string) =>
  path ? (path.startsWith("http") ? path : `${SERVER_BASE_URL}${path}`) : "";

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State quantity: Cho phép là string để user xóa rỗng được
  const [quantity, setQuantity] = useState<number | string>(1);

  const [isAdding, setIsAdding] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Lỗi ID");
      setLoading(false);
      return;
    }
    const fetchProductDetail = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${SERVER_BASE_URL}/api/product/${id}`);
        setProduct(res.data);
      } catch (err: any) {
        setError(
          err.response?.status === 404
            ? "Sản phẩm không tồn tại"
            : "Lỗi tải sản phẩm"
        );
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetail();
  }, [id]);

  useEffect(() => {
    if (product?.avatar) setCurrentImage(getFullImageUrl(product.avatar));
    else if (product?.images && product.images.length > 0)
      setCurrentImage(getFullImageUrl(product.images[0]));
    setQuantity(1);
  }, [product]);

  const formatVND = (value: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);

  // --- LOGIC INPUT SỐ LƯỢNG MỚI ---
  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity("");
      return;
    }
    const num = parseInt(val, 10);
    if (isNaN(num)) return;

    if (product && num > product.quantity) {
      setQuantity(product.quantity);
      toast.error(`Chỉ còn ${product.quantity} sản phẩm!`);
    } else {
      setQuantity(num);
    }
  };

  const handleBlurQuantity = () => {
    if (quantity === "" || (typeof quantity === "number" && quantity < 1)) {
      setQuantity(1);
    }
  };

  const decreaseQty = () => {
    setQuantity((prev) => {
      const q = typeof prev === "number" ? prev : 1;
      return Math.max(1, q - 1);
    });
  };

  const increaseQty = () => {
    if (!product) return;
    setQuantity((prev) => {
      const q = typeof prev === "number" ? prev : 1;
      if (q >= product.quantity) {
        toast.error("Đã đạt giới hạn tồn kho");
        return q;
      }
      return q + 1;
    });
  };

  // --- LOGIC MUA NGAY ---
  const handleBuyNow = () => {
    if (!product) return;
    if (product.quantity <= 0) {
      toast.error("Sản phẩm đã hết hàng!");
      return;
    }

    const qtyNumber = typeof quantity === "number" ? quantity : 1;
    const salePrice = product.final_price || product.price;

    navigate("/thanh-toan", {
      state: {
        directBuy: {
          items: [
            {
              product_id: product._id,
              product: product,
              quantity: qtyNumber,
              price_original: product.price,
              price_discount: salePrice,
              Total_price: salePrice * qtyNumber,
            },
          ],
          totalAmount: salePrice * qtyNumber,
        },
      },
    });
  };

  const handleAddToCart = async () => {
    if (!product) return;
    const qtyNumber = typeof quantity === "number" ? quantity : 1;

    if (product.quantity < qtyNumber) {
      toast.error("Quá số lượng tồn kho!");
      return;
    }
    try {
      setIsAdding(true);
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${SERVER_BASE_URL}/api/cart/add`,
        { productId: product._id, quantity: qtyNumber },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      toast.success("Đã thêm vào giỏ!");

      if (!token) {
        try {
          const raw = localStorage.getItem("cart");
          const arr =
            raw && Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
          const idx = arr.findIndex((it: any) => it.productId === product._id);
          if (idx >= 0) {
            arr[idx].quantity = (arr[idx].quantity || 0) + qtyNumber;
          } else {
            arr.push({
              productId: product._id,
              name: product.name,
              price: product.final_price || product.price,
              avatar: product.avatar || product.images?.[0] || null,
              quantity: qtyNumber,
            });
          }
          localStorage.setItem("cart", JSON.stringify(arr));
        } catch (e) {
          console.error(e);
        }
      } else {
        try {
          const cartRes = await axios.get(`${SERVER_BASE_URL}/api/cart`, {
            withCredentials: true,
            headers: { Authorization: `Bearer ${token}` },
          });
          const serverItems = cartRes.data?.items || [];
          const local = serverItems.map((it: any) => ({
            productId:
              it.product?._id ||
              (it.product && it.product.id) ||
              JSON.stringify(it.product),
            name: it.product?.name || "Sản phẩm",
            price:
              it.price_discount || it.price_original || it.product?.price || 0,
            avatar: it.product?.avatar || null,
            quantity: it.quantity || 1,
          }));
          localStorage.setItem("cart", JSON.stringify(local));
        } catch (e) {}
      }

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi thêm giỏ hàng");
    } finally {
      setIsAdding(false);
    }
  };

  if (loading)
    return <div className="text-center py-20 text-orange-500">Đang tải...</div>;
  if (error)
    return <div className="text-center py-20 text-red-600">{error}</div>;
  if (!product) return null;

  const uniqueImages = Array.from(
    new Set([
      ...(product.avatar ? [product.avatar] : []),
      ...(product.images || []),
    ])
  ).map(getFullImageUrl);

  const displayPrice = product.final_price || product.price;
  const qtyNumber = typeof quantity === "number" ? quantity : 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="px-4 md:px-8 lg:px-16 max-w-6xl mx-auto py-12 flex-1 w-full">
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-10 border border-gray-100">
          <div className="mb-6 text-sm text-gray-500">
            <Link to="/">Trang chủ</Link> /{" "}
            <span className="font-semibold">{product.name}</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Image */}
            <div className="lg:w-1/2">
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-xl border relative h-[450px]">
                <img
                  ref={imgRef}
                  src={currentImage || ""}
                  className="w-full h-full object-cover rounded-lg"
                  alt={product.name}
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/600x400";
                  }}
                />
                {product.discount_info && (
                  <div className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full font-bold shadow-lg animate-pulse">
                    Giảm {product.discount_info.percent}%
                  </div>
                )}
              </div>
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

            {/* Right: Chi tiết */}
            <div className="lg:w-1/2 space-y-6">
              <div>
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  {product.category?.name || "Chưa phân loại"}
                </span>
                <h1 className="text-3xl font-bold mt-4">{product.name}</h1>
              </div>

              <div>
                {product.discount_info ? (
                  <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                      <span className="text-xl text-gray-400 line-through">
                        {formatVND(product.price)}
                      </span>
                      <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded text-sm font-bold">
                        -{product.discount_info.percent}%
                      </span>
                    </div>
                    <span className="text-4xl font-bold text-red-600">
                      {formatVND(product.final_price || 0)}
                    </span>
                  </div>
                ) : (
                  <span className="text-3xl font-bold text-red-500">
                    {formatVND(product.price)}
                  </span>
                )}
              </div>

              <p className="text-gray-700">{product.description}</p>

              {/* Input Số Lượng */}
              <div className="space-y-3">
                <label className="font-medium">Số lượng</label>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-lg">
                    <button
                      onClick={decreaseQty}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Minus size={16} />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={quantity}
                      onChange={handleQuantityChange}
                      onBlur={handleBlurQuantity}
                      className="w-16 text-center py-3 outline-none"
                    />
                    <button
                      onClick={increaseQty}
                      className="p-3 hover:bg-gray-50"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="text-sm text-gray-600">
                    Tổng:{" "}
                    <span className="font-semibold">
                      {formatVND(displayPrice * qtyNumber)}
                    </span>
                  </div>
                </div>
              </div>

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

                {/* Nút Mua ngay */}
                <Button
                  variant="outline"
                  onClick={handleBuyNow}
                  disabled={product.quantity <= 0}
                  className="sm:w-auto px-6 py-6 text-lg border-orange-500 text-orange-500 hover:bg-orange-50"
                >
                  Mua ngay
                </Button>
              </div>

              <div className="border-t pt-6 text-sm text-gray-600">
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
      <MiniCart />
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
