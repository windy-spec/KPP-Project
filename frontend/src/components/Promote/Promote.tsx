import React from 'react';
import { ShieldCheck, Truck, Percent, Headphones, Gift, RefreshCcw, Loader2 } from 'lucide-react';

type Benefit = {
  icon: React.ReactNode;
  title: string;
  desc: string;
};

// Kiểu dữ liệu chương trình khuyến mãi lấy từ backend /api/saleprogram
type BackendDiscount = { _id: string; name?: string; discount_percent?: number };
// Match DiscountPage SaleProgram type (uses `thumbnail` for image)
type SaleProgram = {
  _id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  isActive: boolean;
  thumbnail?: string;
  discounts?: { _id: string; name: string; discount_percent: number }[];
};

type PromotionCard = {
  title: string;
  desc: string;
  discountLabel?: string;
  expires?: string;
  highlight?: boolean;
  imageUrl?: string | null;
};

const benefits: Benefit[] = [
  {
    icon: <ShieldCheck className="w-8 h-8 text-green-600" />,
    title: 'Sơn chính hãng 100%',
    desc: 'Nguồn hàng trực tiếp từ nhà sản xuất – bảo đảm tem, mã lô, hạn dùng rõ ràng.'
  },
  {
    icon: <Truck className="w-8 h-8 text-blue-600" />,
    title: 'Giao hàng siêu nhanh',
    desc: 'Nội thành TP.HCM & Hà Nội: nhận trong 2–6 giờ, ngoại tỉnh 1–3 ngày.'
  },
  {
    icon: <Percent className="w-8 h-8 text-red-600" />,
    title: 'Giá ưu đãi minh bạch',
    desc: 'Chiết khấu rõ ràng theo dung tích & dòng sản phẩm, không phí ẩn.'
  },
  {
    icon: <Headphones className="w-8 h-8 text-purple-600" />,
    title: 'Tư vấn màu sắc miễn phí',
    desc: 'Đội ngũ kỹ thuật hỗ trợ phối màu, chọn hệ sơn phù hợp từng bề mặt.'
  },
  {
    icon: <Gift className="w-8 h-8 text-pink-600" />,
    title: 'Quà tặng theo đơn',
    desc: 'Tặng cọ, bạt phủ hoặc thẻ giảm giá cho đơn trên mức quy định.'
  },
  {
    icon: <RefreshCcw className="w-8 h-8 text-orange-600" />,
    title: 'Đổi trả dễ dàng',
    desc: 'Hỗ trợ đổi trong 07 ngày nếu hàng lỗi do vận chuyển hoặc nhà sản xuất.'
  }
];

const SERVER_BASE_URL = 'http://localhost:5001';

// Helper to normalize image path similar to DiscountPage.getFullImageUrl
const getFullImageUrl = (path?: string) => {
  const DEFAULT = `${SERVER_BASE_URL}/uploads/z7202827791249_3f9f56e84a986117c7fd0030d0bb593a.jpg`;
  if (!path) return DEFAULT;
  if (path.startsWith("http")) return path;
  let clean = path.replace(/\\/g, "/");
  if (!clean.startsWith("/")) clean = `/${clean}`;
  clean = clean.replace(/^\/public/, "");
  return `${SERVER_BASE_URL}${clean}`;
};

const Promote: React.FC = () => {
  const [programs, setPrograms] = React.useState<SaleProgram[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchPrograms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/saleprogram`);
        if (!res.ok) throw new Error('Không tải được khuyến mãi');
        const data: SaleProgram[] = await res.json();
        // Debug: log response so we can inspect thumbnail fields in browser console
        // (remove this log when verified)
        // eslint-disable-next-line no-console
        console.debug("/api/saleprogram ->", data);
        if (mounted) setPrograms(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (mounted) setError(e.message || 'Lỗi tải dữ liệu');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPrograms();
    return () => { mounted = false; };
  }, []);

  const mappedPromotions: PromotionCard[] = React.useMemo(() => {
    // Lấy tối đa 3 chương trình mới nhất để mỗi card to hơn
      return programs.slice(0, 3).map((p) => {
      const firstDiscount = p.discounts && p.discounts[0];
      const percent = firstDiscount?.discount_percent;
      // Hiển thị thời gian hết hạn nếu có end_date
      let expiresLabel = '';
      if (p.end_date) {
        try {
          const end = new Date(p.end_date);
          expiresLabel = 'Hết hạn: ' + end.toLocaleDateString('vi-VN');
        } catch {}
      }
      // Highlight nếu sắp hết hạn (< 7 ngày) hoặc có discount_percent >= 25
      let highlight = false;
      if (p.end_date) {
        const diffDays = (new Date(p.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        highlight = diffDays <= 7;
      }
      if (percent && percent >= 25) highlight = true;

        return {
        title: p.name,
        desc: p.description || 'Chương trình ưu đãi đặc biệt.',
        discountLabel: percent ? `-${percent}%` : (p.isActive ? 'Đang áp dụng' : 'Ngưng'),
        expires: expiresLabel || (p.isActive ? 'Đang diễn ra' : 'Đã kết thúc'),
        // Use `thumbnail` field (same as DiscountPage)
        // Always call getFullImageUrl so we show the default image if thumbnail missing
        imageUrl: getFullImageUrl(p.thumbnail),
        highlight,
      } as PromotionCard;
    });
  }, [programs]);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      {/* Heading */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-800">
          Vì Sao Chọn Chúng Tôi?
        </h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
          Mang đến cho bạn giải pháp sơn toàn diện: chất lượng, tốc độ và dịch vụ hậu mãi vượt trội.
        </p>
      </div>

      {/* Benefit Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {benefits.map((b, idx) => (
          <div
            key={idx}
            className="group bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition relative overflow-hidden"
          >
            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-gray-50 p-3 group-hover:bg-orange-50 transition">
              {b.icon}
            </div>
            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-orange-600 transition">
              {b.title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {b.desc}
            </p>
            <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-gradient-to-br from-orange-500/5 to-red-500/5" />
          </div>
        ))}
      </div>

      {/* Promotions */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
        Khuyến Mãi Gần Đây
        </h2>
        <a href="/chiet-khau" className="text-sm font-medium text-orange-600 hover:text-orange-700">
          Xem tất cả →
        </a>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-10 justify-center"><Loader2 className="animate-spin" /> Đang tải khuyến mãi...</div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded mb-6 text-sm">{error}</div>
      ) : mappedPromotions.length === 0 ? (
        <div className="text-gray-500 italic py-6">Hiện chưa có chương trình khuyến mãi.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {mappedPromotions.map((p, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl border shadow-sm p-6 bg-white flex flex-col justify-between hover:shadow-md transition ${
                p.highlight ? 'border-red-400' : 'border-gray-100'
              }`}
            >
              {p.highlight && (
                <span className="absolute -top-2 left-4 bg-red-600 text-white text-[10px] px-2 py-1 rounded-full shadow">
                  HOT
                </span>
              )}
              <div>
                {p.imageUrl && (
                  <div className="mb-4 rounded overflow-hidden h-56 md:h-64 bg-gray-50 flex items-center justify-center">
                    <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">{p.desc}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded">
                  {p.discountLabel}
                </span>
                <span className="text-[11px] text-gray-500 italic">
                  {p.expires}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Promote;