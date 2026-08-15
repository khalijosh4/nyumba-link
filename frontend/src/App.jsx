import{Routes,Route,Navigate}from'react-router-dom';
import{AuthProvider,useAuth}from'./context/AuthContext';
import Navbar from'./components/layout/Navbar';
import MobileNav from'./components/layout/MobileNav';
import Footer from'./components/layout/Footer';
import HomePage from'./pages/HomePage';
import ListingsPage from'./pages/ListingsPage';
import ListingDetailPage from'./pages/ListingDetailPage';
import DashboardPage from'./pages/DashboardPage';
import VerifyEmailPage from'./pages/VerifyEmailPage';
import ResetPasswordPage from'./pages/ResetPasswordPage';
import NotFoundPage from'./pages/NotFoundPage';

function PrivateRoute({children}){
  const{isLoggedIn,loading}=useAuth();
  if(loading)return<FullSpinner/>;
  if(!isLoggedIn)return<Navigate to="/?login=1" replace/>;
  return children;
}
function FullSpinner(){return<div className="min-h-screen flex flex-col items-center justify-center bg-[#f7faf8] gap-4"><div className="w-12 h-12 spinner"/><span className="text-sm text-[#5a6e63] font-medium">Loading NyumbaLink…</span></div>;}
function AppShell(){
  const{loading}=useAuth();
  if(loading)return<FullSpinner/>;
  return(
    <div className="min-h-screen flex flex-col bg-[#f7faf8]">
      <Navbar/>
      <main className="flex-1 pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/listings" element={<ListingsPage/>}/>
          <Route path="/listings/:id" element={<ListingDetailPage/>}/>
          <Route path="/verify-email" element={<VerifyEmailPage/>}/>
          <Route path="/reset-password" element={<ResetPasswordPage/>}/>
          <Route path="/dashboard/*" element={<PrivateRoute><DashboardPage/></PrivateRoute>}/>
          <Route path="*" element={<NotFoundPage/>}/>
        </Routes>
      </main>
      <Footer/>
      <MobileNav/>
    </div>
  );
}
export default function App(){return<AuthProvider><AppShell/></AuthProvider>;}
