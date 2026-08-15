import{useState,useEffect}from'react';import{Link,useNavigate,useSearchParams}from'react-router-dom';
import SearchBar,{AREAS}from'../components/listings/SearchBar';import ListingCard from'../components/listings/ListingCard';
import AuthModal from'../components/auth/AuthModal';import{SectionHeader,SkeletonCard}from'../components/common/index.jsx';import{listingsAPI}from'../services/api';
const AI={'Roysambu':'🌆','Zimmerman':'🏘️','Car Wash':'🚗','Drive In':'🎬','Safari Park':'🌳','Kahawa Sukari':'🏠','Kahawa Wendani':'🏡','Kamakis':'🏗️','Bypass':'🛣️','Ruiru':'🏙️','Kimbo':'🏘️','Toll':'💰','Juja':'🌿','JKUAT':'🎓','Highpoint':'⬆️','Gwa Kairo':'🏚️','K-Road':'🛤️','K.U (Kenyatta University)':'🎓','Jomoko':'🏠','Tora':'🏠','Kibute':'🏘️','Witeitie':'🏡','Ngoingwa':'🌿','Kiganjo':'🌾','Thika':'🏛️'};
const HOW=[{icon:'💳',n:1,t:'Pay KSh 50 via M-Pesa',d:'One-time fee. Instant STK Push. No hidden charges.'},{icon:'🔍',n:2,t:'Browse & Filter Listings',d:'Filter by area, price, room type across 25+ Thika Road areas.'},{icon:'📅',n:3,t:'Book a Viewing',d:'Pick date and time. Email confirmation sent automatically.'},{icon:'🏠',n:4,t:'Move In!',d:'Agree terms with landlord, pay deposit, collect keys.'}];
export default function HomePage(){
  const[featured,setFeatured]=useState([]);const[loadingF,setLoadingF]=useState(true);const[authModal,setAuthModal]=useState(null);
  const nav=useNavigate();const[sp]=useSearchParams();
  useEffect(()=>{if(sp.get('login')==='1')setAuthModal('login');},[sp]);
  useEffect(()=>{listingsAPI.getAll({limit:8,sort:'newest'}).then(({data})=>setFeatured(data.listings)).catch(()=>{}).finally(()=>setLoadingF(false));},[]);
  return(<div>
    <section className="relative bg-[#111c17] overflow-hidden min-h-[88vh] flex items-center">
      <div className="hero-pattern absolute inset-0"/>
      <div className="absolute right-0 top-0 bottom-0 w-1/2 hidden lg:block opacity-10">
        <svg viewBox="0 0 400 800" className="h-full w-full" fill="none">
          <path d="M200 800 Q220 600 180 400 Q140 200 220 0" stroke="#2ea06a" strokeWidth="20" strokeLinecap="round"/>
          <path d="M200 800 Q220 600 180 400 Q140 200 220 0" stroke="white" strokeWidth="6" strokeDasharray="20 16" strokeLinecap="round"/>
          {[740,620,500,380,260,140,30].map((y,i)=><circle key={i} cx={200+(i%2===0?-20:30)} cy={y} r="10" fill="#2ea06a" opacity="0.8"/>)}
        </svg>
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-green-600/20 border border-green-500/40 text-green-400 px-4 py-1.5 rounded-full text-xs font-bold mb-6">🏠 Thika Road's #1 Property Platform</div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-5">Find Your Perfect<br/>Home Along <span className="text-green-400">Thika Road</span></h1>
          <p className="text-base sm:text-lg text-white/60 leading-relaxed mb-8 max-w-xl">From Roysambu to Thika — verified listings, instant bookings, and fast move-ins. Over 1,000 listings across 25+ areas.</p>
          <div className="flex flex-wrap gap-3 mb-12">
            <button onClick={()=>nav('/listings')} className="btn btn-primary btn-lg">🔍 Browse Houses</button>
            <button onClick={()=>setAuthModal('register')} className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10">🏗️ List Your Property</button>
          </div>
          <div className="flex flex-wrap gap-8">
            {[{n:'1,240+',l:'Active Listings'},{n:'25+',l:'Areas Covered'},{n:'4,800+',l:'Happy Tenants'},{n:'5 days',l:'Avg. Move Time'}].map(({n,l})=><div key={l}><div className="text-2xl font-extrabold text-white leading-none">{n}</div><div className="text-xs text-white/45 mt-1">{l}</div></div>)}
          </div>
        </div>
      </div>
    </section>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20"><SearchBar/></div>
    <section className="section">
      <SectionHeader title="Browse by" highlight="Area" subtitle="Thika Road's most popular neighbourhoods" action={<Link to="/listings" className="btn btn-outline btn-sm">View All →</Link>}/>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {AREAS.slice(0,16).map(a=><Link key={a} to={`/listings?area=${encodeURIComponent(a)}`} className="card p-3 text-center hover:border-green-400 hover:bg-green-50 transition-all group"><div className="text-2xl mb-1">{AI[a]||'🏘️'}</div><div className="text-xs font-bold text-[#1a2e23] group-hover:text-green-600 leading-tight">{a}</div></Link>)}
      </div>
    </section>
    <section className="section bg-white">
      <SectionHeader title="Featured" highlight="Listings" subtitle="Verified and available right now" action={<Link to="/listings" className="btn btn-outline btn-sm">View All →</Link>}/>
      {loadingF?<div className="listings-grid">{Array(8).fill(0).map((_,i)=><SkeletonCard key={i}/>)}</div>:<div className="listings-grid stagger">{featured.map(l=><div key={l.id} className="anim-fade-up"><ListingCard listing={l}/></div>)}</div>}
      {!loadingF&&featured.length===0&&<div className="text-center py-12 text-[#5a6e63]">No listings yet. Be the first to post!</div>}
    </section>
    <section className="section">
      <SectionHeader title="How It" highlight="Works" subtitle="Four simple steps to your new home"/>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {HOW.map(s=><div key={s.n} className="card p-6 text-center hover:shadow-md transition-shadow"><div className="w-10 h-10 rounded-full bg-green-600 text-white font-extrabold text-sm flex items-center justify-center mx-auto mb-4">{s.n}</div><div className="text-4xl mb-3">{s.icon}</div><h3 className="font-bold text-[#1a2e23] mb-2 text-sm">{s.t}</h3><p className="text-xs text-[#5a6e63] leading-relaxed">{s.d}</p></div>)}
      </div>
    </section>
    <section className="section">
      <div className="bg-gradient-to-br from-[#111c17] to-[#1a7a4a] rounded-3xl p-8 md:p-12 text-white text-center">
        <h2 className="text-2xl md:text-3xl font-extrabold mb-3">Ready to find your home?</h2>
        <p className="text-white/65 max-w-md mx-auto mb-7 text-sm">Join thousands of tenants and landlords already using NyumbaLink on Thika Road.</p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={()=>nav('/listings')} className="btn btn-primary btn-lg">Browse Houses</button>
          <button onClick={()=>setAuthModal('register')} className="btn btn-lg border-2 border-white/30 text-white hover:bg-white/10">Create Free Account</button>
        </div>
      </div>
    </section>
    {authModal&&<AuthModal mode={authModal} onClose={()=>setAuthModal(null)} onSwitch={setAuthModal}/>}
  </div>);
}
