import React, { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router'

const PhoneIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 013 4.18 2 2 0 015 2h3a2 2 0 012 1.72c.12.9.38 1.77.78 2.58a2 2 0 01-.45 2.11L9.9 9.9a16 16 0 006 6l1.5-1.5a2 2 0 012.11-.45c.81.4 1.68.66 2.58.78A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const MailIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 8.5v7A2.5 2.5 0 005.5 18h13a2.5 2.5 0 002.5-2.5v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 8.5l-9 6-9-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)

const TruckIcon = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 3h13v13H1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M14 8h6l3 3v5h-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
    <circle cx="19.5" cy="18.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
)

const Header = () => {
  const navRef = useRef(null)
  const itemRefs = useRef({})
  const location = useLocation()
  const [indicator, setIndicator] = useState({ left: 0, width: 0, visible: false })

  const moveToEl = (el) => {
    if (!el || !navRef.current) {
      setIndicator((s) => ({ ...s, visible: false }))
      return
    }
    const navRect = navRef.current.getBoundingClientRect()
    const rect = el.getBoundingClientRect()
    const left = rect.left - navRect.left + (navRef.current.scrollLeft || 0)
    const width = rect.width
    setIndicator({ left, width, visible: true })
  }

  // move to active nav item on route change / mount
  useEffect(() => {
    const activeAnchor = navRef.current?.querySelector('a[aria-current="page"]')
    const activeLi = activeAnchor ? activeAnchor.closest('li') : null
    setTimeout(() => moveToEl(activeLi), 0)
    const onResize = () => moveToEl(activeLi)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  const handleMouseLeave = () => {
    const activeAnchor = navRef.current?.querySelector('a[aria-current="page"]')
    const activeLi = activeAnchor ? activeAnchor.closest('li') : null
    moveToEl(activeLi)
  }

  return (
    <header className="w-full">
      {/* Top bar */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 py-4">
            {/* Logo */}
            <div className="flex-shrink-0">
              {/* Replace src with your logo path */}
              <img src="/logo.png" alt="Logo" className="h-14 w-auto" onError={(e)=>{e.currentTarget.src='https://via.placeholder.com/160x60?text=Logo'}} />
            </div>

            {/* Contacts - center, hidden on very small screens */}
            <div className="flex-1 flex justify-center space-x-8 text-slate-700 text-sm hidden sm:flex">
              <div className="flex items-center gap-3">
                <PhoneIcon className="w-6 h-6 text-teal-600" />
                <div>
                  <div className="text-xs">Hotline: Hỗ Trợ 24/7</div>
                  <div className="font-semibold">0xxx xxx xxx</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MailIcon className="w-6 h-6 text-teal-600" />
                <div>
                  <div className="text-xs">Email: Hỗ Trợ</div>
                  <div className="font-semibold">xxx@gmail.com</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <TruckIcon className="w-6 h-6 text-teal-600" />
                <div>
                  <div className="text-xs">Vận Chuyển</div>
                  <div className="font-semibold">Miễn phí toàn quốc</div>
                </div>
              </div>
            </div>

            {/* Search on the right */}
            <div className="flex-shrink-0">
              <form className="flex items-center bg-white shadow-sm rounded-md border border-slate-200">
                <input
                  className="px-3 py-2 w-56 sm:w-64 focus:outline-none text-sm"
                  placeholder="Tìm kiếm sản phẩm..."
                  aria-label="Tìm kiếm sản phẩm"
                />
                <button type="submit" className="px-3 text-slate-600">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="10.5" cy="10.5" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
                  </svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation bar */}
      <div className="bg-teal-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center h-12 text-white">
            <ul ref={navRef} className="flex space-x-8 mx-auto relative" onMouseLeave={handleMouseLeave}>
              <li className="py-2" ref={(el)=>itemRefs.current.home = el} onMouseEnter={()=>moveToEl(itemRefs.current.home)}>
                <NavLink to="/" end className="px-1">Trang Chủ</NavLink>
              </li>
              <li className="py-2" ref={(el)=>itemRefs.current.about = el} onMouseEnter={()=>moveToEl(itemRefs.current.about)}>
                <NavLink to="/gioi-thieu" className="px-1">Giới Thiệu</NavLink>
              </li>
              <li className="py-2" ref={(el)=>itemRefs.current.products = el} onMouseEnter={()=>moveToEl(itemRefs.current.products)}>
                <NavLink to="/san-pham" className="px-1">Sản Phẩm</NavLink>
              </li>
              <li className="py-2" ref={(el)=>itemRefs.current.promo = el} onMouseEnter={()=>moveToEl(itemRefs.current.promo)}>
                <NavLink to="/chiet-khau" className="px-1">Chiết khấu</NavLink>
              </li>
              <li className="py-2" ref={(el)=>itemRefs.current.contact = el} onMouseEnter={()=>moveToEl(itemRefs.current.contact)}>
                <NavLink to="/lien-he" className="px-1">Liên Hệ</NavLink>
              </li>

              {/* indicator */}
              <li aria-hidden className="absolute left-0 bottom-0 pointer-events-none">
                <div style={{
                  transform: `translateX(${indicator.left}px)`,
                  width: indicator.width ? `${indicator.width}px` : 0,
                  transition: 'transform 200ms ease, width 200ms ease',
                  height: 3,
                  borderRadius: 4,
                  background: '#facc15',
                  opacity: indicator.visible ? 1 : 0
                }} />
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  )
}

export default Header
