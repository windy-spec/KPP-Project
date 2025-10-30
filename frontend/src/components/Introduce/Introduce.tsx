import React from 'react'
import { Link } from 'react-router-dom'
import banner1 from '@/assets/background/background1.jpg'
import bgIntroduce from '@/assets/background/background1.jpg'

const Introduce: React.FC = () => {
  return (
    <section className="max-w-10xl mx-auto px-4 py-12 bg-cover bg-center bg-no-repeat mt-2"
      style={{ backgroundImage: `url(${bgIntroduce})` }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: video / media */}
        <div className="w-full flex justify-center">
          <div className="w-full max-w-md rounded-lg overflow-hidden shadow-lg">
            {/* Use an actual video if you add one to /public or assets. Fallback to poster image. */}
            <video
              src="/assets/video/intro.mp4"
              poster={banner1}
              className="w-full h-64 md:h-80 object-cover"
              controls
              playsInline
              muted
              loop
            >
              {/* If no video, show poster image */}
              <img src={banner1} alt="Introduce" className="w-full h-64 md:h-80 object-cover" />
            </video>
          </div>
        </div>

        {/* Right: text content */}
        <div>
          <h3 className="text-3xl text-yellow-500 font-medium mb-2">Về Chúng Tôi</h3>
          <h2 className="text-4xl md:text-4xl font-extrabold text-gray-900 mb-4">CÔNG TY TNHH KPPAINT</h2>
          <p className="mb-6 text-lg text-justify">
            Công ty TNHH KPPAINT là đơn vị kinh doanh sơn - Là lĩnh vực trọng tâm, được chú trọng đầu tư và phát triển. Trong những năm qua, công ty đã và đang nỗ lực phân đấu cung cấp những sản phẩm sơn, chất phủ, chai xịt... được áp dụng những công nghệ mới nhất để đáp ứng nhu cầu về chất lượng, tính trung thực của khách hàng và phủ sóng rộng khắp toàn bộ thị trường.
          </p>
          <p className="mb-6 text-lg text-justify">
            Công ty TNHH KPPAINT tự hào là một trong những nhà phân phối của các hãng sơn nổi tiếng : Kurobushi (Samurai), Rust oleum, Bosny, sơn công nghiệp Thái Dương..
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="group border border-gray-500 rounded-lg p-6 text-center bg-transparent transition-all duration-200 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:bg-white lg:hover:bg-white/90 hover:border-gray-200">
              <div className="text-2xl font-bold text-gray-800 group-hover:text-orange-300 transition-colors">+0</div>
              <div className="text-sm text-gray-500">Năm Hoạt Động</div>
            </div>
            <div className="group border border-gray-500 rounded-lg p-6 text-center bg-transparent transition-all duration-200 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:bg-white lg:hover:bg-white/90 hover:border-gray-200">
              <div className="text-2xl font-bold text-gray-800 group-hover:text-orange-300 transition-colors">+0</div>
              <div className="text-sm text-gray-500">Đối Tác</div>
            </div>
            <div className="group border border-gray-500 rounded-lg p-6 text-center bg-transparent transition-all duration-200 ease-out cursor-pointer hover:-translate-y-2 hover:shadow-2xl hover:bg-white lg:hover:bg-white/90 hover:border-gray-200">
              <div className="text-2xl font-bold text-gray-800 group-hover:text-orange-300 transition-colors">+0</div>
              <div className="text-sm text-gray-500">Khu Vực Hoạt Động</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <Link to="/gioi-thieu" className="inline-block bg-yellow-500 text-white px-6 py-2 rounded-md font-medium shadow text-lg">Xem Thêm</Link>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <span className="">Liên hệ ngay</span>
              <strong className="text-lg">07xx xxx xxx</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Introduce