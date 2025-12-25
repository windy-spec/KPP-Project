import React from 'react'
import { Link } from 'react-router-dom'
import { File, X } from 'lucide-react'

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-200 via-orange-300 to-orange-200">
      <div className="absolute inset-0 pointer-events-none">
        <div className="hidden lg:block absolute right-8 bottom-8 w-32 h-32 rounded-full bg-white/10 blur-3xl" />
      </div>

      <main className="relative z-10 w-full max-w-3xl px-6 py-24">
        <div className="mx-auto text-center">
          {/* simple icon */}
          <div className="mx-auto mb-6 relative flex h-28 w-28 items-center justify-center rounded-lg bg-white/10 p-2">
            <File className="h-20 w-20 text-white/90" />
            <div className="absolute -right-1 -bottom-1 rounded-full bg-red-500 p-1">
              <X className="h-4 w-4 text-white" />
            </div>
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-2">404 ERROR</h1>
          <p className="text-xl text-white/90 mb-6">XIN LỖI, TRANG BẠN TÌM KHÔNG TỒN TẠI!</p>

          <div className="flex items-center justify-center gap-4">
            <Link to="/" className="inline-flex items-center rounded-2xl border border-white/80 px-12 py-6 text-white text-xl font-medium hover:bg-white hover:text-orange-300 transition">
              QUAY VỀ TRANG CHỦ
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default NotFound