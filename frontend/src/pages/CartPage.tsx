import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type CartItem = {
  id: string;
  name: string;
  price: number; // đơn giá (VND)
  quantity: number;
  image?: string;
  attributes?: string; // Thuộc tính hiển thị phụ
};

// Helpers đọc/ghi localStorage
const STORAGE_KEY = "cart";
const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    return [];
  }
};
const saveCart = (items: CartItem[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
};

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(value))) + " đ";

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<CartItem[]>(() => loadCart());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Init: chọn tất cả khi vào trang nếu có hàng
  useEffect(() => {
    setSelectedIds(items.map((i) => i.id));
  }, []);

  // Tính tổng tiền
  const subTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items]
  );

  const allSelected = items.length > 0 && selectedIds.length === items.length;
  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(items.map((i) => i.id));
  };
  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const increase = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i
      );
      saveCart(next);
      return next;
    });
  };
  const decrease = (id: string) => {
    setItems((prev) => {
      const next = prev.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i
      );
      saveCart(next);
      return next;
    });
  };
  const removeOne = (id: string) => {
    setItems((prev) => {
      const next = prev.filter((i) => i.id !== id);
      saveCart(next);
      return next;
    });
    setSelectedIds((prev) => prev.filter((x) => x !== id));
  };
  const removeSelected = () => {
    if (selectedIds.length === 0) return;
    setItems((prev) => {
      const next = prev.filter((i) => !selectedIds.includes(i.id));
      saveCart(next);
      return next;
    });
    setSelectedIds([]);
  };

  const proceedCheckout = () => {
    if (items.length === 0) return;
    // Nếu đã có trang thanh toán, đổi path tại đây
    navigate("/thanh-toan");
  };

  return (
    <>
        <Navbar/>
        <div className="bg-gray-50 min-h-screen py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4">
            {/* Steps */}
            <div className="bg-white border-0.9 shadow-lg mb-4">
                <div className="text-3xl text-center">
                    <div className="flex items-center justify-center gap-2 px-4 py-3">
                        <span className="font-medium">Giỏ Hàng</span>
                    </div>
                </div>
            </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* List */}
            <div className="lg:col-span-9">
            <div className="bg-gray-50 border-0.9 shadow-lg">
                
                {/* Header */}
                <div className="grid grid-cols-12 px-4 py-3 text-gray-600 text-sm bg-gray-50">
                    <div className="col-span-4 flex items-center gap-3">
                    <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="accent-orange-500 w-4 h-4"
                    />
                    <span className="font-medium">
                        Tất cả ({items.length} sản phẩm)
                    </span>
                    </div>
                    <div className="col-span-2 text-center">Thuộc tính</div>
                    <div className="col-span-2 text-center">Đơn giá</div>
                    <div className="col-span-2 text-center">Số lượng</div>
                    <div className="col-span-1 text-right">Thành tiền</div>
                    <div className="col-span-1 flex justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="w-4 h-4 text-gray-400"
                        aria-hidden="true"
                      >
                        <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h3v1h-3V5zm-2 4a1 1 0 0 1 2 0v8a1 1 0 1 1-2 0V9zm5 0a1 1 0 0 1 2 0v8a1 1 0 1 1-2 0V9z" />
                      </svg>
                    </div>
                </div>
                {/* Spacer instead of border line */}
            

        {/* Body */}
        <div className="px-4 pb-4 space-y-3 mt-2">
        {items.length === 0 ? (
          <div className="p-6 text-center text-gray-600">
          Giỏ hàng trống. <Link to="/san-pham" className="text-orange-500 underline">Mua sắm ngay</Link>
          </div>
          
        ) : (
          <div className="px-4 pb-4 space-y-3">
            {items.map((it) => (
                <div key={it.id} className="p-4 bg-white shadow-sm">
                    <div className="grid grid-cols-12 items-center gap-3">
                        {/* Select + Info */}
                        <div className="col-span-4 flex items-center gap-3">
                            <input
                            type="checkbox"
                            checked={selectedIds.includes(it.id)}
                            onChange={() => toggleSelectOne(it.id)}
                            className="accent-orange-500 w-4 h-4"
                            />
                            <div className="w-20 h-20 border-0.9 rounded overflow-hidden bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={it.image || "/placeholder-100.png"}
                                alt={it.name}
                                className="w-full h-full object-cover"
                            />
                            </div>
                            <div className="min-w-0">
                            <div className="font-medium text-gray-800 line-clamp-2">
                                {it.name}
                            </div>
                            </div>
                        </div>
                    
                        {/* Attributes */}
                        <div className="col-span-2 text-sm text-gray-600 text-center">
                            {it.attributes || "-"}
                        </div>

                        {/* Unit price */}
                        <div className="col-span-2 text-sm text-center">{formatVND(it.price)}</div>

                        {/* Qty */}
                        <div className="col-span-2">
                        <div className="inline-flex items-center border rounded mx-auto">
                            <button
                                onClick={() => decrease(it.id)}
                                className="px-2 py-1 hover:bg-gray-100"
                                aria-label="Giảm số lượng"
                            >
                                −
                            </button>
                            <input
                                readOnly
                                value={it.quantity}
                                className="w-10 text-center py-1 border-l border-r"
                            />
                            <button
                                onClick={() => increase(it.id)}
                                className="px-2 py-1 hover:bg-gray-100"
                                aria-label="Tăng số lượng"
                            >
                                +
                            </button>
                            </div>
                        </div>

                        {/* Row total */}
                        <div className="col-span-1 text-right">
                          <span className="text-red-600 font-semibold">
                            {formatVND(it.price * it.quantity)}
                          </span>
                        </div>
                        {/* Row remove */}
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={() => removeOne(it.id)}
                            className="text-gray-500 hover:text-red-600"
                            aria-label="Xoá"
                            title="Xoá sản phẩm"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="w-5 h-5"
                            >
                              <path d="M9 3a1 1 0 0 0-1 1v1H5.5a1 1 0 1 0 0 2H6v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7h.5a1 1 0 1 0 0-2H16V4a1 1 0 0 0-1-1H9zm2 2h3v1h-3V5zm-2 4a1 1 0 0 1 2 0v8a1 1 0 1 1-2 0V9zm5 0a1 1 0 0 1 2 0v8a1 1 0 1 1-2 0V9z" />
                            </svg>
                          </button>
                        </div>
                </div>
            </div>
            ))}
          </div>
          
        )}
        </div>
                </div>

                {/* Bulk actions */}
                <div className="flex items-center justify-between mt-3">
                <div className="text-sm text-gray-600">
                    Đã chọn: <span className="font-medium">{selectedIds.length}</span>
                </div>
                <div className="flex gap-2">
                    <button
                    onClick={removeSelected}
                    disabled={selectedIds.length === 0}
                    className="px-3 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                    Xoá đã chọn
                    </button>
                    <button
                    onClick={() => setSelectedIds([])}
                    disabled={selectedIds.length === 0}
                    className="px-3 py-2 text-sm rounded border hover:bg-gray-50 disabled:opacity-50"
                    >
                    Bỏ đã chọn
                    </button>
                </div>
                </div>
            </div>

            {/* Summary */}
          <aside className="lg:col-span-3">
            <div className="bg-white border-0.9 shadow-lg p-3">
                    <div className="flex items-center justify-between py-2 border-b text-xs">
                                <span>Tạm tính</span>
                                <span>{formatVND(subTotal)}</span>
                            </div>
                    <div className="flex items-center justify-between py-3 text-sm">
                    <span className="font-medium">Thành tiền</span>
                    <span className="text-red-600 font-semibold">{formatVND(subTotal)}</span>
                </div>
                <div className="text-xs text-gray-500 mb-3">(Đã bao gồm VAT nếu có)</div>
                <button
                    onClick={proceedCheckout}
                    disabled={items.length === 0}
                    className="w-full py-2.5 bg-orange-500 hover:bg-orange-700 text-white rounded-md font-medium disabled:opacity-50"
                >
                    THANH TOÁN ĐƠN HÀNG
                </button>
                </div>
            </aside>
            </div>
        </div>
        </div>
        <Footer/>
    </>
  );
};

export default CartPage;