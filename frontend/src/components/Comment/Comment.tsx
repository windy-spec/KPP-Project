import React from "react";
import { Star, Quote, Sparkles } from "lucide-react";

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
}

const Comment: React.FC = () => {
  // Dữ liệu mẫu đánh giá
  const reviews: Review[] = [
    {
      id: 1,
      name: "Cự Lan Hương",
      avatar: "https://i.pravatar.cc/150?img=1",
      rating: 5,
      comment: "KPPaint giao hàng nhanh chóng, tận tình hỗ trợ khách hàng",
    },
    {
      id: 2,
      name: "Sơn Đức Nhân",
      avatar: "https://i.pravatar.cc/150?img=3",
      rating: 5,
      comment:
        "Tôi rất ấn tượng với thái độ nhiệt tình và trách nhiệm của đội ngũ trong quá trình tư vấn khách hàng",
    },
    {
      id: 3,
      name: "Cà Tú Nguyệt",
      avatar: "https://i.pravatar.cc/150?img=5",
      rating: 5,
      comment:
        "Tôi rất hài lòng về chất lượng sản phẩm của KPPaint, sản phẩm chính hãng, uy tín",
    },
  ];

  // Component hiển thị sao đánh giá
  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex gap-0.5 justify-center mb-2.5">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            size={12}
            className={
              index < rating
                ? "fill-yellow-400 text-yellow-400"
                : "fill-gray-200 text-gray-200"
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="relative bg-gradient-to-br from-[#ea580c] via-[#f97316] to-[#ed6a1b] py-10 px-4 overflow-hidden mb-20">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-400/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header Section */}
        <div className="text-left mb-8">
          <p className="text-yellow-400 font-semibold text-sm mb-2">
            Hơn 1000+
          </p>

          <h2 className="text-white text-3xl font-bold mb-3">
            KHÁCH HÀNG CỦA CHÚNG TÔI
          </h2>

          <p className="text-white text-sm max-w-l">
            Đây là một số cảm nhận của khách hàng chúng tôi để lại, các bạn xem
            qua những cảm nhận này nhé...
          </p>
        </div>

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className="group bg-white rounded-xl p-5 shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden"
            >
              {/* Quote Icon */}
              <div className="absolute -bottom-1 -right-1 opacity-20">
                <Quote size={60} className="text-yellow-400 fill-yellow-400" />
              </div>

              <div className="relative z-10">
                {/* Avatar */}
                <div className="flex justify-center mb-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-3 border-yellow-400 shadow-md">
                    <img
                      src={review.avatar}
                      alt={review.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-gray-800 text-center mb-1">
                  {review.name}
                </h3>

                {/* Label */}
                <p className="text-gray-500 text-[11px] text-center mb-2.5">
                  Khách hàng
                </p>

                {/* Star Rating */}
                <StarRating rating={review.rating} />

                {/* Comment */}
                <p className="text-gray-600 text-[11px] leading-relaxed text-center">
                  {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Comment;
