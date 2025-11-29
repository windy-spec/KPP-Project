import React from "react";
import {
  IconShieldCheck,
  IconTruck,
  IconHeadphones,
  IconGift,
  IconRefresh,
  IconLoader2,
  IconTicket
} from '@tabler/icons-react';

type Benefit = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  // Nội dung chi tiết khi mở modal (có thể chứa nhiều đoạn)
  details?: string;
  // Danh sách điểm nổi bật hoặc hướng dẫn ngắn
  bullets?: string[];
};

// Kiểu dữ liệu chương trình khuyến mãi lấy từ backend /api/saleprogram
type BackendDiscount = {
  _id: string;
  name?: string;
  discount_percent?: number;
};
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
    icon: <IconShieldCheck className="w-8 h-8 text-green-600" />,
    title: "Sơn chính hãng 100%",
    desc: "Nguồn hàng trực tiếp từ nhà sản xuất – bảo đảm tem, mã lô, hạn dùng rõ ràng.",
    details:
      "Sản phẩm của chúng tôi được nhập khẩu chính hãng, có giấy tờ chứng nhận xuất xứ và tem bảo hành. Mỗi thùng sơn đều được đóng gói theo tiêu chuẩn nhà sản xuất, kèm theo hướng dẫn kỹ thuật rõ ràng.\n\nChúng tôi kiểm tra chất lượng lô hàng trước khi nhập kho và giữ lại mẫu để đối chiếu nếu cần xử lý khiếu nại.",
    bullets: [
      "Tem chống hàng giả và mã lô rõ ràng",
      "Giấy chứng nhận CO/CQ (khi có yêu cầu)",
      "Kiểm tra màu mẫu trước khi giao hàng lớn",
    ],
  },
  {
    icon: <IconTruck className="w-8 h-8 text-blue-600" />,
    title: "Giao hàng siêu nhanh",
    desc: "Nội thành TP.HCM & Hà Nội: nhận trong 2–6 giờ, ngoại tỉnh 1–3 ngày.",
    details:
      "Hệ thống logistic tối ưu giúp rút ngắn thời gian giao nhận: kho nội thành, đội giao hàng chuyên nghiệp và hợp tác với các đối tác vận chuyển uy tín. Với đơn hàng gấp, chúng tôi có dịch vụ giao nhanh trong ngày (có phụ phí tùy khu vực).\n\nBạn sẽ nhận mã theo dõi đơn hàng và thông báo trạng thái tự động qua SMS/Email.",
    bullets: ["Giao trong ngày cho khu vực nội thành", "Theo dõi đơn hàng realtime", "Dịch vụ lắp/đóng gói bảo vệ sản phẩm"],
  },
  {
    icon: <IconTicket className="w-8 h-8 text-red-600" />,
    title: "Giá ưu đãi minh bạch",
    desc: "Chiết khấu rõ ràng theo dung tích & dòng sản phẩm, không phí ẩn.",
    details:
      "Chính sách giá của chúng tôi được công khai theo từng dòng sản phẩm và dung tích. Khách hàng doanh nghiệp, thầu xây dựng sẽ có biểu giá riêng cùng mức chiết khấu theo khối lượng. Mọi khoản phí phát sinh (nếu có) sẽ được thông báo rõ trước khi xác nhận đơn hàng.\n\nChúng tôi cũng cung cấp bảng báo giá chi tiết theo yêu cầu để bạn dễ so sánh và lên ngân sách.",
    bullets: ["Biểu giá dành cho khách lẻ và khách doanh nghiệp", "Ưu đãi theo khối lượng mua", "Không có phí ẩn trên hoá đơn"],
  },
  {
    icon: <IconHeadphones className="w-8 h-8 text-purple-600" />,
    title: "Tư vấn màu sắc miễn phí",
    desc: "Đội ngũ kỹ thuật hỗ trợ phối màu, chọn hệ sơn phù hợp từng bề mặt.",
    details:
      "Chúng tôi cung cấp dịch vụ tư vấn miễn phí qua điện thoại, chat và gặp trực tiếp tại cửa hàng. Kỹ thuật viên có kinh nghiệm sẽ giúp bạn chọn hệ sơn (lót, phủ, hoàn thiện), phối màu và ước lượng số lượng cần dùng.\n\nNgoài ra, dịch vụ phối màu theo mẫu (sample) cho phép bạn xem thử màu trên bề mặt thực tế trước khi thi công.",
    bullets: ["Tư vấn miễn phí qua chat/điện thoại", "Phối màu theo mẫu thực tế", "Hướng dẫn kỹ thuật thi công và bảo dưỡng"],
  },
  {
    icon: <IconGift className="w-8 h-8 text-pink-600" />,
    title: "Quà tặng theo đơn",
    desc: "Tặng cọ, bạt phủ hoặc thẻ giảm giá cho đơn trên mức quy định.",
    details:
      "Chương trình quà tặng được cập nhật theo mùa và từng chiến dịch. Đơn hàng trên mốc giá sẽ được tặng bộ cọ hoặc phụ kiện thi công, ngoài ra có thể nhận các voucher giảm giá cho lần tiếp theo. Mọi chương trình áp dụng đến khi có thông báo mới.\n\nKiểm tra phần mô tả khuyến mãi tại trang thanh toán để biết quà tặng đi kèm từng đơn.",
    bullets: ["Quà tặng theo mốc giá", "Voucher giảm giá cho lần mua tiếp theo", "Khuyến mãi thay đổi theo chiến dịch"],
  },
  {
    icon: <IconRefresh className="w-8 h-8 text-orange-600" />,
    title: "Đổi trả dễ dàng",
    desc: "Hỗ trợ đổi trong 07 ngày nếu hàng lỗi do vận chuyển hoặc nhà sản xuất.",
    details:
      "Nếu sản phẩm bị lỗi kỹ thuật hoặc hư hỏng do vận chuyển, bạn có thể yêu cầu đổi trả trong vòng 7 ngày kể từ ngày nhận hàng. Quy trình đơn giản: gửi hình ảnh, mã lô, và mô tả lỗi; đội ngũ chăm sóc sẽ xác nhận và hướng dẫn đổi trả hoặc hoàn tiền.\n\nVới trường hợp lỗi về màu sắc do sai mẫu, chúng tôi sẽ phối lại hoặc hoàn tiền theo thỏa thuận.",
    bullets: ["Đổi/trả trong 7 ngày cho lỗi nhà sản xuất", "Hoàn tiền nhanh khi không thể đổi", "Hỗ trợ xử lý khiếu nại tận tâm"],
  },
];

const SERVER_BASE_URL = "http://localhost:5001";

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
  // Modal state for benefit details
  const [selectedBenefit, setSelectedBenefit] = React.useState<Benefit | null>(null);
  const [modalOpen, setModalOpen] = React.useState<boolean>(false);

  React.useEffect(() => {
    let mounted = true;
    const fetchPrograms = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${SERVER_BASE_URL}/api/saleprogram`);
        if (!res.ok) throw new Error("Không tải được khuyến mãi");
        const data: SaleProgram[] = await res.json();
        // Debug: log response so we can inspect thumbnail fields in browser console
        // (remove this log when verified)
        // eslint-disable-next-line no-console
        console.debug("/api/saleprogram ->", data);
        if (mounted) setPrograms(Array.isArray(data) ? data : []);
      } catch (e: any) {
        if (mounted) setError(e.message || "Lỗi tải dữ liệu");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchPrograms();
    return () => {
      mounted = false;
    };
  }, []);

  const openBenefit = (b: Benefit) => {
    setSelectedBenefit(b);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBenefit(null);
  };

  const mappedPromotions: PromotionCard[] = React.useMemo(() => {
    // Lấy tối đa 3 chương trình mới nhất để mỗi card to hơn
    return programs.slice(0, 3).map((p) => {
      const firstDiscount = p.discounts && p.discounts[0];
      const percent = firstDiscount?.discount_percent;
      // Hiển thị thời gian hết hạn nếu có end_date
      let expiresLabel = "";
      if (p.end_date) {
        try {
          const end = new Date(p.end_date);
          expiresLabel = "Hết hạn: " + end.toLocaleDateString("vi-VN");
        } catch {}
      }
      // Highlight nếu sắp hết hạn (< 7 ngày) hoặc có discount_percent >= 25
      let highlight = false;
      if (p.end_date) {
        const diffDays =
          (new Date(p.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
        highlight = diffDays <= 7;
      }
      if (percent && percent >= 25) highlight = true;

      return {
        title: p.name,
        desc: p.description || "Chương trình ưu đãi đặc biệt.",
        discountLabel: percent
          ? `-${percent}%`
          : p.isActive
          ? "Đang áp dụng"
          : "Ngưng",
        expires: expiresLabel || (p.isActive ? "Đang diễn ra" : "Đã kết thúc"),
        // Use `thumbnail` field (same as DiscountPage)
        // Always call getFullImageUrl so we show the default image if thumbnail missing
        imageUrl: getFullImageUrl(p.thumbnail),
        highlight,
      } as PromotionCard;
    });
  }, [programs]);

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-12">
      {/* Promotions */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
          Khuyến Mãi Gần Đây
        </h2>
        <a
          href="/chiet-khau"
          className="text-sm font-medium text-orange-600 hover:text-orange-700"
        >
          Xem tất cả →
        </a>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 text-gray-500 py-10 justify-center">
          <IconLoader2 className="animate-spin" /> Đang tải khuyến mãi...
        </div>
      ) : error ? (
        <div className="text-red-600 bg-red-50 border border-red-200 p-4 rounded mb-6 text-sm">
          {error}
        </div>
      ) : mappedPromotions.length === 0 ? (
        <div className="text-gray-500 italic py-6">
          Hiện chưa có chương trình khuyến mãi.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
          {mappedPromotions.map((p, idx) => (
            <div
              key={idx}
              className={`relative rounded-xl border shadow-sm p-6 bg-white flex flex-col justify-between hover:shadow-md transition ${
                p.highlight ? "border-red-400" : "border-gray-100"
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
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {p.desc}
                </p>
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
      
      {/* Heading */}
      <div className="text-center mb-10 mt-10">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-800">
          Vì Sao Chọn Chúng Tôi?
        </h2>
        <p className="mt-3 text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
          Mang đến cho bạn giải pháp sơn toàn diện: chất lượng, tốc độ và dịch
          vụ hậu mãi vượt trội.
        </p>
      </div>

      {/* Benefit Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-14">
        {benefits.map((b, idx) => (
          <button
            key={idx}
            onClick={() => openBenefit(b)}
            type="button"
            className="group text-left bg-white border border-gray-100 rounded-xl p-6 shadow-sm hover:shadow-md transition relative overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-300"
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
          </button>
        ))}
      </div>

      {/* Benefit detail modal */}
      {modalOpen && selectedBenefit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden ">
            <div className="h-40 bg-gradient-to-r from-orange-400 to-red-500 flex items-center px-6">
              <div className="text-white text-5xl mr-4 flex items-center justify-center">
                {selectedBenefit.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-white">{selectedBenefit.title}</h3>
                <p className="text-sm text-white/90 mt-1">Thông tin chi tiết lợi ích</p>
              </div>
              <button onClick={closeModal} className="absolute top-4 right-4 text-white bg-black/20 rounded-full w-8 h-8 flex items-center justify-center">×</button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-auto">
              <p className="text-gray-700 leading-relaxed mb-4">{selectedBenefit.desc}</p>
              {selectedBenefit.details &&
                selectedBenefit.details.split("\n\n").map((para, i) => (
                  <p key={i} className="text-gray-700 leading-relaxed mb-3">
                    {para}
                  </p>
                ))}
              {selectedBenefit.bullets && (
                <ul className="list-disc pl-5 text-gray-700 mt-2 space-y-1">
                  {selectedBenefit.bullets.map((it, i) => (
                    <li key={i}>{it}</li>
                  ))}
                </ul>
              )}
              <div className="mt-4 text-sm text-gray-500">
                <strong>Gợi ý:</strong> Nhấn "Mua Ngay" để xem sản phẩm áp dụng hoặc liên hệ tư vấn miễn phí.
              </div>
            </div>
            <div className="px-6 pb-6 flex justify-end gap-3">
              <button onClick={closeModal} className="px-4 py-2 bg-gray-100 rounded">Đóng</button>
              <a href="/san-pham" className="px-4 py-2 bg-orange-600 text-white rounded">Mua Ngay</a>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Promote;
