import React, { useEffect, useState } from "react";
import {
  Truck,
  LayoutDashboard,
  TrendingUp,
  Package,
  Users,
  Loader2
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
import apiClient from "@/utils/api-user"; // Đảm bảo đường dẫn này đúng với dự án của bạn

/* =========================================================================================
   DASHBOARD ADMIN COMPONENT (REAL-TIME DATA)
   ========================================================================================= */
const DashboardAdmin: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    stats: {
      totalRevenue: number;
      totalOrders: number;
      totalProducts: number;
      totalUsers: number;
    };
    chartData: { name: string; revenue: number }[];
    topProducts: { name: string; sales: number; revenue: number }[];
  }>({
    stats: { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalUsers: 0 },
    chartData: [],
    topProducts: [],
  });

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
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex items-start justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-gray-500 text-sm font-medium uppercase mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-gray-800">{value}</h4>
        <p className={`text-xs mt-2 font-medium ${colorClass}`}>{sub}</p>
      </div>
      <div className={`p-3 rounded-lg bg-gray-50 text-gray-600`}>
        <Icon size={24} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 4 Thẻ thống kê nhanh lấy từ API */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Biểu đồ doanh thu thực tế */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Doanh thu 7 ngày qua</h3>
          <div style={{ width: '100%', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} 
                       tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}
                  formatter={(value: any) => formatVND(value)}
                />
                <Bar dataKey="revenue" fill="#ea580c" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 sản phẩm từ API */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-6">Bán chạy nhất</h3>
          <div className="space-y-4">
            {data.topProducts.length > 0 ? (
              data.topProducts.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg border border-transparent hover:border-gray-100 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-400">#{idx + 1}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 line-clamp-1">{prod.name}</p>
                      <p className="text-xs text-gray-500">{prod.sales} sản phẩm</p>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-orange-600">
                    {new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(prod.revenue)}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-sm py-10">Chưa có dữ liệu bán hàng</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardAdmin;