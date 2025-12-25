// frontend/src/pages/AdminPage/SaleProgramPage.tsx
// (Hoặc file nào đang render route /quan-ly/sale của bạn)

import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

// 1. IMPORT COMPONENT BẢNG (NÓ SẼ TỰ GỌI FORM MODAL)
// Hãy đảm bảo đường dẫn này đúng với vị trí file của bạn
import SaleProgramTable from "../../components/Admin/SaleProgramTable";

const SaleProgramPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        {/* 2. Chỉ cần gọi SaleProgramTable vào đây */}
        <SaleProgramTable />
      </div>
      <Footer />
    </>
  );
};

export default SaleProgramPage;
