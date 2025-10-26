import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import HomePage from "./pages/HomePage";
import { Toaster } from "sonner";
import ForgetPass from "./pages/ForgetPass";
import ChangePass from "./pages/ChangePass";
import "sweetalert2/dist/sweetalert2.min.css";
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
          <Route path="/changepass" element={<ChangePass />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
