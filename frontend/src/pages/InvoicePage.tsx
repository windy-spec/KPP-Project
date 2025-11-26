import React from "react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

type InvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  discount?: number;
};

type Invoice = {
  id: string;
  customerName: string;
  date: string;
  items: InvoiceItem[];
  total: number;
};

const sampleInvoice: Invoice = {
  id: "INV-20251126",
  customerName: "Nguyễn Văn A",
  date: "26/11/2025",
  items: [
    { name: "Sản phẩm 1", quantity: 2, price: 500000, discount: 10 },
    { name: "Sản phẩm 2", quantity: 1, price: 300000 },
    { name: "Sản phẩm 3", quantity: 3, price: 150000, discount: 5 },
  ],
  total: 1665000,
};

const formatVND = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const InvoicePage: React.FC = () => {
  const handlePrint = () => {
    window.print();
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const invoiceLink = `${origin}/hoa-don/${sampleInvoice.id}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    invoiceLink
  )}`;

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col print:bg-white">
      <Navbar />

      <main className="flex-1 px-4 py-8 flex justify-center">
        {/* KHUNG HÓA ĐƠN */}
        <div
          className="
            bg-white p-6 shadow-md border
            w-[380px]      /* Chiều rộng hóa đơn ~92mm (wider) */
            font-mono
            print:shadow-none print:border-none
          "
        >
          {/* OUTER BORDER BOX */}
          <div className="border-2 border-gray-200 rounded-md p-3 mb-4">
            {/* HEADER */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <img src="/logo22.svg" alt="logo" className="w-12 h-12" />
                <div>
                  <div className="text-lg font-bold">CỬA HÀNG KPPAINT</div>
                  <div className="text-xs">ĐC: 180 Cao Lỗ Quận 8, Phường 4, TP. Hồ Chí Minh</div>
                  <div className="text-xs">SĐT: 07xx xxx xxx</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-600">Mã hóa đơn</div>
                <div className="text-sm font-semibold">{sampleInvoice.id}</div>
              </div>
            </div>

            {/* INNER BORDER AROUND SENDER/RECIPIENT */}
            <div className="border border-gray-300 rounded-md p-2">
              <div className="grid grid-cols-1 gap-3 mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border p-2 text-xs">
                    <div className="font-semibold mb-1">Từ:</div>
                    <div className="font-medium">CỬA HÀNG KPPAINT</div>
                    <div>ĐC: 180 Cao Lỗ, Quận 8, Phường 4, TP. Hồ Chí Minh</div>
                    <div>SĐT: 07xx xxx xxx</div>
                  </div>

                  <div className="border p-2 text-xs">
                    <div className="font-semibold mb-1">Đến: (Chỉ giao giờ hành chính)</div>
                    <div className="font-medium">{sampleInvoice.customerName}</div>
                    <div>ĐC: (khách cung cấp)</div>
                    <div>SĐT: (khách cung cấp)</div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">Ngày: {sampleInvoice.date}</div>
              </div>
            </div>
          </div>

          {/* DANH SÁCH SẢN PHẨM */}
          <div className="mt-2 text-sm">
            {sampleInvoice.items.map((item, idx) => {
              const finalPrice = item.discount
                ? item.price * (1 - item.discount / 100)
                : item.price;

              return (
                <div key={idx} className="mb-2">
                  <div className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{formatVND(finalPrice * item.quantity)}</span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>
                      SL: {item.quantity} × {formatVND(item.price)}
                    </span>
                    <span>{item.discount ? `Giảm: ${item.discount}%` : ""}</span>
                  </div>
                </div>
              );
            })}
          </div>


          <p>-------------------------------------</p>

          {/* QR code (scan to view invoice online) */}
          <div className="flex justify-center mt-2">
            <div className="text-center">
              <img src={qrSrc} alt={`QR-${sampleInvoice.id}`} className="w-28 h-28" />
              <div className="text-xs text-gray-600">Quét để xem hóa đơn</div>
            </div>
          </div>

          <p>-------------------------------------</p>

          {/* TỔNG TIỀN */}
          <div className="text-right text-base font-bold mt-2">
            Tổng cộng: {formatVND(sampleInvoice.total)}
          </div>

          <p className="mt-4 text-center text-xs">
            Cảm ơn quý khách và hẹn gặp lại!
          </p>

          {/* NÚT IN */}
          <div className="mt-4 text-center print:hidden">
            <Button
              className="bg-orange-500 hover:bg-orange-600 text-white w-full"
              onClick={handlePrint}
            >
              In hóa đơn
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default InvoicePage;
