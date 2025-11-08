import Footer from "@/components/Footer/Footer";
import Navbar from "@/components/Navbar/Navbar";
import React, { useEffect, useMemo, useState } from "react";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  attributes?: string;
};

const STORAGE_KEY = "cart";
const loadCart = (): CartItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};
const saveCart = (items: CartItem[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
const formatVND = (v: number) => new Intl.NumberFormat("vi-VN").format(Math.max(0, Math.round(v))) + " đ";

const PaymentPage: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>(() => loadCart());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [shipMethod, setShipMethod] = useState("fast");
  const [payMethod, setPayMethod] = useState("cod");

  // Provinces & dependent districts
  const PROVINCES = [
    { code: "HCM", name: "TP. Hồ Chí Minh" },
    { code: "HN", name: "Hà Nội" },
  ];
  const DISTRICTS: Record<string, { value: string; label: string }[]> = {
    HCM: [
      { value: "q1", label: "Quận 1" },
      { value: "q3", label: "Quận 3" },
      { value: "q4", label: "Quận 4" },
      { value: "q5", label: "Quận 5" },
      { value: "q6", label: "Quận 6" },
      { value: "q7", label: "Quận 7" },
      { value: "q8", label: "Quận 8" },
      { value: "q10", label: "Quận 10" },
      { value: "q11", label: "Quận 11" },
      { value: "q12", label: "Quận 12" },
      { value: "binh-tan", label: "Quận Bình Tân" },
      { value: "binh-thanh", label: "Quận Bình Thạnh" },
      { value: "go-vap", label: "Quận Gò Vấp" },
      { value: "phu-nhuan", label: "Quận Phú Nhuận" },
      { value: "tan-binh", label: "Quận Tân Bình" },
    ],
    HN: [
      { value: "ba-dinh", label: "Ba Đình" },
      { value: "hoan-kiem", label: "Hoàn Kiếm" },
      { value: "hai-ba-trung", label: "Hai Bà Trưng" },
      { value: "dong-da", label: "Đống Đa" },
      { value: "tay-ho", label: "Tây Hồ" },
      { value: "cau-giay", label: "Cầu Giấy" },
      { value: "thanh-xuan", label: "Thanh Xuân" },
      { value: "hoang-mai", label: "Hoàng Mai" },
      { value: "long-bien", label: "Long Biên" },
      { value: "ha-dong", label: "Hà Đông" },
      { value: "bac-tu-liem", label: "Bắc Từ Liêm" },
      { value: "nam-tu-liem", label: "Nam Từ Liêm" },
    ],
  };
  const districtOptions = useMemo(() => DISTRICTS[province] || [], [province]);

  useEffect(() => {
    // Có thể preload thông tin người dùng/địa chỉ tại đây nếu đã đăng nhập
  }, []);

  const subTotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);

  const increase = (id: string) => {
    setItems(prev => {
      const next = prev.map(i => (i.id === id ? { ...i, quantity: Math.min(99, i.quantity + 1) } : i));
      saveCart(next);
      return next;
    });
  };
  const decrease = (id: string) => {
    setItems(prev => {
      const next = prev.map(i => (i.id === id ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i));
      saveCart(next);
      return next;
    });
  };

  const placeOrder = () => {
    // Chỗ này bạn có thể gọi API tạo đơn hàng
    // Tạm thời chỉ log dữ liệu
    // console.log({ name, email, phone, address, province, district, note, shipMethod, payMethod, items });
    alert("Đặt hàng thành công (demo)");
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-4 md:py-6">
  <div className="w-4/5 max-w-7xl mx-auto px-4">
          {/* Steps */}
          <div className="bg-white border-0.9 shadow-lg mb-4">
                <div className="text-3xl text-center">
                    <div className="flex items-center justify-center gap-2 px-4 py-3">
                        <span className="font-medium">Thanh Toán</span>
                    </div>
                </div>
            </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* LEFT: Review + Shipping info */}
            <div className="lg:col-span-9">
              {/* Order items */}
              <div className="bg-gray-50 border-0.9 shadow-lg">
                {/* Header */}
                <div className="grid grid-cols-12 px-4 py-3 text-gray-600 text-sm bg-gray-50">
                  <div className="col-span-4">Tên sản phẩm</div>
                  <div className="col-span-2 text-center">Thuộc tính</div>
                  <div className="col-span-2 text-center">Đơn giá</div>
                  <div className="col-span-2 text-center">Số lượng</div>
                  <div className="col-span-2 text-right">Thành tiền</div>
                </div>
                <div className="h-3" />

                {items.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    Chưa có sản phẩm. <a href="/san-pham" className="text-orange-500 underline">Mua sắm ngay</a>
                  </div>
                ) : (
                  <div className="px-4 pb-4 space-y-3">
                    {items.map((it) => (
                      <div key={it.id} className="p-4 bg-white shadow-sm">
                        <div className="grid grid-cols-12 items-center gap-3">
                          {/* Info */}
                          <div className="col-span-4 flex items-center gap-3">
                            <div className="w-16 h-16 border-0.9 overflow-hidden bg-white">
                              <img src={it.image || "/placeholder-100.png"} alt={it.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-gray-800 line-clamp-2">{it.name}</div>
                            </div>
                          </div>
                          {/* Attr */}
                          <div className="col-span-2 text-sm text-gray-600 text-center">{it.attributes || "-"}</div>
                          {/* Unit price */}
                          <div className="col-span-2 text-sm text-center">{formatVND(it.price)}</div>
                          {/* Qty */}
                          <div className="col-span-2">
                            <div className="inline-flex items-center border rounded mx-auto">
                              <button onClick={() => decrease(it.id)} className="px-2 py-1 hover:bg-gray-100" aria-label="Giảm">−</button>
                              <input readOnly value={it.quantity} className="w-10 text-center py-1 border-l border-r" />
                              <button onClick={() => increase(it.id)} className="px-2 py-1 hover:bg-gray-100" aria-label="Tăng">+</button>
                            </div>
                          </div>
                          {/* Total */}
                          <div className="col-span-2 text-right text-red-600 font-semibold">{formatVND(it.price * it.quantity)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer form */}
              <div className="mt-4 bg-white border-0.9 shadow-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="border p-2" placeholder="Họ và tên" value={name} onChange={(e) => setName(e.target.value)} />
                  <input className="border p-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className="border p-2" placeholder="Điện thoại" value={phone} onChange={(e) => setPhone(e.target.value)} />
                  <input className="border p-2" placeholder="Địa chỉ" value={address} onChange={(e) => setAddress(e.target.value)} />
                  <select
                    className="border p-2"
                    value={province}
                    onChange={(e) => {
                      setProvince(e.target.value);
                      setDistrict("");
                    }}
                  >
                    <option value="">Chọn tỉnh thành</option>
                    {PROVINCES.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className={`border p-2 ${!province ? "bg-gray-100 text-gray-500" : ""}`}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    disabled={!province}
                  >
                    <option value="">Chọn quận huyện</option>
                    {districtOptions.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                  <textarea className="md:col-span-2 border p-2 min-h-[80px]" placeholder="Ghi chú" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
              </div>

              {/* Shipping method */}
              <div className="mt-4 bg-white border-0.9 shadow-lg p-4">
                <div className="font-medium mb-2">Phương thức giao hàng</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="ship" value="fast" checked={shipMethod === "fast"} onChange={() => setShipMethod("fast")} />
                    Giao hàng nhanh
                  </label>
                  <p className="text-gray-500 text-xs">
                    Khi chúng tôi nhận được thông tin đặt hàng của bạn, bộ phận hỗ trợ khách hàng sẽ liên hệ báo mức phí vận chuyển đến khu vực của bạn trong thời gian sớm nhất.
                  </p>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="ship" value="economy" checked={shipMethod === "economy"} onChange={() => setShipMethod("economy")} />
                    Giao hàng tiết kiệm
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="ship" value="express" checked={shipMethod === "express"} onChange={() => setShipMethod("express")} />
                    Hỏa tốc
                  </label>
                </div>
              </div>

              {/* Payment method */}
              <div className="mt-4 bg-white border-0.9 shadow-lg p-4">
                <div className="font-medium mb-2">Phương thức thanh toán</div>
                <div className="space-y-2 text-sm text-gray-700">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pay" value="bank" checked={payMethod === "bank"} onChange={() => setPayMethod("bank")} />
                    Thanh toán qua tài khoản ngân hàng
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="pay" value="cod" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} />
                    Thanh toán khi nhận hàng
                  </label>
                </div>
              </div>
            </div>

            {/* RIGHT: Summary */}
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
                <button onClick={placeOrder} disabled={items.length === 0} className="w-full py-2.5 bg-orange-500 hover:bg-orange-700 text-white rounded-md font-medium disabled:opacity-50">
                  THANH TOÁN
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

export default PaymentPage;