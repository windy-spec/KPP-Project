import React, { useEffect, useState } from "react";
import {
  Truck,
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import apiClient from "@/utils/api-user";

const DashboardAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: {
      totalRevenue: number;
      totalOrders: number;
      totalProducts: number;
      totalUsers: number;
      totalInventory: number;
      stockByCategory?: any[];
    };
    chartData: { name: string; revenue: number }[];
    topProducts: {
      name: string;
      sales: number;
      revenue: number;
      stock: number;
    }[];
  }>({
    stats: {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
      totalInventory: 0,
    },
    chartData: [],
    topProducts: [],
  });

  const [showStockModal, setShowStockModal] = useState(false); // State để mở Form chi tiết

  // Gọi API khi component được mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get("/admin/dashboard-stats");
        if (response.data.success) {
          setData({
            stats: response.data.stats,
            chartData: response.data.chartData,
            topProducts: response.data.topProducts,
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatVND = (value: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-gray-500">
        <Loader2 className="w-10 h-10 animate-spin mb-2" />
        <p>Đang tải dữ liệu thống kê...</p>
      </div>
    );
  }

  // Component phụ cho các thẻ thống kê
  const StatCard = ({
    title,
    value,
    sub,
    colorClass,
    icon: Icon,
  }: {
    title: string;
    value: string;
    sub: string;
    colorClass: string;
    icon: React.ElementType;
  }) => (
    <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
      <div className="mb-2">
        <Icon size={20} className="text-gray-600 mx-auto mb-2" />
        <p className="text-gray-500 text-[10px] font-medium uppercase mb-1 line-clamp-2">
          {title}
        </p>
        <h4 className="text-lg font-bold text-gray-800 line-clamp-1">
          {value}
        </h4>
        <p className={`text-[10px] mt-1 font-medium ${colorClass}`}>{sub}</p>
      </div>
    </div>
  );

  //component hiển thị chi tiết tồn kho theo danh mục
  const StockByCategory = () => (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Chi tiết tồn kho theo danh mục
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Hiển thị số lượng sản phẩm còn lại trong mỗi danh mục
            </p>
          </div>
          <button
            onClick={() => setShowStockModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {data.stats.stockByCategory &&
          data.stats.stockByCategory.length > 0 ? (
            <div className="space-y-3">
              {data.stats.stockByCategory.map((category: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">
                        {category.categoryName ||
                          category.name ||
                          "Danh mục không xác định"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {category.productCount || 0} sản phẩm
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">
                      {category.totalStock || 0}
                    </p>
                    <p className="text-xs text-gray-500">sản phẩm</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-400 font-medium">
                Chưa có dữ liệu tồn kho theo danh mục
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6">
          <button
            onClick={() => setShowStockModal(false)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Modal hiển thị chi tiết tồn kho */}
      {showStockModal && <StockByCategory />}

      {/* 5 Thẻ thống kê nhanh lấy từ API */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          title="Tổng doanh thu"
          value={formatVND(data.stats.totalRevenue)}
          sub="Từ các đơn đã thanh toán"
          colorClass="text-green-600"
          icon={TrendingUp}
        />
        <StatCard
          title="Tổng đơn hàng"
          value={data.stats.totalOrders.toString()}
          sub="Tất cả trạng thái"
          colorClass="text-blue-600"
          icon={Truck}
        />
        <StatCard
          title="Sản phẩm"
          value={data.stats.totalProducts.toString()}
          sub="Trong danh mục kho"
          colorClass="text-orange-600"
          icon={Package}
        />
        <StatCard
          title="Khách hàng"
          value={data.stats.totalUsers.toString()}
          sub="Tài khoản người dùng"
          colorClass="text-purple-600"
          icon={Users}
        />
        <div
          onClick={() => setShowStockModal(true)}
          className="cursor-pointer transition-transform hover:scale-105"
        >
          <StatCard
            title="Tồn kho"
            value={(data.stats.totalInventory || 0).toString()}
            sub="Tổng số lượng sản phẩm"
            colorClass="text-cyan-600"
            icon={LayoutDashboard}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu thực tế */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-6">
            Doanh thu 7 ngày qua
          </h3>
          <div style={{ width: "100%", height: "350px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#9ca3af", fontSize: 12 }}
                  tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip
                  cursor={{ fill: "#f9fafb" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                  }}
                  formatter={(value: any) => [formatVND(value), "Tổng hoá đơn"]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#ea580c"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {/* Top 5 sản phẩm từ API */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-6">
            Sản phẩm có doanh thu cao nhất
          </h3>
          <div className="space-y-4">
            {data.topProducts.length > 0 ? (
              data.topProducts.map((prod, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">
                      #{idx + 1}
                    </span>
                    <div>
                      {/* Phần Tên & Tooltip Tồn Kho */}
                      <div className="relative group">
                        <p className="text-sm font-bold text-gray-800 group-hover:text-orange-600 transition-colors duration-200 line-clamp-1 cursor-help">
                          {prod.name || "Đang cập nhật..."}
                        </p>

                        {/* Tooltip hiện lên khi hover */}
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:flex flex-col items-center animate-in fade-in slide-in-from-bottom-2 duration-200 z-30">
                          <div className="bg-gray-900 text-white text-[11px] py-1.5 px-3 rounded-lg shadow-2xl border border-gray-700 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  prod.stock < 10
                                    ? "bg-red-500 animate-pulse"
                                    : "bg-green-500"
                                }`}
                              />
                              <span className="font-medium">
                                Tồn kho hiện tại: {prod.stock || 0} sản phẩm
                              </span>
                            </div>
                          </div>
                          <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1 border-r border-b border-gray-700"></div>
                        </div>
                      </div>

                      {/* Dòng trạng thái lượt bán & tồn kho nhanh */}
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[11px] text-gray-500 font-medium">
                          {prod.sales} lượt bán
                        </p>
                        <span className="text-gray-300 text-[10px]">|</span>
                        <p
                          className={`text-[11px] font-bold ${
                            prod.stock < 10
                              ? "text-red-500 animate-pulse"
                              : "text-emerald-600"
                          }`}
                        >
                          {prod.stock < 10
                            ? `Sắp hết (Còn ${prod.stock})`
                            : `Còn hàng (${prod.stock})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="text-sm font-bold text-orange-600">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      notation: "compact",
                    }).format(prod.revenue || 0)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-10">
                Chưa có dữ liệu bán hàng
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;
