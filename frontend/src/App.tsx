import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

// 🏠 Trang người dùng
import HomePage from "./pages/HomePage.tsx";
import Product from "./pages/Product.tsx";
import ProductDetailPage from "./components/Product/ProductDetailPage.tsx";
import IntroducePage from "./pages/IntroducePage.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";

// 🔐 Xác thực
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import ForgetPass from "./pages/ForgetPass.tsx";
import ChangePass from "./pages/ChangePass.tsx";

// ⚙️ Route bảo vệ
import ProtectChangePassRoute from "./components/ProtectRoute/ProtectChangePassRoute.tsx";
import ProtectAdminRoute from "./components/ProtectRoute/ProtectAdminRoute.tsx";
import ProtectManagementRoute from "./components/ProtectRoute/ProtectManagementRoute.tsx";

// 👑 Admin Pages
import Management from "./pages/AdminPage/Management.tsx";
import SaleAdminPage from "./pages/AdminPage/SaleAdminPage.tsx";
import SaleProgramPage from "./pages/AdminPage/SaleProgramPage.tsx";

// ⚙️ Khác
import TokenTest from "./components/test.tsx";
import NotFound from "./pages/NotFound.tsx";
// Import component chi tiết sản phẩm
import UserPage from "./pages/UserPage.tsx";
import useAuthActions from "./utils/authUtility.ts"; // Giả định utility là .tss
import CartPage from "./pages/CartPage.tsx";
import PaymentPage from "./pages/PaymentPage.tsx";
import ContactPage from "./pages/ContactPage.tsx";
import InvoicePage from "./pages/InvoicePage.tsx";
import OrderHistory from "./pages/OrderHistory.tsx";
import DiscountPage from "./pages/DiscountPage.tsx";
const AuthActionInitializer = () => {
  useAuthActions();
  return null;
};

function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <AuthActionInitializer />
        <Routes>
          {/* 🏠 Trang chính */}
          <Route path="/" element={<HomePage />} />

          {/* 🧱 Sản phẩm */}
          <Route path="/san-pham" element={<Product />} />
          <Route path="/san-pham/:id" element={<ProductDetailPage />} />
          <Route
            path="/quan-ly"
            element={
              <ProtectManagementRoute>
                <Management />
              </ProtectManagementRoute>
            }
          />

          <Route
            path="/quan-ly/sale"
            element={
              <ProtectAdminRoute>
                <SaleProgramPage />
              </ProtectAdminRoute>
            }
          />
          <Route
            path="/quan-ly/discount"
            element={
              <ProtectAdminRoute>
                <SaleAdminPage />
              </ProtectAdminRoute>
            }
          />

          {/* 🔐 Auth */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forget" element={<ForgetPass />} />
          <Route path="/san-pham" element={<Product />} />
          <Route path="/tai-khoan" element={<UserPage />} />
          <Route path="/gio-hang" element={<CartPage />} />
          <Route path="/lien-he" element={<ContactPage />} />
          <Route path="/chiet-khau" element={<DiscountPage />} />
          <Route path="/thanh-toan" element={<PaymentPage />} />
          <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
          <Route path="/dieu-khoan-dich-vu" element={<TermsOfService />} />
          <Route path="/gioi-thieu" element={<IntroducePage />} />
          <Route path="/token-test" element={<TokenTest />} />
          <Route path="/invoice/:id" element={<InvoicePage />} />
          <Route path="/order-history" element={<OrderHistory />} />
          {/* 🧰 Đổi mật khẩu */}
          <Route
            path="/changepass"
            element={
              <ProtectChangePassRoute>
                <ChangePass />
              </ProtectChangePassRoute>
            }
          />

          {/* 📄 Chính sách */}
          <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
          <Route path="/dieu-khoan-dich-vu" element={<TermsOfService />} />
          <Route path="/gioi-thieu" element={<IntroducePage />} />

          {/* ❌ 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
