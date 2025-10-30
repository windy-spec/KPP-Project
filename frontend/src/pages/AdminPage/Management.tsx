import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Edit3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

const sections = [
  { id: 'products', label: 'Sản phẩm' },
  { id: 'categories', label: 'Danh mục' },
  { id: 'orders', label: 'Đơn hàng' },
  { id: 'users', label: 'Người dùng' },
]

type AdminChildProps = { openFromParent?: boolean; onParentClose?: ()=>void }

type ProductItem = { id: string; name: string; price: number; category?: string; description?: string; image_url?: string }

const Management: React.FC = () => {
  const [active, setActive] = useState<string>('products')
  const [parentModalFor, setParentModalFor] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* full-width admin layout */}
      <div className="w-full bg-white overflow-hidden">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-64 border-r p-6 bg-white h-screen sticky top-0">
            <h3 className="text-lg font-semibold mb-4">Quản trị</h3>
            <nav className="flex flex-col space-y-2">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={`text-left px-3 py-2 rounded-lg transition-colors ${
                    active === s.id ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main content */}
          <main className="flex-1 p-8 min-h-screen">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{sections.find(s => s.id === active)?.label}</h2>

              <div className="flex items-center gap-3">
                <Button onClick={() => setParentModalFor(active)} className="flex items-center gap-2">
                  <Plus size={16} /> Thêm
                </Button>
              </div>
            </div>

            <div className="border rounded-lg p-4 min-h-[320px] bg-white">
              {/* Per-section rendering */}
              {active === 'products' && <ProductsAdmin openFromParent={parentModalFor === 'products'} onParentClose={() => setParentModalFor(null)} />}
              {active === 'categories' && <CategoriesAdmin openFromParent={parentModalFor === 'categories'} onParentClose={() => setParentModalFor(null)} />}
              {active === 'orders' && <OrdersAdmin />}
              {active === 'users' && <UsersAdmin />}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

/* ---------------------- ProductsAdmin ---------------------- */
const ProductsAdmin: React.FC<AdminChildProps> = ({ openFromParent, onParentClose }) => {
  // keep full list in `allItems` and derive the visible page slice
  const [allItems, setAllItems] = useState<ProductItem[]>([])
  const [page, setPage] = useState<number>(1)
  const PAGE_SIZE = 7
  const [name, setName] = useState('')
  const [price, setPrice] = useState<number>(0)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editInline, setEditInline] = useState(false)

  // (No backend integration) products are managed locally in-memory

  // derived items for the current page
  const start = (page - 1) * PAGE_SIZE
  const displayedItems = allItems.slice(start, start + PAGE_SIZE)
  const totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE))

  const goToPage = (n: number) => setPage(Math.min(Math.max(1, n), totalPages))

  useEffect(()=>{
    if (openFromParent) {
      setIsModalOpen(true)
      if (onParentClose) onParentClose()
    }
  },[openFromParent])

  const submit = () => {
    if (!name) {
      toast.error('Vui lòng nhập tên sản phẩm')
      return
    }
    if (editingId) {
      setAllItems((s: ProductItem[]) => s.map((it: ProductItem) => it.id === editingId ? { ...it, name, price, category, description, image_url: imagePreview || it.image_url } : it))
      setEditingId(null)
      toast.success('Cập nhật sản phẩm thành công')
    } else {
      const item: ProductItem = { id: Date.now().toString(), name, price, category, description, image_url: imagePreview || '' }
      setAllItems((s: ProductItem[]) => [item, ...s])
      setPage(1)
      toast.success('Thêm sản phẩm thành công')
    }
    // reset form and close
    setName(''); setPrice(0); setCategory(''); setDescription(''); setImageFile(null); setImagePreview(null)
    setIsModalOpen(false)
  }

  const openEdit = (id: string) => {
    const it = allItems.find(i => i.id === id); if (!it) return
    setEditingId(id);
    setName(it.name);
    setPrice(it.price);
    setCategory(it.category || '');
    setDescription(it.description || '');
    setImagePreview(it.image_url || null);
    setImageFile(null);
    // open modal for editing (pre-filled)
    setEditInline(false)
    setIsModalOpen(true)
  }
  const remove = (id: string) => setAllItems((s) => s.filter(i => i.id !== id))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Danh sách sản phẩm (tổng {allItems.length})</h3>
        <div className="text-sm text-gray-600">Trang {page} / {totalPages}</div>
      </div>

      {editInline && (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <h4 className="text-lg font-semibold mb-3">Sửa sản phẩm</h4>
              <div className="space-y-3">
                <input className="w-full border rounded px-3 py-3" placeholder="Tên sản phẩm" value={name} onChange={e=>setName(e.target.value)} />
                <input type="number" className="w-full border rounded px-3 py-3" placeholder="Giá (VND)" value={price} onChange={e=>setPrice(Number(e.target.value))} />
                <input className="w-full border rounded px-3 py-3" placeholder="Danh mục" value={category} onChange={e=>setCategory(e.target.value)} />
                <textarea className="w-full border rounded px-3 py-3" placeholder="Mô tả" value={description} onChange={e=>setDescription(e.target.value)} rows={6} />
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={()=>{ setEditInline(false); setEditingId(null); setName(''); setPrice(0); setCategory(''); setDescription(''); setImageFile(null); setImagePreview(null) }}>Hủy</Button>
                <Button onClick={()=>{ submit(); setEditInline(false); }}>Lưu</Button>
              </div>
            </div>
            <div className="w-full lg:w-52">
              <div className="mb-3 text-sm font-medium">Ảnh hiện tại</div>
              {imagePreview ? (
                <div className="w-full h-48 rounded overflow-hidden border mb-3">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-48 rounded border flex items-center justify-center text-gray-400 mb-3">Chưa có ảnh</div>
              )}
              <label htmlFor="product-image-input-inline" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border hover:shadow-md cursor-pointer">
                Chọn ảnh mới
              </label>
              <input id="product-image-input-inline" type="file" accept="image/*" className="hidden" onChange={(e)=>{
                const f = e.target.files && e.target.files[0]
                if (f) {
                  setImageFile(f)
                  const url = URL.createObjectURL(f)
                  setImagePreview(url)
                }
              }} />
            </div>
          </div>
        </div>
      )}

      <div className="p-4 border rounded-lg bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="pb-2">Tên</th>
                <th className="pb-2">Giá</th>
                <th className="pb-2">Danh mục</th>
                <th className="pb-2">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {displayedItems.map(it=> (
                <tr key={it.id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="py-3">{it.name}</td>
                  <td className="py-3">{new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(it.price)}</td>
                  <td className="py-3">{it.category}</td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={()=>openEdit(it.id)} className="transition-transform duration-200 hover:scale-[1.02]">Sửa</Button>
                      <Button variant="destructive" onClick={()=>remove(it.id)} className="transition-transform duration-200 hover:scale-[1.02]">Xóa</Button>
                    </div>
                  </td>
                </tr>
              ))}
              {displayedItems.length===0 && <tr><td colSpan={4} className="py-6 text-center text-gray-500">Chưa có sản phẩm</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination controls */}
      <div className="flex items-center justify-between mt-3">
        <div className="text-sm text-gray-600">Tổng {allItems.length} sản phẩm</div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={()=>goToPage(page-1)} disabled={page<=1}>Trước</Button>
          {Array.from({length: totalPages}).map((_, idx) => (
            <button key={idx} onClick={()=>goToPage(idx+1)} className={`px-2 py-1 rounded ${page===idx+1 ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-100'}`}>{idx+1}</button>
          ))}
          <Button variant="outline" size="sm" onClick={()=>goToPage(page+1)} disabled={page>=totalPages}>Sau</Button>
        </div>
      </div>

      {/* Modal for add/edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>{ setIsModalOpen(false); setEditingId(null); if (onParentClose) onParentClose() }} />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 p-6 transition-transform transform">
            <h3 className="text-xl font-semibold mb-4">{editingId ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h3>
            <div className="space-y-4">
              <input className="w-full border rounded px-3 py-3 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Tên sản phẩm" value={name} onChange={e=>setName(e.target.value)} />
              <input type="number" className="w-full border rounded px-3 py-3 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Giá (VND)" value={price} onChange={e=>setPrice(Number(e.target.value))} />
              <input className="w-full border rounded px-3 py-3 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Danh mục" value={category} onChange={e=>setCategory(e.target.value)} />

              <textarea className="w-full border rounded px-3 py-3 transition-shadow duration-200 focus:outline-none focus:ring-2 focus:ring-orange-300" placeholder="Mô tả" value={description} onChange={e=>setDescription(e.target.value)} rows={4} />
              {/* server errors removed when working offline */}

              <div className="flex items-start gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ảnh sản phẩm</label>
                  <div className="flex items-center gap-3">
                    <input id="product-image-input" type="file" accept="image/*" className="hidden" onChange={(e)=>{
                      const f = e.target.files && e.target.files[0]
                      if (f) {
                        setImageFile(f)
                        const url = URL.createObjectURL(f)
                        setImagePreview(url)
                      }
                    }} />
                    <label htmlFor="product-image-input" className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white border hover:shadow-md cursor-pointer">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V7" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3v4M8 3v4m-7 4h18" /></svg>
                      <span className="text-sm text-gray-700">Chọn ảnh...</span>
                    </label>
                    {imageFile && <span className="text-sm text-gray-500">{imageFile.name}</span>}
                    {imagePreview && (
                      <button type="button" className="ml-2 text-sm text-red-600 hover:underline" onClick={() => { setImageFile(null); setImagePreview(null); }}>
                        Xóa
                      </button>
                    )}
                  </div>
                </div>
                {imagePreview && (
                  <div className="w-28 h-28 rounded overflow-hidden border">
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="outline" onClick={()=>{ setIsModalOpen(false); setEditingId(null); setName(''); setPrice(0); setCategory(''); setDescription(''); setImageFile(null); setImagePreview(null); if (onParentClose) onParentClose() }}>Hủy</Button>
                <Button onClick={submit}>{editingId ? 'Lưu' : 'Thêm'}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------------- CategoriesAdmin ---------------------- */
const CategoriesAdmin: React.FC<AdminChildProps> = ({ openFromParent, onParentClose }) => {
  const [list, setList] = useState<string[]>([])
  const [name, setName] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(()=>{ if (openFromParent) { setIsModalOpen(true); if(onParentClose) onParentClose() } },[openFromParent])

  const add = ()=>{ if(!name) return; setList(s=>[name,...s]); setName(''); setIsModalOpen(false) }
  const removeItem = (idx:number)=> setList(s=>s.filter((_,i)=>i!==idx))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 p-4 border rounded-lg bg-white">
        <h3 className="font-semibold mb-3">Danh sách danh mục</h3>
        <ul className="space-y-2">
          {list.map((c, idx)=> (
            <li key={idx} className="flex justify-between items-center border p-2 rounded">{c} <Button variant="destructive" onClick={()=>removeItem(idx)}>Xóa</Button></li>
          ))}
          {list.length===0 && <li className="text-gray-500">Chưa có danh mục</li>}
        </ul>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={()=>setIsModalOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
            <h3 className="font-semibold mb-3">Thêm danh mục</h3>
            <input className="w-full border rounded px-3 py-2" placeholder="Tên danh mục" value={name} onChange={e=>setName(e.target.value)} />
            <div className="mt-4 flex justify-end gap-3">
              <Button variant="outline" onClick={()=>setIsModalOpen(false)}>Hủy</Button>
              <Button onClick={add}>Thêm</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ---------------------- Orders & Users placeholders ---------------------- */
const OrdersAdmin: React.FC = ()=> {
  return (
    <div>
      <h3 className="font-semibold mb-3">Đơn hàng gần đây</h3>
      <div className="text-sm text-gray-600">(Placeholder) Hiển thị danh sách đơn hàng ở đây. Bạn có thể kết nối API /api/orders để load dữ liệu thực.</div>
    </div>
  )
}

const UsersAdmin: React.FC = ()=> {
  return (
    <div>
      <h3 className="font-semibold mb-3">Người dùng</h3>
      <div className="text-sm text-gray-600">(Placeholder) Hiển thị quản lý người dùng, phân quyền và tìm kiếm.</div>
    </div>
  )
}

export default Management
 