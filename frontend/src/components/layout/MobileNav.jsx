import{Link,useLocation}from'react-router-dom';import{useAuth}from'../../context/AuthContext';
const T=[
  {to:'/',label:'Home',icon:a=><svg className="w-6 h-6" fill={a?'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>},
  {to:'/listings',label:'Browse',icon:a=><svg className="w-6 h-6" fill={a?'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>},
  {to:'/dashboard/favourites',label:'Saved',auth:true,icon:a=><svg className="w-6 h-6" fill={a?'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>},
  {to:'/dashboard',label:'Account',auth:true,icon:a=><svg className="w-6 h-6" fill={a?'currentColor':'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={a?0:2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>},
];
export default function MobileNav(){
  const{isLoggedIn}=useAuth(),loc=useLocation();
  if(loc.pathname.startsWith('/dashboard'))return null;
  return(
    <nav className="mobile-nav md:hidden"><div className="flex items-stretch">
      {T.map(({to,icon,label,auth})=>{
        if(auth&&!isLoggedIn)return null;
        const a=loc.pathname===to||(to!=='/'&&loc.pathname.startsWith(to));
        return<Link key={to} to={to} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 ${a?'text-green-600':'text-[#7a9085]'}`}>{icon(a)}<span className={`text-[10px] font-semibold ${a?'text-green-600':'text-[#a0b0a8]'}`}>{label}</span></Link>;
      })}
      {!isLoggedIn&&<Link to="/?login=1" className="flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[#7a9085]"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg><span className="text-[10px] font-semibold text-[#a0b0a8]">Account</span></Link>}
    </div></nav>
  );
}
