import React from 'react'
import Navbar from '@/components/Navbar/Navbar'

const TermsOfService = () => {
  return (
    <>
        <Navbar/>
        <div className="max-w-5xl mx-auto px-6 py-10 text-gray-800 leading-relaxed">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary uppercase">
          Điều Khoản Dịch Vụ
        </h1>
        
        <p className="mb-4">
          Công ty TNHH <strong>KPPaint</strong> luôn tôn trọng quyền
          riêng tư của Quý khách hàng và cam kết bảo vệ thông tin cá nhân của
          bạn. Thông tin cá nhân được hiểu là các dữ liệu mà bạn cung cấp cho
          chúng tôi như: email, số điện thoại, địa chỉ giao hàng và các thông
          tin liên quan khác theo quy định của pháp luật.
        </p>

        <p className="mb-4">
          Khi bạn truy cập và sử dụng trang web của chúng tôi, điều đó đồng
          nghĩa với việc bạn hoàn toàn đồng ý với các điều khoản được nêu trong
          Chính sách bảo mật này.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            1. Mục đích và phạm vi thu thập thông tin
          </h2>
          <p className="mb-4">
            KPPaint chỉ thu thập và xử lý những thông tin cần thiết để
            thực hiện các giao dịch giữa khách hàng và website, không thu thập
            thêm bất kỳ dữ liệu nào khác. Thông tin của khách hàng sẽ được lưu
            trữ khi khách hàng đăng ký mua hàng, sử dụng dịch vụ hoặc yêu cầu tư
            vấn, giải đáp thắc mắc.
          </p>
          <p>
            Chúng tôi cam kết thu thập và sử dụng thông tin cá nhân vì mục đích
            chính đáng, tuân thủ quy định pháp luật. Mọi thông tin sẽ được sử
            dụng <strong>chỉ trong nội bộ công ty</strong> và{" "}
            <strong>không chia sẻ cho bên thứ ba vì mục đích lợi nhuận</strong>.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            2. Phạm vi sử dụng thông tin
          </h2>
          <p className="mb-4">
            Thông tin cá nhân của khách hàng chỉ được sử dụng trong nội bộ{" "}
            <strong>KPPaint</strong> cho các mục đích sau:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Cung cấp sản phẩm, dịch vụ đến người tiêu dùng.</li>
            <li>Gửi thông báo, trao đổi thông tin liên quan đến giao dịch.</li>
            <li>
              Ngăn ngừa các hành vi gian lận, chiếm đoạt tài khoản hoặc giả mạo
              khách hàng.
            </li>
            <li>Liên hệ và giải quyết khiếu nại của khách hàng.</li>
            <li>Xác nhận, xử lý và hoàn tất các giao dịch mua bán.</li>
            <li>
              Thực hiện nghĩa vụ cung cấp thông tin theo yêu cầu của cơ quan nhà
              nước có thẩm quyền.
            </li>
          </ul>
          <p className="mt-4 italic">
            * Lưu ý: Chúng tôi không chịu trách nhiệm trong trường hợp khách
            hàng tự để lộ thông tin cá nhân cho bên thứ ba khi sử dụng website{" "}
            <strong>kppaint.com</strong>.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            3. Thời gian lưu trữ thông tin
          </h2>
          <p>
            Thông tin của khách hàng sẽ được lưu giữ cho đến khi khách hàng thay
            đổi, yêu cầu xóa dữ liệu hoặc chỉ trong thời gian cần thiết để thực
            hiện các mục đích thu thập thông tin.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            4. Cung cấp thông tin cho bên thứ ba
          </h2>
          <p className="mb-4">
            Khách hàng đồng ý rằng, trong một số trường hợp cần thiết, các cơ
            quan, tổ chức hoặc cá nhân sau có quyền tiếp cận thông tin cá nhân:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Ban quản trị và nhân viên Công ty TNHH KPPaint</li>
            <li>
              Các bên thứ ba có dịch vụ tích hợp với website
              <strong> kppaint.com</strong>
            </li>
            <li>Đơn vị vận chuyển liên kết để giao hàng</li>
            <li>Cố vấn tài chính, pháp lý, đơn vị kiểm toán của công ty</li>
            <li>Bên khiếu nại có bằng chứng về hành vi vi phạm</li>
            <li>Cơ quan nhà nước có thẩm quyền theo quy định pháp luật</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            5. Đơn vị thu thập và quản lý thông tin cá nhân
          </h2>
          <p>
            Mọi thông tin cá nhân được thu thập và quản lý bởi{" "}
            <strong>Công ty TNHH KPPaint</strong>.  
            Chúng tôi chịu hoàn toàn trách nhiệm trong việc bảo mật và quản lý
            thông tin theo quy định của pháp luật.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            6. Quyền truy cập và chỉnh sửa thông tin
          </h2>
          <p>
            Khách hàng có thể truy cập, chỉnh sửa hoặc yêu cầu cập nhật/xóa
            thông tin cá nhân của mình theo hướng dẫn mà KPPaint cung
            cấp. Chúng tôi cũng có thể chủ động liên hệ với khách hàng để xác
            nhận hoặc điều chỉnh thông tin khi cần thiết.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            7. Cam kết bảo mật thông tin
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Việc thu thập và sử dụng thông tin chỉ được thực hiện khi có sự
              đồng ý của khách hàng, trừ trường hợp pháp luật quy định khác.
            </li>
            <li>
              Không chuyển giao, tiết lộ hay cung cấp thông tin cho bên thứ ba
              khi chưa có sự chấp thuận của khách hàng.
            </li>
            <li>
              Nếu hệ thống bị tấn công bởi hacker gây mất mát dữ liệu, chúng tôi
              sẽ phối hợp với cơ quan chức năng điều tra và thông báo cho khách
              hàng.
            </li>
            <li>
              Mọi thông tin giao dịch trực tuyến được mã hóa và lưu trữ an toàn
              tại trung tâm dữ liệu của KPPaint.
            </li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-orange-400">
            8. Tiếp nhận và giải quyết khiếu nại
          </h2>
          <p className="mb-2">
            Nếu khách hàng phát hiện thông tin cá nhân bị sử dụng sai mục đích
            hoặc vượt quá phạm vi cho phép, vui lòng liên hệ:
          </p>
          <p>
            📧 <strong>Email:</strong>{" "}
            <a
              href="mailto:Dochauminh87@gmail.com"
              className="text-blue-600 hover:underline"
            >
              mab30367@gmail.com
            </a>
          </p>
          <p>
            📞 <strong>Hotline:</strong>{" "}
            <a
              href="tel:0xxxxxxxxx"
              className="text-blue-600 hover:underline"
            >
              0707 739 679
            </a>
          </p>
          <p className="mt-2">
            Ban quản trị sẽ nhanh chóng xem xét, phản hồi và giải quyết vấn đề
            trong thời gian sớm nhất.
          </p>
        </section>
      </div>
    </>
  )
}

export default TermsOfService