import React, { useEffect, useRef, useState } from 'react'
import banner1 from '../assets/banner/banner1.jpg'
import banner2 from '../assets/banner/banner2.jpg'
import banner3 from '../assets/banner/banner3.jpg'
import banner4 from '../assets/banner/banner4.jpg'
import banner5 from '../assets/banner/banner5.jpg'

const images = [banner1, banner2, banner3, banner4, banner5]

const Banner = ({ interval = 1500, heightClass = 'h-80 sm:h-96 md:h-[520px] lg:h-[520px]' }) => {
  const [index, setIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    // clear any existing timer
    if (timerRef.current) clearInterval(timerRef.current)

    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setIndex((i) => (i + 1) % images.length)
      }, interval)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isHovered, interval])

  const goTo = (i) => {
    setIndex(i % images.length)
  }

  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length)
  const next = () => setIndex((i) => (i + 1) % images.length)

  return (
    <section
      className="relative w-full overflow-hidden bg-gray-900"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-roledescription="carousel"
    >
      <div className={`relative ${heightClass}`}>
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`Banner ${i + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out ${
              i === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
            style={{ willChange: 'opacity' }}
          />
        ))}
      </div>

      {/* Controls: left/right */}
      <button
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-3 hover:bg-black/60 focus:outline-none touch-manipulation z-50 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-black/40 text-white p-3 hover:bg-black/60 focus:outline-none touch-manipulation z-50 shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Indicators */}
      <div className="absolute left-1/2 bottom-4 -translate-x-1/2 flex items-center gap-3 z-50">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`rounded-full transition-all duration-200 focus:outline-none ${
              i === index ? 'bg-white w-3 h-3 scale-110 ring-1 ring-white/80' : 'bg-white/50 w-2 h-2'
            }`}
          />
        ))}
      </div>
    </section>
  )
}

export default Banner
