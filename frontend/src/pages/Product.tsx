import Footer from '@/components/Footer/Footer'
import Navbar from '@/components/Navbar/Navbar'
import Products from '@/components/Product/Products'
import React from 'react'

const Product = () => {
  return (
    <div>
      <div>
        <Navbar/>
      </div>
      <div>
        <Products/>
      </div>
      <div>
        <Footer/>
      </div>
    </div>
  )
}

export default Product