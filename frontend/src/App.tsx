import { BrowserRouter, Routes, Route} from 'react-router'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import HomePage from './pages/HomePage'
import {Toaster} from 'sonner'
import ForgetPass from './pages/ForgetPass'

function App() {
  return (
    <>
      <Toaster richColors/>
      <BrowserRouter>
        <Routes>
          <Route path = '/' element = {<HomePage/>}/>
          <Route path = '/signin' element = {<SignInPage/>}/>
          <Route path = '/signup' element = {<SignUpPage/>}/>
          <Route path = '/forget' element = {<ForgetPass/>}/>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
