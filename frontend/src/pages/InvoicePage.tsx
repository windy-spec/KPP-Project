// src/pages/InvoicePage.tsx
import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

const SERVER_BASE_URL = "http://localhost:5001";

// --- TYPE ---
type InvoiceItem = {
  product_id: { _id?: string; name?: string; price?: number } | null;
  quantity: number;
  price?: number;
  discount?: number;
};

type Invoice = {
  _id: string;
  createdAt: string;
  recipient_info: { name: string; phone: string; address: string };
  user?: { email: string };
  items: InvoiceItem[];
  total_amount: number;
  payment_method?: string;
  shipping_fee?: number;
};

// --- HELPER ---
const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateSafe = (dateString: string | undefined) => {
  if (!dateString) return new Date().toLocaleDateString("vi-VN");
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "Ngày không xác định"
    : `${date.getHours()}:${String(date.getMinutes()).padStart(
        2,
        "0"
      )} - ${date.toLocaleDateString("vi-VN")}`;
};

const InvoicePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = localStorage.getItem("accessToken");

  const handlePrint = () => window.print();

  useEffect(() => {
    if (!id) {
      setError("Thiếu ID hóa đơn");
      return;
    }
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${SERVER_BASE_URL}/api/invoice/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setInvoice(res.data);
      } catch (err) {
        setError("Lỗi tải hóa đơn");
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id, token]);

  if (loading)
    return <div className="p-10 text-center animate-pulse">Đang tải...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">{error}</div>;
  if (!invoice) return null;

  // --- TÍNH TOÁN ---
  const subTotalOriginal = invoice.items.reduce((acc, item) => {
    const originalPrice =
      item.product_id?.price && item.product_id.price > 0
        ? item.product_id.price
        : item.price || 0;
    return acc + originalPrice * item.quantity;
  }, 0);
  const shippingFee = invoice.shipping_fee || 0;
  const finalTotal = invoice.total_amount;
  const totalDiscount = Math.max(
    0,
    subTotalOriginal + shippingFee - finalTotal
  );

  // --- DISPLAY VARS ---
  const displayId = invoice._id;
  const displayName =
    invoice.recipient_info?.name || invoice.user?.email || "Khách lẻ";
  const displayPhone = invoice.recipient_info?.phone || "";
  const displayAddress = invoice.recipient_info?.address || "";
  const displayDate = formatDateSafe(invoice.createdAt);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `${
      typeof window !== "undefined" ? window.location.origin : ""
    }/invoice/${id}`
  )}`;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <style>{`@media print { body * { visibility: hidden; } #printable-area, #printable-area * { visibility: visible; } #printable-area { position: absolute; left: 0; top: 0; width: 100%; border: none; } @page { margin: 0; size: auto; } }`}</style>
      <div className="print:hidden">
        <Navbar />
      </div>

      <main className="flex-1 px-4 py-8 flex justify-center">
        <div
          id="printable-area"
          className="bg-white p-6 shadow-md border border-gray-200 w-[380px] font-mono text-sm"
        >
          {/* HEADER */}
          <div className="border-2 border-gray-200 rounded-md p-3 mb-4 print:border-gray-400">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img
                  src="/logo22.svg"
                  alt="logo"
                  className="w-10 h-10 object-contain"
                />
                <div>
                  <div className="text-base font-bold uppercase">KPPAINT</div>
                  <div className="text-[10px] text-gray-500">
                    180 Cao Lỗ, Q.8, HCM
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-gray-500">Mã đơn</div>
                <div className="font-bold text-xs truncate max-w-[80px]">
                  {displayId.slice(-6).toUpperCase()}
                </div>
              </div>
            </div>
            <div className="border border-gray-300 rounded-md p-2 bg-gray-50 text-xs space-y-1 print:bg-white print:border-gray-400">
              <div className="flex justify-between">
                <span className="font-semibold text-gray-600">Khách:</span>
                <span className="font-bold text-gray-800">{displayName}</span>
              </div>
              {displayPhone && (
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-600">SĐT:</span>
                  <span>{displayPhone}</span>
                </div>
              )}
              {displayAddress && (
                <div className="flex justify-between items-start">
                  <span className="font-semibold text-gray-600 w-10 shrink-0">
                    Đ/C:
                  </span>
                  <span className="text-right break-words">
                    {displayAddress}
                  </span>
                </div>
              )}
              <div className="border-t border-dashed border-gray-300 my-1 pt-1 flex justify-between">
                <span className="font-semibold text-gray-600">Ngày:</span>
                <span>{displayDate}</span>
              </div>
            </div>
          </div>

          {/* LIST ITEM - HIỂN THỊ THÀNH TIỀN */}
          <div className="border-t border-b border-dashed border-gray-300 py-2 mb-4">
            <div className="flex justify-between text-[10px] font-bold text-gray-500 mb-2 uppercase">
              <span>Sản phẩm</span>
              <span>Thành tiền</span>
            </div>

            {invoice.items.map((item, idx) => {
              const name = item.product_id?.name || "Sản phẩm";
              const sellPrice =
                item.price && item.price > 0
                  ? item.price
                  : item.product_id?.price || 0;
              const originalPrice =
                item.product_id?.price && item.product_id.price > 0
                  ? item.product_id.price
                  : sellPrice;

              // Tính Thành Tiền của dòng này
              const lineTotal = sellPrice * item.quantity;

              const isDiscounted = originalPrice > sellPrice;
              const discountPercent = isDiscounted
                ? Math.round(
                    ((originalPrice - sellPrice) / originalPrice) * 100
                  )
                : 0;

              return (
                <div
                  key={idx}
                  className="mb-3 last:mb-0 border-b border-gray-100 last:border-0 pb-2"
                >
                  <div className="font-medium mb-1 truncate">{name}</div>

                  <div className="flex justify-between items-end">
                    {/* CỘT TRÁI: Số lượng & Đơn giá */}
                    <div className="text-xs flex items-center gap-1">
                      <span className="font-bold text-gray-600">
                        x{item.quantity}
                      </span>
                      <span className="text-gray-300 mx-1">|</span>
                      {isDiscounted ? (
                        <>
                          <span className="line-through text-gray-400 text-[10px]">
                            {formatVND(originalPrice)}
                          </span>
                          <span className="font-bold">
                            {formatVND(sellPrice)}
                          </span>
                          <span className="text-[9px] text-red-500">
                            (-{discountPercent}%)
                          </span>
                        </>
                      ) : (
                        <span className="font-medium text-gray-600">
                          {formatVND(sellPrice)}
                        </span>
                      )}
                    </div>

                    {/* CỘT PHẢI: THÀNH TIỀN */}
                    <div className="font-bold text-sm text-gray-900">
                      {formatVND(lineTotal)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* SUMMARY */}
          <div className="flex flex-col gap-1 border-b-2 border-gray-200 pb-4 mb-4 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Tổng tiền hàng</span>
              <span>{formatVND(subTotalOriginal)}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá</span>
                <span>-{formatVND(totalDiscount)}</span>
              </div>
            )}
            {shippingFee > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span>+{formatVND(shippingFee)}</span>
              </div>
            )}
            <div className="border-t border-dashed border-gray-300 my-1"></div>
            <div className="flex justify-between items-end">
              <span className="font-bold uppercase text-gray-800 text-sm">
                Tổng thanh toán
              </span>
              <span className="text-xl font-bold text-gray-900">
                {formatVND(finalTotal)}
              </span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-500 mb-4">
            Thanh toán:{" "}
            <span className="font-semibold text-gray-700">
              {invoice.payment_method || "Tiền mặt"}
            </span>
          </div>
          <div className="text-center mb-6">
            <div className="flex justify-center mb-2">
              <img
                src={qrSrc}
                alt="QR"
                className="w-16 h-16 mix-blend-multiply"
              />
            </div>
            <p className="text-xs font-medium">Cảm ơn quý khách!</p>
          </div>

          <div className="space-y-2 print:hidden">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
              onClick={handlePrint}
            >
              IN HÓA ĐƠN
            </Button>
            <Link to="/">
              <Button variant="ghost" className="w-full text-xs text-gray-500">
                Về trang chủ
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </div>
  );
};

export default InvoicePage;
