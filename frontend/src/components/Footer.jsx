import React from 'react'

const Footer = () => {
  return (
    <footer className="bg-teal-900 text-white align-content-center">
      <div className="max-w-7xl mx-auto px-6 py-12">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-semibold mb-4">VỀ CHÚNG TÔI</h3>
            <p className="text-sm text-white/90 mb-4">
              Chuyên kinh doanh về sản phẩm sơn. Đáp ứng mọi nhu cầu của mọi nhà, mọi công trình, giao hàng nhanh
              chóng, tiện lợi, tư vấn nhiệt tình.
            </p>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">THÔNG TIN LIÊN HỆ</h3>
            <p className="text-sm">CÔNG TY TNHH THƯƠNG MẠI KPP</p>
            <p className="text-sm mt-2">Hotline: 0xxx xxx xxx</p>
            <p className="text-sm">Email: xxx@gmail.com</p>
            <p className="text-sm mt-2">Địa Chỉ: 38D Cao Lỗ, Phường Chánh Hưng, Quận 8, TP. HCM</p>
            <div className="flex items-center gap-3 mt-4">
              <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">Fb</div>
              <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">Z</div>
              <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">Yt</div>
              <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">Tk</div>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4">QUY ĐỊNH & CHÍNH SÁCH</h3>
            <ul className="space-y-2 text-sm list-disc list-inside">
              <li>Chính sách và quy định chung</li>
              <li>Chính sách bảo mật thông tin</li>
              <li>Hình thức Thanh toán</li>
              <li>Bảo hành, hoàn trả</li>
              <li>Giao hàng và vận chuyển</li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
