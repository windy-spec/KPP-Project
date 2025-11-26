import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

type InvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  discount?: number; // %
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
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Hóa đơn: {sampleInvoice.id}
          </h2>
          <div className="flex justify-between mb-6">
            <div>
              <p className="text-gray-600">
                <span className="font-semibold">Khách hàng:</span>{" "}
                {sampleInvoice.customerName}
              </p>
              <p className="text-gray-600">
                <span className="font-semibold">Ngày:</span>{" "}
                {sampleInvoice.date}
              </p>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border border-gray-200 rounded-lg">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Sản phẩm
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Số lượng
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-700">Giá</th>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Giảm giá
                  </th>
                  <th className="py-3 px-4 font-medium text-gray-700">
                    Thành tiền
                  </th>
                </tr>
              </thead>
              <tbody>
                {sampleInvoice.items.map((item, idx) => {
                  const finalPrice = item.discount
                    ? item.price * (1 - item.discount / 100)
                    : item.price;
                  return (
                    <tr
                      key={idx}
                      className="border-t border-gray-200 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">{item.name}</td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4">{formatVND(item.price)}</td>
                      <td className="py-3 px-4">
                        {item.discount ? `${item.discount}%` : "-"}
                      </td>
                      <td className="py-3 px-4 font-semibold">
                        {formatVND(finalPrice * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tổng tiền */}
          <div className="mt-6 flex justify-end">
            <div className="text-right">
              <p className="text-gray-700 font-semibold text-lg">
                Tổng cộng: {formatVND(sampleInvoice.total)}
              </p>
              <Button className="mt-2 bg-orange-500 hover:bg-orange-600 text-white">
                In hóa đơn
              </Button>
            </div>
          </div>
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

export default InvoicePage;
