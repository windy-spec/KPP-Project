import React from "react";
import Navbartop from "./Navbartop";
import Navbarbot from "./Navbarbot";
import StickyNav from "./StickyNav";

const Navbar: React.FC = () => {
  return (
    <div className="relative z-50">
      <Navbartop />
      <Navbarbot />
      {/* Chỉ xuất hiện khi scroll */}
      <StickyNav />
    </div>
  );
};

export default Navbar;
