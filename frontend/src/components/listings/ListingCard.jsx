import{useState}from'react';import{Link}from'react-router-dom';
import{useAuth}from'../../context/AuthContext';import{listingsAPI}from'../../services/api';
import{Countdown,roomLabel,Ksh}from'../common/index.jsx';import toast from'react-hot-toast';
const ICONS={single_room:'🏠',bedsitter:'🛏️',one_bedroom:'🏡',two_bedroom:'🏘️',three_bedroom:'🏗️',studio:'✨',four_bedroom_plus:'🏰'};
export default function ListingCard({listing,onFavToggle}){
  const{isLoggedIn}=useAuth();
  const[saved,setSaved]=useState(listing.isFavourite||false);
  const[saving,setSaving]=useState(false);
  async function toggleFav(e){e.preventDefault();e.stopPropagation();if(!isLoggedIn){toast.error('Please login to save listings');return;}setSaving(true);try{const{data}=await listingsAPI.toggleFav(listing.id);setSaved(data.saved);toast.success(data.saved?'❤️ Saved to favourites':'Removed from favourites');onFavToggle?.();}catch{toast.error('Could not update favourite');}finally{setSaving(false);}}
  const img=listing.primary_image||(Array.isArray(listing.images)?listing.images[0]?.url||listing.images[0]:null);
  const days=listing.expires_at?Math.ceil((new Date(listing.expires_at)-new Date())/86400000):5;
  const amenities=Array.isArray(listing.amenities)?listing.amenities:[];
  return(
    <Link to={`/listings/${listing.id}`} className="card card-hover block overflow-hidden group">
      <div className="relative overflow-hidden">
        {img?<img src={img} alt={listing.title} className="listing-img group-hover:scale-105 transition-transform duration-300"/>
          :<div className="listing-img flex items-center justify-center text-5xl bg-gradient-to-br from-green-50 to-green-100">{ICONS[listing.room_type]||'🏠'}</div>}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="badge bg-green-600 text-white text-[10px] font-bold px-2 py-0.5">{roomLabel(listing.room_type)}</span>
          {listing.is_featured&&<span className="badge bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5">⭐ Featured</span>}
        </div>
        <button onClick={toggleFav} disabled={saving} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow hover:scale-110 transition-all">
          <span className={`text-base ${saved?'text-red-500':'text-[#a0b0a8]'}`}>{saved?'❤️':'🤍'}</span>
        </button>
        {days<=2&&days>0&&<div className="absolute bottom-0 inset-x-0 bg-red-500/90 text-white text-center text-[10px] font-bold py-1">⏰ Expires in {days} day{days!==1?'s':''}</div>}
      </div>
      <div className="p-4">
        <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-1">{listing.area}</p>
        <h3 className="font-bold text-[#1a2e23] text-sm leading-snug line-clamp-2 mb-1">{listing.title}</h3>
        {listing.landmark&&<p className="text-xs text-[#7a9085] flex items-center gap-1 mb-3"><span>📍</span><span className="line-clamp-1">{listing.landmark}</span></p>}
        <div className="flex items-end justify-between mb-3">
          <div><span className="text-xl font-extrabold text-green-600"><Ksh amount={listing.monthly_rent}/></span><span className="text-xs text-[#7a9085]">/mo</span></div>
          <Countdown expiresAt={listing.expires_at}/>
        </div>
        {amenities.length>0&&<div className="flex flex-wrap gap-1.5 mb-3">{amenities.slice(0,3).map((a,i)=><span key={i} className="amenity-tag text-[10px]">{a}</span>)}{amenities.length>3&&<span className="amenity-tag text-[10px]">+{amenities.length-3}</span>}</div>}
        <div className="pt-3 border-t border-[#f0f5f2]"><span className="btn btn-primary btn-sm w-full" style={{justifyContent:'center'}}>View Details</span></div>
      </div>
    </Link>
  );
}
