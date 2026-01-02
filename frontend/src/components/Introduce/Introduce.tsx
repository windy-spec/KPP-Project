import React from "react";
import { Link } from "react-router-dom";
import banner1 from "@/assets/background/background1.jpg";
import bgIntroduce from "@/assets/background/background1.jpg";
import introvideo from "@/assets/video/introduce.mp4";
const Introduce: React.FC = () => {
  return (
    <section
      className="max-w-7xl mx-auto px-6 py-16 bg-cover bg-center bg-no-repeat mt-6 rounded-2xl shadow-sm"
      style={{
        backgroundImage: `url(${bgIntroduce})`,
        backgroundBlendMode: "overlay",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* LEFT — VIDEO */}
        <div className="flex justify-center">
          <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-xl border border-white/20 backdrop-blur-sm">
            <video
              src={introvideo}
              poster={banner1}
              className="w-full h-[400px] md:h-[480px] object-cover"
              controls
              playsInline
              autoPlay
              muted
              loop
            />
          </div>
        </div>

        {/* RIGHT — TEXT */}
        <div>
          <h3 className="text-3xl text-yellow-500 font-medium mb-3 tracking-wide">
            Về Chúng Tôi
          </h3>

          <h2 className="text-4xl font-extrabold text-gray-900 leading-tight mb-6">
            CÔNG TY TNHH KPPAINT
          </h2>

          <p className="mb-6 text-lg leading-relaxed text-gray-800 text-justify">
            Công ty TNHH KPPAINT là đơn vị kinh doanh sơn - Là lĩnh vực trọng
            tâm, được chú trọng đầu tư và phát triển. Trong những năm qua, công
            ty đã và đang nỗ lực phân đấu cung cấp những sản phẩm sơn, chất phủ,
            chai xịt...
          </p>

          <p className="mb-10 text-lg leading-relaxed text-gray-800 text-justify">
            Công ty TNHH KPPAINT tự hào là một trong những nhà phân phối của các
            hãng sơn nổi tiếng: Kurobushi (Samurai), Rust oleum, Bosny, sơn công
            nghiệp Thái Dương..
          </p>

          {/* STATS */}
          <div className="grid grid-cols-3 gap-4 mb-10">
            {["Năm Hoạt Động", "Đối Tác"].map((label, i) => (
              <div
                key={i}
                className="group border border-white/30 bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transition-all duration-200 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:bg-white/60"
              >
                <div className="text-3xl font-bold text-gray-900 group-hover:text-orange-400 transition-colors">
                  +0
                </div>
                <div className="text-sm text-gray-700">{label}</div>
              </div>
            ))}
            <div className="group border border-white/30 bg-white/10 backdrop-blur-md rounded-xl p-6 text-center transition-all duration-200 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-xl hover:bg-white/60">
              <div className="text-3xl font-bold text-gray-900 group-hover:text-orange-400 transition-colors">
                +1
              </div>
              <div className="text-sm text-gray-700">Khu Vực Hoạt Động</div>
            </div>
          </div>

          {/* XEM THÊM */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <Link
              to="/gioi-thieu"
              className="inline-block bg-yellow-500 text-white px-7 py-3 rounded-xl font-semibold shadow-lg text-lg hover:bg-yellow-600 transition"
            >
              Xem Thêm
            </Link>

            <div className="flex items-center gap-3 text-base text-gray-800">
              <span>Liên hệ ngay</span>
              <strong className="text-xl">07xx xxx xxx</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Introduce;
