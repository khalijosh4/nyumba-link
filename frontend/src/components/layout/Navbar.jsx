import{useState,useEffect,useRef}from'react';
import{Link,useLocation,useNavigate,useSearchParams}from'react-router-dom';
import{useAuth}from'../../context/AuthContext';
import AuthModal from'../auth/AuthModal';
export default function Navbar(){
  const{user,isLoggedIn,logout,isLandlord,isAdmin}=useAuth();
  const[menuOpen,setMenuOpen]=useState(false);
  const[authModal,setAuthModal]=useState(null);
  const[scrolled,setScrolled]=useState(false);
  const menuRef=useRef(null);
  const loc=useLocation(),nav=useNavigate();
  const[sp]=useSearchParams();
  useEffect(()=>{if(sp.get('login')==='1'&&!isLoggedIn)setAuthModal('login');},[sp,isLoggedIn]);
  useEffect(()=>{const fn=()=>setScrolled(window.scrollY>10);window.addEventListener('scroll',fn,{passive:true});return()=>window.removeEventListener('scroll',fn);},[]);
  useEffect(()=>{const fn=e=>{if(menuRef.current&&!menuRef.current.contains(e.target))setMenuOpen(false);};document.addEventListener('mousedown',fn);return()=>document.removeEventListener('mousedown',fn);},[]);
  useEffect(()=>setMenuOpen(false),[loc.pathname]);
  const isActive=p=>loc.pathname===p;
  const links=[{to:'/',label:'Home'},{to:'/listings',label:'Browse Houses'}];
  return(<>
    <nav className={`sticky top-0 z-40 transition-all duration-200 border-b border-[#d4e4da] ${scrolled?'bg-white/95 backdrop-blur-md shadow-sm':'bg-white'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-extrabold text-sm">NL</div>
            <span className="font-extrabold text-lg tracking-tight text-[#111c17] hidden xs:block">Nyumba<span className="text-green-600">Link</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-1">
            {links.map(({to,label})=><Link key={to} to={to} className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${isActive(to)?'bg-green-50 text-green-600':'text-[#5a6e63] hover:text-green-600 hover:bg-green-50'}`}>{label}</Link>)}
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn?(<>
              <button onClick={()=>nav('/dashboard/notifications')} className="relative p-2 rounded-full text-[#5a6e63] hover:bg-green-50 hover:text-green-600 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
              </button>
              <div className="relative" ref={menuRef}>
                <button onClick={()=>setMenuOpen(!menuOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#d4e4da] hover:border-green-400 transition-all">
                  <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">{user?.first_name?.[0]}{user?.last_name?.[0]}</div>
                  <span className="text-sm font-medium text-[#1a2e23] hidden sm:block max-w-[100px] truncate">{user?.first_name}</span>
                  <svg className={`w-4 h-4 text-[#5a6e63] transition-transform ${menuOpen?'rotate-180':''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/></svg>
                </button>
                {menuOpen&&(<div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-[#d4e4da] shadow-lg py-2 anim-slide-down">
                  <div className="px-4 py-3 border-b border-[#d4e4da]"><div className="font-semibold text-sm text-[#1a2e23]">{user?.first_name} {user?.last_name}</div><div className="text-xs text-[#5a6e63] mt-0.5 capitalize">{user?.role}</div></div>
                  {[{to:'/dashboard',icon:'📊',label:'Dashboard'},{to:'/dashboard/bookings',icon:'📅',label:'My Bookings'},{to:'/dashboard/favourites',icon:'❤️',label:'Saved Houses'},...(isLandlord||isAdmin?[{to:'/dashboard/listings',icon:'🏠',label:'My Listings'}]:[]),...(isAdmin?[{to:'/dashboard/admin',icon:'🛡️',label:'Admin Panel'}]:[]),{to:'/dashboard/profile',icon:'👤',label:'Profile'}].map(({to,icon,label})=>(
                    <Link key={to} to={to} className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a2e23] hover:bg-green-50 hover:text-green-600 transition-colors">{icon} {label}</Link>
                  ))}
                  <div className="border-t border-[#d4e4da] mt-1 pt-1">
                    <button onClick={()=>{logout();nav('/');}} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">🚪 Sign Out</button>
                  </div>
                </div>)}
              </div>
            </>):(<>
              <button onClick={()=>setAuthModal('login')} className="btn btn-outline btn-sm hidden sm:inline-flex">Login</button>
              <button onClick={()=>setAuthModal('register')} className="btn btn-primary btn-sm">Sign Up</button>
            </>)}
            <button onClick={()=>setMenuOpen(!menuOpen)} className="md:hidden p-2 rounded-xl text-[#5a6e63] hover:bg-green-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{menuOpen?<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>:<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>}</svg>
            </button>
          </div>
        </div>
        {menuOpen&&(<div className="md:hidden border-t border-[#d4e4da] py-3 px-2 anim-slide-down">
          {links.map(({to,label})=><Link key={to} to={to} className={`block px-4 py-3 rounded-xl text-sm font-medium mb-1 ${isActive(to)?'bg-green-50 text-green-600':'text-[#5a6e63] hover:bg-green-50'}`}>{label}</Link>)}
          {!isLoggedIn&&<div className="flex gap-2 mt-2 pt-2 border-t border-[#d4e4da]"><button onClick={()=>{setAuthModal('login');setMenuOpen(false);}} className="btn btn-outline btn-sm flex-1">Login</button><button onClick={()=>{setAuthModal('register');setMenuOpen(false);}} className="btn btn-primary btn-sm flex-1">Sign Up</button></div>}
        </div>)}
      </div>
    </nav>
    {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onSwitch={setAuthModal}/>}
  </>);
}
