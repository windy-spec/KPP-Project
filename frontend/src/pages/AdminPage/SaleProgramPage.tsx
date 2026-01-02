import React from "react";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";

import SaleProgramTable from "../../components/Admin/SaleProgramTable";

const SaleProgramPage: React.FC = () => {
  return (
    <>
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        <SaleProgramTable />
      </div>
      <Footer />
    </>
  );
};

export default SaleProgramPage;
