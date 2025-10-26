import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import ForgetPass from "./pages/ForgetPass";
import ChangePass from "./pages/ChangePass";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ProtectChangePassRoute from "./components/ProtectChangePassRoute";
function App() {
  return (
    <>
      <Toaster richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forget" element={<ForgetPass />} />
          <Route path="/chinh-sach-bao-mat" element={<PrivacyPolicy />} />
          <Route path="/dieu-khoan-dich-vu" element={<TermsOfService />} />
          <Route
            path="/changepass"
            element={
              <ProtectChangePassRoute>
                <ChangePass />
              </ProtectChangePassRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
