import{useState,useEffect,useCallback}from'react';import{useSearchParams}from'react-router-dom';
import ListingCard from'../components/listings/ListingCard';import{AREAS,ROOM_TYPES}from'../components/listings/SearchBar';
import{SkeletonCard,EmptyState}from'../components/common/index.jsx';import{listingsAPI}from'../services/api';
const SORTS=[{value:'newest',label:'🆕 Newest'},{value:'price_asc',label:'💰 Low → High'},{value:'price_desc',label:'💰 High → Low'},{value:'popular',label:'🔥 Popular'}];
const PP=[{label:'Any',min:'',max:''},{label:'<5k',min:'',max:'5000'},{label:'5k–10k',min:'5000',max:'10000'},{label:'10k–20k',min:'10000',max:'20000'},{label:'20k–35k',min:'20000',max:'35000'},{label:'35k+',min:'35000',max:''}];
export default function ListingsPage(){
  const[sp,setSP]=useSearchParams();
  const[listings,setListings]=useState([]);const[total,setTotal]=useState(0);const[pages,setPages]=useState(1);const[loading,setLoading]=useState(true);const[filterOpen,setFilterOpen]=useState(false);
  const[f,setF]=useState({area:sp.get('area')||'',room_type:sp.get('room_type')||'',min_rent:sp.get('min_rent')||'',max_rent:sp.get('max_rent')||'',search:sp.get('search')||'',sort:'newest',page:1});
  const fetch=useCallback(async(fl)=>{setLoading(true);try{const p=Object.fromEntries(Object.entries(fl).filter(([,v])=>v!==''&&v!==1));const{data}=await listingsAPI.getAll(p);setListings(data.listings);setTotal(data.total);setPages(data.pages);}catch(_){}finally{setLoading(false);}},[]);
  useEffect(()=>{fetch(f);},[]);
  function apply(k,v){const u={...f,[k]:v,page:1};setF(u);fetch(u);const p=new URLSearchParams();Object.entries(u).forEach(([k2,v2])=>{if(v2&&k2!=='page'&&k2!=='sort')p.set(k2,v2);});setSP(p);}
  function clear(){const r={area:'',room_type:'',min_rent:'',max_rent:'',search:'',sort:'newest',page:1};setF(r);fetch(r);setSP({});}
  function Chip({label,active,onClick}){return<button onClick={onClick} className={`chip text-[11px] ${active?'chip-active':''}`}>{label}</button>;}
  const FilterPanel=()=>(<div className="card p-5 space-y-5 h-fit sticky top-20">
    <div className="flex items-center justify-between"><h3 className="font-bold text-[#1a2e23]">Filters</h3><button onClick={clear} className="text-xs text-green-600 font-semibold hover:underline">Clear All</button></div>
    <div><label className="label">Keyword</label><input className="input text-sm" placeholder="e.g. near JKUAT gate…" value={f.search} onChange={e=>apply('search',e.target.value)}/></div>
    <div><label className="label">Room Type</label><div className="flex flex-wrap gap-1.5 mt-1"><Chip label="All" active={!f.room_type} onClick={()=>apply('room_type','')}/>{ROOM_TYPES.map(r=><Chip key={r.value} label={r.label} active={f.room_type===r.value} onClick={()=>apply('room_type',f.room_type===r.value?'':r.value)}/>)}</div></div>
    <div><label className="label">Budget (KSh/mo)</label><div className="flex flex-wrap gap-1.5 mt-1">{PP.map(p=><Chip key={p.label} label={p.label} active={f.min_rent===p.min&&f.max_rent===p.max} onClick={()=>{const u={...f,min_rent:p.min,max_rent:p.max,page:1};setF(u);fetch(u);}}/>)}</div><div className="grid grid-cols-2 gap-2 mt-2"><div><label className="label text-[10px]">Min</label><input className="input text-sm" type="number" placeholder="0" value={f.min_rent} onChange={e=>apply('min_rent',e.target.value)}/></div><div><label className="label text-[10px]">Max</label><input className="input text-sm" type="number" placeholder="Any" value={f.max_rent} onChange={e=>apply('max_rent',e.target.value)}/></div></div></div>
    <div><label className="label">Location</label><div className="flex flex-wrap gap-1.5 mt-1 max-h-48 overflow-y-auto"><Chip label="All Areas" active={!f.area} onClick={()=>apply('area','')}/>{AREAS.map(a=><Chip key={a} label={a} active={f.area===a} onClick={()=>apply('area',f.area===a?'':a)}/>)}</div></div>
  </div>);
  return(<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div className="flex gap-7">
      <aside className="hidden lg:block w-64 shrink-0"><FilterPanel/></aside>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
          <div className="text-sm text-[#5a6e63]">{loading?'Searching…':<><strong className="text-[#1a2e23]">{total}</strong> listings{f.area&&<span className="ml-1">in <strong>{f.area}</strong></span>}</>}</div>
          <div className="flex items-center gap-2">
            <button onClick={()=>setFilterOpen(!filterOpen)} className="btn btn-outline btn-sm lg:hidden">⚙️ Filters</button>
            <select className="input text-sm w-auto py-2" value={f.sort} onChange={e=>apply('sort',e.target.value)}>{SORTS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
          </div>
        </div>
        {filterOpen&&<div className="lg:hidden mb-5 anim-slide-down"><FilterPanel/></div>}
        {(f.area||f.room_type||f.search)&&<div className="flex flex-wrap gap-2 mb-4">
          {f.area&&<span className="chip chip-active flex items-center gap-1">📍 {f.area}<button onClick={()=>apply('area','')} className="ml-1">✕</button></span>}
          {f.room_type&&<span className="chip chip-active flex items-center gap-1">🏠 {ROOM_TYPES.find(r=>r.value===f.room_type)?.label}<button onClick={()=>apply('room_type','')} className="ml-1">✕</button></span>}
          {f.search&&<span className="chip chip-active flex items-center gap-1">🔍 "{f.search}"<button onClick={()=>apply('search','')} className="ml-1">✕</button></span>}
        </div>}
        {loading?<div className="listings-grid">{Array(9).fill(0).map((_,i)=><SkeletonCard key={i}/>)}</div>
          :listings.length===0?<EmptyState icon="🏠" title="No listings found" message="Try adjusting your filters or searching in a different area." action={<button onClick={clear} className="btn btn-primary">Clear Filters</button>}/>
          :<div className="listings-grid">{listings.map(l=><ListingCard key={l.id} listing={l}/>)}</div>}
        {pages>1&&<div className="flex justify-center items-center gap-2 mt-10">
          <button disabled={f.page<=1} onClick={()=>apply('page',f.page-1)} className="btn btn-outline btn-sm disabled:opacity-40">← Prev</button>
          <span className="text-sm text-[#5a6e63] px-3">Page {f.page} of {pages}</span>
          <button disabled={f.page>=pages} onClick={()=>apply('page',f.page+1)} className="btn btn-outline btn-sm disabled:opacity-40">Next →</button>
        </div>}
      </div>
    </div>
  </div>);
}
