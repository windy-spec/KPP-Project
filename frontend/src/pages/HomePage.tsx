import Navbar from '@/components/Navbar/Navbar'
import Footer from '@/components/Footer/Footer'
import React from 'react'
import Banner from '@/components/Banner/Banner'
import Introduce from '@/components/Introduce/Introduce'

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
        <Introduce/>
      </div>
      <div>
        <Footer/>
      </div>
    </>
  )
}

export default HomePage
