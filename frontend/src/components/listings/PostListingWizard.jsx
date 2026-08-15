import{useState}from'react';import{useNavigate}from'react-router-dom';
import{listingsAPI,uploadAPI}from'../../services/api';
import MpesaModal from'../payment/MpesaModal';import toast from'react-hot-toast';
import{AREAS,ROOM_TYPES}from'./SearchBar';
const STEPS=['Basic Info','Location','Photos','Pricing','Review'];
const AMENITIES=['Running Water','24hr Electricity','Security Guard','Parking','Borehole Water','Wi-Fi Ready','En-suite','Balcony','CCTV','Solar Backup','Garden','Gated Community','DSTV Point','Hot Shower','Tiled Bathroom','Self-Contained'];
const PHOTO_REQS={
  single_room:[{key:'exterior',label:'Building Exterior *',req:true},{key:'compound',label:'Compound *',req:true},{key:'bedroom',label:'Room Interior *',req:true}],
  bedsitter:[{key:'bedroom',label:'Room Interior *',req:true},{key:'washroom',label:'Washroom *',req:true},{key:'kitchen',label:'Kitchen (if separate)',req:false}],
  one_bedroom:[{key:'exterior',label:'Building Exterior *',req:true},{key:'compound',label:'Compound *',req:true},{key:'bedroom',label:'Bedroom *',req:true},{key:'kitchen',label:'Kitchen *',req:true},{key:'washroom',label:'Washroom *',req:true},{key:'living_room',label:'Living Room',req:false}],
  two_bedroom:[{key:'exterior',label:'Building Exterior *',req:true},{key:'compound',label:'Compound *',req:true},{key:'bedroom',label:'Master Bedroom *',req:true},{key:'kitchen',label:'Kitchen *',req:true},{key:'washroom',label:'Washroom *',req:true},{key:'living_room',label:'Living Room',req:false}],
  three_bedroom:[{key:'exterior',label:'Building Exterior *',req:true},{key:'compound',label:'Compound *',req:true},{key:'bedroom',label:'Bedroom *',req:true},{key:'kitchen',label:'Kitchen *',req:true},{key:'washroom',label:'Washroom *',req:true},{key:'living_room',label:'Living Room',req:false}],
  studio:[{key:'exterior',label:'Building Exterior *',req:true},{key:'bedroom',label:'Studio Room *',req:true},{key:'washroom',label:'Washroom *',req:true}],
  four_bedroom_plus:[{key:'exterior',label:'Building Exterior *',req:true},{key:'compound',label:'Compound *',req:true},{key:'bedroom',label:'Bedroom *',req:true},{key:'kitchen',label:'Kitchen *',req:true},{key:'washroom',label:'Washroom *',req:true},{key:'living_room',label:'Living Room',req:false}],
};
export default function PostListingWizard(){
  const nav=useNavigate();
  const[step,setStep]=useState(0);const[listingId,setListingId]=useState(null);const[showPay,setShowPay]=useState(false);
  const[submitting,setSubmitting]=useState(false);const[uploadingFor,setUploadingFor]=useState(null);const[uploadedPhotos,setUploadedPhotos]=useState({});
  const[amenities,setAmenities]=useState([]);
  const[form,setForm]=useState({title:'',description:'',room_type:'one_bedroom',floor_number:0,area:'Roysambu',street:'',landmark:'',directions:'',lat:'',lng:'',monthly_rent:'',deposit:'',extra_fees:'',available_from:'',minimum_lease:'1 Month',is_negotiable:false});
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const photoReqs=PHOTO_REQS[form.room_type]||PHOTO_REQS.one_bedroom;
  const prog=((step+1)/STEPS.length)*100;
  const toggleAmenity=a=>setAmenities(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  async function handlePhotoUpload(e,cat){
    const files=Array.from(e.target.files);if(!files.length)return;if(!listingId){toast.error('Save basic info first');return;}
    setUploadingFor(cat);
    try{const fd=new FormData();files.forEach(f=>fd.append('images',f));fd.append('category',cat);const{data}=await uploadAPI.uploadImages(listingId,fd);setUploadedPhotos(p=>({...p,[cat]:[...(p[cat]||[]),...data.images]}));toast.success(`${data.images.length} photo(s) uploaded`);}
    catch(err){toast.error(err.response?.data?.error||'Upload failed');}finally{setUploadingFor(null);}
  }
  async function handleNext(){
    if(step===0){
      if(!form.title||!form.description)return toast.error('Please fill required fields');
      if(!listingId){setSubmitting(true);try{const{data}=await listingsAPI.create({...form,amenities,monthly_rent:parseInt(form.monthly_rent)||0,deposit:parseInt(form.deposit)||0});setListingId(data.listing.id);}catch(err){toast.error(err.response?.data?.error||'Failed to save');setSubmitting(false);return;}finally{setSubmitting(false);}}
    }
    if(step===3){if(!form.monthly_rent||!form.deposit)return toast.error('Please enter rent and deposit');if(listingId)try{await listingsAPI.update(listingId,{...form,amenities,monthly_rent:parseInt(form.monthly_rent),deposit:parseInt(form.deposit)});}catch(_){}}
    if(step<STEPS.length-1)setStep(s=>s+1);
  }
  return(
    <div className="max-w-2xl mx-auto">
      <div className="mb-6"><h1 className="text-2xl font-extrabold text-[#1a2e23]">Post New Listing</h1><p className="text-sm text-[#5a6e63] mt-1">KSh 100 via M-Pesa to publish · Reaches thousands on Thika Road</p></div>
      <div className="flex gap-0 mb-2 overflow-x-auto">
        {STEPS.map((s,i)=><div key={s} className="flex-1 min-w-[80px] text-center pb-2 border-b-2 transition-all" style={{borderColor:i<=step?'#1a7a4a':'#d4e4da'}}><div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto mb-1 text-xs font-bold transition-all ${i<step?'bg-green-400 text-white':i===step?'bg-green-600 text-white':'bg-[#d4e4da] text-[#7a9085]'}`}>{i<step?'✓':i+1}</div><div className={`text-[10px] font-semibold ${i===step?'text-green-600':'text-[#a0b0a8]'}`}>{s}</div></div>)}
      </div>
      <div className="h-1.5 bg-[#e0ede6] rounded-full mb-8 overflow-hidden"><div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{width:`${prog}%`}}/></div>

      {step===0&&<div className="space-y-4">
        <div className="form-group"><label className="label">Listing Title *</label><input className="input" placeholder="e.g. Spacious 1 Bedroom – Roysambu Junction" value={form.title} onChange={set('title')}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Room Type *</label><select className="input" value={form.room_type} onChange={set('room_type')}>{ROOM_TYPES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <div><label className="label">Floor</label><select className="input" value={form.floor_number} onChange={set('floor_number')}><option value={0}>Ground Floor</option>{[1,2,3,4,5].map(f=><option key={f} value={f}>Floor {f}</option>)}</select></div>
        </div>
        <div className="form-group"><label className="label">Description *</label><textarea className="input min-h-[100px] resize-none" placeholder="Describe the property, nearby landmarks, unique features…" value={form.description} onChange={set('description')}/></div>
        <div><label className="label">Amenities</label><div className="flex flex-wrap gap-2 mt-2">{AMENITIES.map(a=><button key={a} type="button" onClick={()=>toggleAmenity(a)} className={`chip ${amenities.includes(a)?'chip-active':''}`}>{a}</button>)}</div></div>
      </div>}

      {step===1&&<div className="space-y-4">
        <div><label className="label">Area / Neighbourhood *</label><select className="input" value={form.area} onChange={set('area')}>{AREAS.map(a=><option key={a} value={a}>{a}</option>)}</select></div>
        <div><label className="label">Street / Building Name</label><input className="input" placeholder="e.g. Mwiki Road, Sunrise Apartments Blk C" value={form.street} onChange={set('street')}/></div>
        <div><label className="label">Nearest Landmark / Stage *</label><input className="input" placeholder="e.g. 200m from Total Petrol Station" value={form.landmark} onChange={set('landmark')}/></div>
        <div><label className="label">Directions from Main Road</label><textarea className="input resize-none h-24" placeholder="How to get there…" value={form.directions} onChange={set('directions')}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Latitude (optional)</label><input className="input" placeholder="-1.2345" value={form.lat} onChange={set('lat')}/></div>
          <div><label className="label">Longitude (optional)</label><input className="input" placeholder="36.8765" value={form.lng} onChange={set('lng')}/></div>
        </div>
        <p className="text-xs text-[#7a9085]">📍 Coordinates enable a map pin. Right-click on Google Maps to get coords.</p>
      </div>}

      {step===2&&<div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-5 text-sm text-green-700">
          📸 Photo requirements for <strong>{ROOM_TYPES.find(r=>r.value===form.room_type)?.label}</strong>: {photoReqs.filter(p=>p.req).map(p=>p.label.replace(' *','')).join(', ')} are mandatory.
        </div>
        {!listingId&&<div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-sm text-yellow-700">⚠️ Complete Step 1 first to enable photo uploads.</div>}
        <div className="space-y-5">
          {photoReqs.map(({key,label})=>(
            <div key={key}>
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-semibold text-[#1a2e23]">{label}</span>{uploadedPhotos[key]?.length>0&&<span className="text-xs text-green-600 font-semibold">✓ {uploadedPhotos[key].length} uploaded</span>}</div>
              {uploadedPhotos[key]?.length>0&&<div className="grid grid-cols-4 gap-2 mb-2">{uploadedPhotos[key].map((img,i)=><div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-green-50 border border-[#d4e4da]"><img src={img.url} alt={key} className="w-full h-full object-cover"/><button onClick={()=>setUploadedPhotos(p=>({...p,[key]:p[key].filter((_,j)=>j!==i)}))} className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">✕</button></div>)}</div>}
              <label className={`upload-zone flex flex-col items-center gap-2 ${uploadingFor===key||!listingId?'opacity-50 pointer-events-none':''}`}>
                {uploadingFor===key?<><div className="w-6 h-6 spinner"/><span className="text-xs text-[#5a6e63]">Uploading…</span></>:<><span className="text-2xl">📷</span><span className="text-xs text-[#5a6e63]">Click to upload <strong>{label.replace(' *','')}</strong></span><span className="text-[10px] text-[#a0b0a8]">JPEG, PNG, WebP – max 5MB each</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={e=>handlePhotoUpload(e,key)} disabled={!listingId||uploadingFor===key}/>
              </label>
            </div>
          ))}
        </div>
      </div>}

      {step===3&&<div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Monthly Rent (KSh) *</label><input className="input" type="number" placeholder="e.g. 8000" value={form.monthly_rent} onChange={set('monthly_rent')}/></div>
          <div><label className="label">Deposit (KSh) *</label><input className="input" type="number" placeholder="e.g. 8000" value={form.deposit} onChange={set('deposit')}/></div>
        </div>
        <div><label className="label">Extra Fees (if any)</label><textarea className="input resize-none h-20" placeholder="e.g. Water: KSh 200/month, Garbage: KSh 50/month…" value={form.extra_fees} onChange={set('extra_fees')}/></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label">Available From</label><input className="input" type="date" value={form.available_from} onChange={set('available_from')}/></div>
          <div><label className="label">Minimum Lease</label><select className="input" value={form.minimum_lease} onChange={set('minimum_lease')}>{['1 Month','3 Months','6 Months','1 Year'].map(l=><option key={l} value={l}>{l}</option>)}</select></div>
        </div>
        <div className="flex items-center gap-3"><input type="checkbox" id="neg" className="w-4 h-4 accent-green-600" checked={form.is_negotiable} onChange={e=>setForm(p=>({...p,is_negotiable:e.target.checked}))}/><label htmlFor="neg" className="text-sm text-[#1a2e23]">Rent is negotiable</label></div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-700">⏰ <strong>Auto-Expiry:</strong> Your listing expires after <strong>5 days</strong>. Renew anytime for KSh 100.</div>
      </div>}

      {step===4&&<div>
        <div className="card p-5 mb-5"><h3 className="font-bold text-[#1a2e23] mb-4">Review Your Listing</h3>
          <div className="space-y-2 text-sm">
            {[['📋 Title',form.title||'—'],['🏠 Type',ROOM_TYPES.find(r=>r.value===form.room_type)?.label||'—'],['📍 Area',form.area],['📍 Landmark',form.landmark||'—'],['💰 Rent',form.monthly_rent?`KSh ${Number(form.monthly_rent).toLocaleString()}/month`:'—'],['💳 Deposit',form.deposit?`KSh ${Number(form.deposit).toLocaleString()}`:'—'],['⏰ Duration','5 days (auto-expires)'],['✨ Amenities',amenities.length?amenities.slice(0,4).join(', ')+(amenities.length>4?` +${amenities.length-4} more`:''):'None']].map(([l,v])=>(
              <div key={l} className="flex gap-3 py-2 border-b border-[#f0f5f2] last:border-0"><span className="text-[#7a9085] w-32 shrink-0">{l}</span><span className="font-semibold text-[#1a2e23]">{v}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center mb-5"><div className="text-3xl font-extrabold text-green-600 mb-1">KSh 100</div><div className="text-sm text-green-700 font-semibold">Publishing fee via M-Pesa</div><div className="text-xs text-green-600 mt-1">Listing goes live for 5 days after payment</div></div>
        <div className="space-y-1 text-xs text-[#7a9085]"><p>✅ By publishing, you confirm all information is accurate.</p><p>✅ You agree to the listing terms and auto-expiry policy.</p></div>
      </div>}

      <div className="flex gap-3 mt-8 justify-between">
        <button onClick={()=>setStep(s=>s-1)} disabled={step===0} className="btn btn-outline disabled:opacity-40">← Back</button>
        {step<STEPS.length-1
          ?<button onClick={handleNext} disabled={submitting} className="btn btn-primary">{submitting?<><span className="w-4 h-4 spinner mr-2"/>Saving…</>:'Continue →'}</button>
          :<button onClick={()=>{if(!listingId)return toast.error('Complete all steps first');setShowPay(true);}} className="btn btn-gold btn-lg">📲 Pay KSh 100 & Publish</button>}
      </div>
      {showPay&&<MpesaModal type="listing_fee" listingId={listingId} onClose={()=>setShowPay(false)} onSuccess={()=>{setShowPay(false);toast.success('🎉 Listing is now live!');nav('/dashboard/listings');}}/>}
    </div>
  );
}
