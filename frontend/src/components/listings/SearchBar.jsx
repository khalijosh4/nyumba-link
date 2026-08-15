import{useState}from'react';import{useNavigate}from'react-router-dom';
export const AREAS=['Roysambu','Zimmerman','Car Wash','Drive In','Safari Park','Kahawa Sukari','Kahawa Wendani','Kamakis','Bypass','Ruiru','Kimbo','Toll','Juja','JKUAT','Highpoint','Gwa Kairo','K-Road','K.U (Kenyatta University)','Jomoko','Tora','Kibute','Witeitie','Ngoingwa','Kiganjo','Thika'];
export const ROOM_TYPES=[{value:'single_room',label:'Single Room'},{value:'bedsitter',label:'Bedsitter'},{value:'one_bedroom',label:'1 Bedroom'},{value:'two_bedroom',label:'2 Bedrooms'},{value:'three_bedroom',label:'3 Bedrooms'},{value:'four_bedroom_plus',label:'4+ Bedrooms'},{value:'studio',label:'Studio'}];
const PRICES=[{label:'Any Budget',min:'',max:''},{label:'Under 5,000',min:'',max:'5000'},{label:'5,000–10,000',min:'5000',max:'10000'},{label:'10,000–20,000',min:'10000',max:'20000'},{label:'20,000–35,000',min:'20000',max:'35000'},{label:'35,000+',min:'35000',max:''}];
export default function SearchBar({initialValues={},onSearch,compact=false}){
  const nav=useNavigate();
  const[form,setForm]=useState({area:initialValues.area||'',room_type:initialValues.room_type||'',price:'',search:initialValues.search||''});
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  function handle(e){e.preventDefault();const r=PRICES.find(x=>x.label===form.price)||{};const p=new URLSearchParams();if(form.area)p.set('area',form.area);if(form.room_type)p.set('room_type',form.room_type);if(r.min)p.set('min_rent',r.min);if(r.max)p.set('max_rent',r.max);if(form.search)p.set('search',form.search);if(onSearch)onSearch(Object.fromEntries(p));else nav(`/listings?${p.toString()}`);}
  if(compact)return<form onSubmit={handle} className="flex gap-2"><input className="input flex-1 text-sm" placeholder="Search area, landmark…" value={form.search} onChange={set('search')}/><button type="submit" className="btn btn-primary px-5">🔍</button></form>;
  return(
    <form onSubmit={handle} className="bg-white rounded-2xl shadow-md border border-[#d4e4da] p-5 md:p-6">
      <div className="flex gap-2 mb-5"><span className="px-4 py-1.5 rounded-full bg-green-600 text-white text-xs font-bold">For Rent</span></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        <div><label className="label">Area / Location</label><select className="input" value={form.area} onChange={set('area')}><option value="">All Areas</option>{AREAS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
        <div><label className="label">Room Type</label><select className="input" value={form.room_type} onChange={set('room_type')}><option value="">All Types</option>{ROOM_TYPES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
        <div><label className="label">Budget (KSh/month)</label><select className="input" value={form.price} onChange={set('price')}>{PRICES.map(r=><option key={r.label} value={r.label}>{r.label}</option>)}</select></div>
        <button type="submit" className="btn btn-primary btn-lg w-full">🔍 Search Houses</button>
      </div>
      <div className="mt-3"><input className="input text-sm" placeholder="Search by keyword or landmark e.g. 'near JKUAT gate'…" value={form.search} onChange={set('search')}/></div>
    </form>
  );
}
