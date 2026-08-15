import{Link}from'react-router-dom';
export default function Footer(){return(
  <footer className="bg-[#111c17] text-white/60 pt-12 pb-6 mt-16 hidden md:block">
    <div className="max-w-7xl mx-auto px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2 md:col-span-1"><div className="font-extrabold text-xl text-white mb-3">Nyumba<span className="text-green-400">Link</span></div><p className="text-sm text-white/45 leading-relaxed max-w-xs">Kenya's premier house hunting platform for the Thika Road corridor. Verified listings, instant bookings.</p></div>
        {[{t:'Tenants',links:[{to:'/listings',l:'Browse Listings'},{to:'/dashboard/favourites',l:'Saved Houses'},{to:'/dashboard/bookings',l:'My Bookings'}]},{t:'Landlords',links:[{to:'/dashboard/post',l:'Post a Listing'},{to:'/dashboard/listings',l:'My Listings'},{to:'/dashboard',l:'Dashboard'}]},{t:'Areas',links:['Roysambu','Kahawa Sukari','JKUAT','Ruiru','Juja','Thika'].map(a=>({to:`/listings?area=${a}`,l:a}))}].map(({t,links})=>(
          <div key={t}><h4 className="text-xs uppercase tracking-widest text-white/30 font-bold mb-4">{t}</h4><ul className="space-y-2 text-sm">{links.map(({to,l})=><li key={l}><Link to={to} className="hover:text-green-400 transition-colors">{l}</Link></li>)}</ul></div>
        ))}
      </div>
      <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-white/30">
        <span>© {new Date().getFullYear()} NyumbaLink. All rights reserved.</span><span>🇰🇪 Made for Thika Road, Kenya</span>
      </div>
    </div>
  </footer>
);}
