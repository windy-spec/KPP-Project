import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { TicketPercent } from "lucide-react"; // Import icon khuyến mãi

// --- SERVER CONFIG ---
const SERVER_BASE_URL = "http://localhost:5001";

// 🚨 CẬP NHẬT TYPE KHỚP VỚI LOGIC BACKEND CỦA BẠN
type CartItemBackend = {
  product: {
    _id: string;
    name: string;
    price: number;
    avatar?: string;
    stock?: number;
  };
  quantity: number;

  // Các trường tính toán từ BE
  price_original: number; // Giá gốc (đơn giá)
  price_discount: number; // Giá sau giảm (đơn giá)
  Total_price: number; // Tổng tiền (qty * price_discount)

  // Object chứa thông tin chi tiết khuyến mãi
  applied_discount?: {
    discount_id: string;
    program_name: string; // Tên chương trình (VD: Sale Mùa Hè)
    discount_percent: number; // % Giảm
    saved_amount: number; // Tổng tiền tiết kiệm được cho item này
  } | null;
};

type CartResponse = {
  items: CartItemBackend[];
  total_original_price: number;
  total_discount_amount: number;
  final_total_price: number;
};

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(value))) + " đ";

const getFullImageUrl = (path?: string) =>
  path
    ? path.startsWith("http")
      ? path
      : `${SERVER_BASE_URL}${path}`
    : "/placeholder.png";

const CartPage: React.FC = () => {
  const navigate = useNavigate();

  const [items, setItems] = useState<CartItemBackend[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // State cho phần tổng kết
  const [cartSummary, setCartSummary] = useState({
    original: 0,
    discount: 0,
    final: 0,
  });

  const [loading, setLoading] = useState(true);

  const getConfig = () => {
    const token = localStorage.getItem("accessToken");
    return {
      withCredentials: true,
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    };
  };

  const fetchCart = async () => {
    try {
      const res = await axios.get(`${SERVER_BASE_URL}/api/cart`, getConfig());
      const data: CartResponse = res.data;

      setItems(data.items || []);
      // Lưu thông tin tổng giỏ hàng từ BE trả về
      setCartSummary({
        original: data.total_original_price || 0,
        discount: data.total_discount_amount || 0,
        final: data.final_total_price || 0,
      });
      // Sao chép giỏ hàng từ backend vào localStorage để thanh điều hướng (đọc localStorage) luôn đồng bộ
      try {
        const local = (data.items || []).map((it) => ({
          productId: it.product?._id || (it.product as any)?.id || JSON.stringify(it.product),
          name: it.product?.name || "Sản phẩm",
          price: it.price_discount || it.price_original || it.product?.price || 0,
          avatar: it.product?.avatar || null,
          quantity: it.quantity || 1,
        }));
        localStorage.setItem("cart", JSON.stringify(local));
        // Thông báo cho các thành phần khác (navbar) rằng giỏ hàng đã thay đổi
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        // bỏ qua lỗi localStorage
      }
    } catch (error) {
      console.error("Lỗi tải giỏ hàng", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  // Các hàm xử lý logic (giữ nguyên như cũ)
  const updateQuantity = async (productId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await axios.put(
        `${SERVER_BASE_URL}/api/cart/update`,
        { productId, quantity: newQty },
        getConfig()
      );
      fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Lỗi cập nhật");
    }
  };

  const removeItem = async (productId: string) => {
    try {
      await axios.delete(
        `${SERVER_BASE_URL}/api/cart/remove/${productId}`,
        getConfig()
      );
      toast.success("Đã xóa sản phẩm");
      fetchCart();
      setSelectedIds((prev) => prev.filter((id) => id !== productId));
    } catch (error) {
      toast.error("Lỗi khi xóa");
    }
  };

  const removeSelected = async () => {
    if (selectedIds.length === 0) return;
    try {
      await Promise.all(
        selectedIds.map((id) =>
          axios.delete(`${SERVER_BASE_URL}/api/cart/remove/${id}`, getConfig())
        )
      );
      toast.success("Đã xóa các sản phẩm đã chọn");
      fetchCart();
      setSelectedIds([]);
    } catch (error) {
      toast.error("Có lỗi khi xóa hàng loạt");
    }
  };

  // Logic Select
  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(items.map((i) => i.product._id));
  };
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Tính toán tổng tiền Frontend dựa trên những item ĐƯỢC CHỌN
  const selectedTotals = useMemo(() => {
    const selectedItems = items.filter((i) =>
      selectedIds.includes(i.product._id)
    );

    const original = selectedItems.reduce(
      (sum, i) => sum + i.price_original * i.quantity,
      0
    );
    const final = selectedItems.reduce((sum, i) => sum + i.Total_price, 0);
    const discount = original - final;

    return { original, final, discount };
  }, [items, selectedIds]);

  const proceedCheckout = () => {
    if (selectedIds.length === 0)
      return toast.error("Vui lòng chọn sản phẩm để thanh toán");
    navigate("/thanh-toan");
  };

  if (loading)
    return (
      <div className="min-h-screen flex justify-center items-center text-orange-500 font-medium">
        Đang tải giỏ hàng...
      </div>
    );

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-6">
        <div className="w-full max-w-7xl mx-auto px-2 md:px-4 sm:w-11/12 md:w-11/12 lg:w-[90%]">
          <div className="bg-white border-0.9 shadow-sm mb-4 rounded-lg">
            <div className="text-2xl md:text-3xl text-center py-4 font-bold text-gray-800">
              Giỏ Hàng
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* --- DANH SÁCH SẢN PHẨM --- */}
            <div className="lg:col-span-8">
              <div className="bg-white shadow-sm rounded-lg overflow-hidden">
                {/* Header Table */}
                <div className="hidden md:grid grid-cols-12 px-6 py-4 text-gray-500 font-semibold text-sm bg-gray-50 border-b">
                  <div className="col-span-5 flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleSelectAll}
                      className="accent-orange-500 w-4 h-4 cursor-pointer"
                    />
                    <span>Tất cả ({items.length} sản phẩm)</span>
                  </div>
                  <div className="col-span-2 text-center">Đơn giá</div>
                  <div className="col-span-3 text-center">Số lượng</div>
                  <div className="col-span-2 text-right">Thành tiền</div>
                </div>

                {/* Body Items */}
                <div className="p-4 md:p-0 space-y-4 md:space-y-0">
                  {items.length === 0 ? (
                    <div className="p-10 text-center text-gray-500">
                      <p className="mb-4">Giỏ hàng của bạn đang trống</p>
                      <Link to="/san-pham">
                        <button className="px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition">
                          Mua sắm ngay
                        </button>
                      </Link>
                    </div>
                  ) : (
                    items.map((it) => (
                      <div
                        key={it.product._id}
                        className="flex flex-col md:grid md:grid-cols-12 items-center gap-4 p-4 border-b last:border-b-0 hover:bg-gray-50 transition relative"
                      >
                        {/* Cột 1: Info */}
                        <div className="w-full md:col-span-5 flex items-start gap-4">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(it.product._id)}
                            onChange={() => toggleSelectOne(it.product._id)}
                            className="accent-orange-500 w-4 h-4 mt-8 md:mt-0 cursor-pointer"
                          />
                          <div className="w-24 h-24 flex-shrink-0 border rounded-md overflow-hidden bg-gray-100">
                            <img
                              src={getFullImageUrl(it.product.avatar)}
                              alt={it.product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col gap-1">
                            <Link
                              to={`/san-pham/${it.product._id}`}
                              className="text-sm md:text-base font-medium text-gray-800 line-clamp-2 hover:text-orange-500 transition"
                            >
                              {it.product.name}
                            </Link>

                            {/* 🔥 HIỂN THỊ BADGE KHUYẾN MÃI NẾU CÓ */}
                            {it.applied_discount && (
                              <div className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 border border-red-100 rounded text-xs text-red-600 w-fit mt-1">
                                <TicketPercent size={12} />
                                <span className="font-semibold truncate max-w-[150px]">
                                  {it.applied_discount.program_name} (-
                                  {it.applied_discount.discount_percent}%)
                                </span>
                              </div>
                            )}

                            {/* Nút xóa Mobile */}
                            <button
                              onClick={() => removeItem(it.product._id)}
                              className="md:hidden text-left text-xs text-gray-400 mt-2 hover:text-red-500"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>

                        {/* Cột 2: Đơn giá (Có gạch ngang nếu giảm giá) */}
                        <div className="w-full md:col-span-2 flex md:flex-col justify-between md:justify-center items-center md:text-center text-sm">
                          <span className="md:hidden text-gray-500">
                            Đơn giá:
                          </span>
                          <div>
                            {it.applied_discount ? (
                              <>
                                <div className="text-gray-400 line-through text-xs">
                                  {formatVND(it.price_original)}
                                </div>
                                <div className="font-bold text-gray-900">
                                  {formatVND(it.price_discount)}
                                </div>
                              </>
                            ) : (
                              <div className="font-medium text-gray-900">
                                {formatVND(it.price_original)}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Cột 3: Số lượng */}
                        <div className="w-full md:col-span-3 flex md:justify-center justify-between items-center">
                          <span className="md:hidden text-gray-500 text-sm">
                            Số lượng:
                          </span>
                          <div className="flex items-center border border-gray-300 rounded">
                            <button
                              onClick={() =>
                                updateQuantity(it.product._id, it.quantity - 1)
                              }
                              className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition"
                            >
                              -
                            </button>
                            <input
                              readOnly
                              value={it.quantity}
                              className="w-10 text-center text-sm py-1 border-l border-r outline-none font-medium text-gray-800"
                            />
                            <button
                              onClick={() =>
                                updateQuantity(it.product._id, it.quantity + 1)
                              }
                              className="px-3 py-1 hover:bg-gray-100 text-gray-600 transition"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Cột 4: Thành tiền (Có hiển thị tiết kiệm) */}
                        <div className="w-full md:col-span-2 flex md:flex-col justify-between md:justify-end items-center md:items-end">
                          <span className="md:hidden text-gray-500 text-sm">
                            Thành tiền:
                          </span>
                          <div className="text-right">
                            <div className="text-red-600 font-bold text-base md:text-lg">
                              {formatVND(it.Total_price)}
                            </div>
                            {/* 🔥 HIỂN THỊ SỐ TIỀN TIẾT KIỆM ĐƯỢC */}
                            {it.applied_discount &&
                              it.applied_discount.saved_amount > 0 && (
                                <div className="text-xs text-green-600 font-medium mt-1">
                                  Tiết kiệm:{" "}
                                  {formatVND(it.applied_discount.saved_amount)}
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Nút xóa Desktop */}
                        <button
                          onClick={() => removeItem(it.product._id)}
                          className="hidden md:block absolute top-4 right-4 text-gray-400 hover:text-red-600 transition"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Footer Table (Bulk Actions) */}
                {items.length > 0 && (
                  <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t">
                    <div className="text-sm text-gray-600">
                      Đã chọn:{" "}
                      <b className="text-orange-600">{selectedIds.length}</b>{" "}
                      sản phẩm
                    </div>
                    <button
                      onClick={removeSelected}
                      disabled={selectedIds.length === 0}
                      className="text-red-500 text-sm hover:underline disabled:opacity-50 font-medium"
                    >
                      Xóa mục đã chọn
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* --- SUMMARY SIDEBAR --- */}
            <aside className="lg:col-span-4">
              <div className="bg-white shadow-sm rounded-lg p-4 sticky top-24 border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">
                  Thanh toán
                </h3>

                <div className="space-y-3 text-sm mb-6">
                  <div className="flex justify-between text-gray-500">
                    <span>Tổng tiền hàng:</span>
                    <span>{formatVND(selectedTotals.original)}</span>
                  </div>

                  {/* 🔥 HIỂN THỊ TỔNG GIẢM GIÁ */}
                  {selectedTotals.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá trực tiếp:</span>
                      <span>- {formatVND(selectedTotals.discount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-500">
                    <span>Vận chuyển:</span>
                    <span className="italic">Tính khi thanh toán</span>
                  </div>
                </div>

                <div className="border-t border-dashed pt-4 mb-6">
                  <div className="flex justify-between items-end">
                    <span className="font-bold text-gray-800">
                      Tổng thanh toán:
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-orange-600 leading-none">
                        {formatVND(selectedTotals.final)}
                      </div>
                      <span className="text-xs text-gray-400">
                        (Đã bao gồm VAT)
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={proceedCheckout}
                  disabled={selectedIds.length === 0}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold text-sm uppercase tracking-wide shadow-md hover:shadow-lg transition-all disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed"
                >
                  Mua hàng ({selectedIds.length})
                </button>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default CartPage;
