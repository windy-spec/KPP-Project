import { BrowserRouter, Routes, Route } from "react-router-dom";
// Thêm phần mở rộng '.tsx' để đảm bảo trình biên dịch tìm thấy file
import SignInPage from "./pages/SignInPage.tsx";
import SignUpPage from "./pages/SignUpPage.tsx";
import HomePage from "./pages/HomePage.tsx";
import { Toaster } from "sonner";
import ForgetPass from "./pages/ForgetPass.tsx";
import ChangePass from "./pages/ChangePass.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
// Thêm phần mở rộng cho component
import ProtectChangePassRoute from "./components/ProtectRoute/ProtectChangePassRoute.tsx";
import useAuthActions from "./utils/authUtility.ts"; // Giả định utility là .ts
import TokenTest from "./components/test.tsx";
import IntroducePage from "./pages/IntroducePage.tsx";
import NotFound from "./pages/NotFound.tsx";
// Import component chi tiết sản phẩm
import ProductDetailPage from "./components/Product/ProductDetailPage.tsx";
import Product from "./pages/Product.tsx";
import Management from "./pages/AdminPage/Management.tsx";
import ProtectManagementRoute from "./components/ProtectRoute/ProtectManagementRoute.tsx";
import UserPage from "./pages/UserPage.tsx";

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
          <Route path="/" element={<HomePage />} />

          {/* 👇 ROUTE MỚI: Dẫn đến trang chi tiết sản phẩm */}
          <Route path="/san-pham/:id" element={<ProductDetailPage />} />
          <Route
            path="/quan-ly"
            element={
              <ProtectManagementRoute>
                <Management />
              </ProtectManagementRoute>
            }
          />

          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forget" element={<ForgetPass />} />
          <Route path="/san-pham" element={<Product />} />
          <Route path="/tai-khoan" element={<UserPage />} />
          <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
          <Route path="/dieu-khoan-dich-vu" element={<TermsOfService />} />
          <Route path="/gioi-thieu" element={<IntroducePage />} />
          <Route path="/token-test" element={<TokenTest />} />
          <Route
            path="/changepass"
            element={
              <ProtectChangePassRoute>
                <ChangePass />
              </ProtectChangePassRoute>
            }
          />
          {/* Route 404 phải luôn nằm cuối cùng */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
