import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import React from 'react'
import Banner from '@/components/Banner/Banner'

const HomePage = () => {
  return (
    <>
      <div>
        <Navbar/>
      </div>
      <div>
        <Banner/>
      </div>
      <div>
        <Footer/>
      </div>
    </>
  )
}

export default HomePage
