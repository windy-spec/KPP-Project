import React from 'react'
import Header from '../components/Header'
import Banner from '../components/Banner'
import Footer from '../components/Footer'

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="mt-6">
          <Banner />
      </main>

      <div className="mt-500">
        <Footer />
      </div>
    </div>
  )
}

export default HomePage
