import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import React from "react";
import Banner from "@/components/Banner/Banner";
import Introduce from "@/components/Introduce/Introduce";
import HomePageProduct from "@/components/Product/HomePageProduct";
import Promote from "@/components/Promote/Promote";
import Comment from "@/components/Comment/Comment";
const HomePage = () => {
  return (
    <>
      <div>
        <Navbar />
      </div>
      <div>
        <Banner />
      </div>
      <div>
        <Introduce />
      </div>
      <div>
        <HomePageProduct />
      </div>
      <div>
        <Promote />
      </div>
      <div>
        <Comment />
      </div>
      <div>
        <Footer />
      </div>
    </>
  );
};

export default HomePage;
