import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import banner1 from "@/assets/banner/banner1.jpg";
import banner2 from "@/assets/banner/banner2.jpg";
import banner3 from "@/assets/banner/banner3.jpg";
import banner4 from "@/assets/banner/banner4.jpg";
import banner5 from "@/assets/banner/banner5.jpg";

const slides = [
  {
    title: "",
    subtitle: "",
    cta: "",
    image: banner1,
  },
  {
    title: "",
    subtitle: "",
    cta: "",
    image: banner2,
  },
  {
    title: "",
    subtitle: "",
    cta: "",
    image: banner3,
  },
  {
    title: "",
    subtitle: "",
    cta: "",
    image: banner4,
  },
  {
    title: "",
    subtitle: "",
    cta: "",
    image: banner5,
  },
];

const Banner: React.FC = () => {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    // autoplay every 4s
    timeoutRef.current = window.setTimeout(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4000);

    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, [index]);

  const goPrev = () => {
    setIndex((i) => (i - 1 + slides.length) % slides.length);
  };

  const goNext = () => {
    setIndex((i) => (i + 1) % slides.length);
  };

  return (
      <div className="max-w-10xl mx-auto px-2 mt-2">
      <div className="relative w-full overflow-hidden h-[220px] sm:h-[300px] md:h-[420px] lg:h-[520px] rounded-lg">
        {slides.map((s, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
            style={{ backgroundImage: `url(${s.image})`, backgroundSize: "cover", backgroundPosition: "center" }}
          />
        ))}

        {/* Arrows */}
        <button
          aria-label="Previous"
          onClick={goPrev}
          className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white z-20"
        >
          <ChevronLeft className="w-5 h-5 text-gray-700" />
        </button>
        <button
          aria-label="Next"
          onClick={goNext}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/90 rounded-full p-2 shadow-md hover:bg-white z-20"
        >
          <ChevronRight className="w-5 h-5 text-gray-700" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`w-3 h-3 rounded-full transition-all ${
                i === index ? "bg-blue-500 w-8 h-3 rounded-full" : "bg-gray-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Banner;