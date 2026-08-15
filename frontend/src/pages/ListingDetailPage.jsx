import{useState}from'react';import{useParams,Link,useNavigate}from'react-router-dom';
import{useAuth}from'../context/AuthContext';import{useListing}from'../hooks/index.js';
import{bookingsAPI,listingsAPI}from'../services/api';
import MpesaModal from'../components/payment/MpesaModal';
import{FullPageSpinner,Countdown,AmenityTag,Ksh,roomLabel}from'../components/common/index.jsx';
import toast from'react-hot-toast';
const CAT={exterior:'🏢 Exterior',compound:'🌿 Compound',bedroom:'🛏️ Bedroom',kitchen:'🍳 Kitchen',washroom:'🚿 Washroom',living_room:'🛋️ Living Room',other:'📷 Other'};
export default function ListingDetailPage(){
  const{id}=useParams();const{user,isLoggedIn}=useAuth();const nav=useNavigate();
  const{listing,loading,error}=useListing(id);
  const[activeImg,setActiveImg]=useState(0);const[showPay,setShowPay]=useState(false);
  const[bf,setBf]=useState({date:'',time:'Morning (8am – 12pm)',message:''});
  const[booking,setBooking]=useState(false);const[booked,setBooked]=useState(false);const[saved,setSaved]=useState(false);
  if(loading)return<FullPageSpinner/>;
  if(error)return<div className="max-w-2xl mx-auto px-4 py-20 text-center"><div className="text-5xl mb-4">😕</div><h2 className="text-xl font-bold mb-2">Listing not found</h2><p className="text-[#5a6e63] mb-6">{error}</p><Link to="/listings" className="btn btn-primary">← Back to Listings</Link></div>;
  const images=Array.isArray(listing.images)?listing.images:[];
  const amenities=Array.isArray(listing.amenities)?listing.amenities:[];
  const hasAccess=user?.access_paid||user?.role==='admin'||listing.landlord_id===user?.id;
  const cats=[...new Set(images.map(i=>i.category).filter(Boolean))];
  const imgSrc=images[activeImg]?.url||images[activeImg];
  async function handleBook(e){e.preventDefault();if(!isLoggedIn){toast.error('Please login to book');nav('/?login=1');return;}if(!bf.date){toast.error('Please select a date');return;}setBooking(true);try{await bookingsAPI.create({listing_id:listing.id,viewing_date:bf.date,viewing_time:bf.time,message:bf.message});setBooked(true);toast.success('📅 Booking sent! Check your email.');}catch(err){toast.error(err.response?.data?.error||'Booking failed');}finally{setBooking(false);}}
  async function toggleSave(){if(!isLoggedIn){toast.error('Please login to save listings');return;}try{const{data}=await listingsAPI.toggleFav(listing.id);setSaved(data.saved);toast.success(data.saved?'❤️ Saved!':'Removed from saved');}catch{toast.error('Could not save');}}
  return(
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
      <div className="flex items-center gap-2 text-sm text-[#7a9085] mb-6 flex-wrap">
        <Link to="/" className="hover:text-green-600">Home</Link><span>/</span>
        <Link to="/listings" className="hover:text-green-600">Listings</Link><span>/</span>
        <span className="text-[#1a2e23] font-medium line-clamp-1">{listing.title}</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="rounded-2xl overflow-hidden bg-green-50 mb-3 aspect-[16/9]">
            {imgSrc?<img src={imgSrc} alt={listing.title} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-7xl">🏠</div>}
          </div>
          {images.length>1&&<div className="flex gap-2 overflow-x-auto pb-1 mb-3">{images.map((img,i)=><button key={i} onClick={()=>setActiveImg(i)} className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImg===i?'border-green-600 scale-105':'border-transparent opacity-70 hover:opacity-100'}`}><img src={img.url||img} alt={`Photo ${i+1}`} className="w-full h-full object-cover"/></button>)}</div>}
          {cats.length>0&&<div className="flex flex-wrap gap-1.5 mb-5">{cats.map(c=><button key={c} onClick={()=>{const idx=images.findIndex(i=>i.category===c);if(idx!==-1)setActiveImg(idx);}} className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#f0f5f2] text-[#5a6e63] hover:bg-green-50 hover:text-green-600 transition-colors">{CAT[c]||c}</button>)}</div>}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap"><span className="badge badge-green font-bold text-xs">{roomLabel(listing.room_type)}</span>{listing.is_featured&&<span className="badge badge-gold">⭐ Featured</span>}</div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1a2e23] leading-tight">{listing.title}</h1>
            </div>
            <button onClick={toggleSave} className="shrink-0 w-10 h-10 rounded-full border border-[#d4e4da] flex items-center justify-center hover:border-red-300 transition-all text-xl">{saved||listing.isFavourite?'❤️':'🤍'}</button>
          </div>
          <p className="flex items-center gap-2 text-sm text-[#5a6e63] mb-5"><span>📍</span><span>{listing.area}{listing.landmark?` · ${listing.landmark}`:''}</span></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[{icon:'💰',label:'Monthly Rent',value:<Ksh amount={listing.monthly_rent}/>},{icon:'💳',label:'Deposit',value:<Ksh amount={listing.deposit}/>},{icon:'🏠',label:'Floor',value:listing.floor_number===0?'Ground':`Floor ${listing.floor_number}`},{icon:'⏰',label:'Expires',value:<Countdown expiresAt={listing.expires_at}/>}].map(({icon,label,value})=>(
              <div key={label} className="bg-[#f7faf8] rounded-xl p-3 text-center border border-[#e8f0eb]"><div className="text-xl mb-1">{icon}</div><div className="text-xs text-[#7a9085] mb-0.5">{label}</div><div className="font-bold text-sm text-[#1a2e23]">{value}</div></div>
            ))}
          </div>
          {listing.description&&<div className="mb-6"><h2 className="font-bold text-[#1a2e23] mb-2">About this property</h2><p className="text-sm text-[#5a6e63] leading-relaxed">{listing.description}</p></div>}
          {amenities.length>0&&<div className="mb-6"><h2 className="font-bold text-[#1a2e23] mb-3">Amenities</h2><div className="flex flex-wrap gap-2">{amenities.map((a,i)=><AmenityTag key={i} label={a}/>)}</div></div>}
          <div className="mb-6"><h2 className="font-bold text-[#1a2e23] mb-3">Location Details</h2>
            <div className="bg-[#f7faf8] rounded-xl p-4 border border-[#e8f0eb] space-y-2 text-sm">
              {listing.area&&<div><span className="text-[#7a9085]">Area: </span><strong>{listing.area}</strong></div>}
              {listing.street&&<div><span className="text-[#7a9085]">Building: </span><strong>{listing.street}</strong></div>}
              {listing.landmark&&<div><span className="text-[#7a9085]">Landmark: </span><strong>{listing.landmark}</strong></div>}
              {listing.directions&&<div><span className="text-[#7a9085]">Directions: </span><span>{listing.directions}</span></div>}
            </div>
          </div>
          {listing.extra_fees&&<div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm"><div className="font-bold text-yellow-800 mb-1">⚠️ Extra Fees</div><div className="text-yellow-700">{listing.extra_fees}</div></div>}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="card p-5">
              <div className="text-3xl font-extrabold text-green-600 mb-1"><Ksh amount={listing.monthly_rent}/></div>
              <div className="text-xs text-[#7a9085] mb-3">per month · Deposit: <Ksh amount={listing.deposit}/></div>
              <Countdown expiresAt={listing.expires_at}/>
              {booked?(<div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 text-center"><div className="text-3xl mb-2">📅</div><div className="font-bold text-green-700 text-sm">Viewing Requested!</div><div className="text-xs text-green-600 mt-1">Check your email for confirmation.</div><Link to="/dashboard/bookings" className="btn btn-primary btn-sm mt-3 w-full">View My Bookings</Link></div>):(
                <form onSubmit={handleBook} className="mt-4 space-y-3">
                  <div><label className="label">Preferred Viewing Date</label><input className="input" type="date" min={new Date().toISOString().split('T')[0]} value={bf.date} onChange={e=>setBf(p=>({...p,date:e.target.value}))}/></div>
                  <div><label className="label">Preferred Time</label><select className="input" value={bf.time} onChange={e=>setBf(p=>({...p,time:e.target.value}))}><option>Morning (8am – 12pm)</option><option>Afternoon (12pm – 5pm)</option><option>Evening (5pm – 7pm)</option></select></div>
                  <div><label className="label">Message (optional)</label><textarea className="input resize-none h-20 text-sm" placeholder="Any questions for the landlord?" value={bf.message} onChange={e=>setBf(p=>({...p,message:e.target.value}))}/></div>
                  <button type="submit" disabled={booking} className="btn btn-primary w-full">{booking?<><span className="w-4 h-4 spinner mr-2"/>Sending…</>:'📅 Book Viewing (Free)'}</button>
                </form>
              )}
              <div className="mt-3 border-t border-[#e8f0eb] pt-3">
                {hasAccess?(<div className="bg-green-50 rounded-xl p-3 text-sm"><div className="font-bold text-green-700 mb-1">📞 Landlord Contact</div><div className="font-semibold text-[#1a2e23]">{listing.landlord_first_name} {listing.landlord_last_name}</div>{listing.landlord_phone&&<div className="font-mono font-bold mt-0.5">{listing.landlord_phone}</div>}{listing.landlord_email&&<div className="text-xs text-[#5a6e63]">{listing.landlord_email}</div>}</div>)
                  :<button onClick={()=>setShowPay(true)} className="btn btn-gold w-full btn-sm">🔓 Unlock Contact – KSh 50</button>}
              </div>
            </div>
            <div className="card p-5"><h3 className="font-bold text-[#1a2e23] mb-3 text-sm">About the Landlord</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700 text-sm">{listing.landlord_first_name?.[0]}{listing.landlord_last_name?.[0]}</div>
                <div><div className="font-semibold text-sm text-[#1a2e23]">{listing.landlord_first_name} {listing.landlord_last_name}</div><div className="text-xs text-[#7a9085]">{listing.landlord_active_listings||0} active listing(s)</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {showPay&&<MpesaModal type="tenant_access" listingId={listing.id} onClose={()=>setShowPay(false)} onSuccess={()=>{setShowPay(false);window.location.reload();}}/>}
    </div>
  );
}
