import{useState,useEffect,useRef}from'react';import{useAuth}from'../../context/AuthContext';import{paymentsAPI}from'../../services/api';import toast from'react-hot-toast';
const CFG={tenant_access:{amount:50,title:'Unlock Full Access',desc:'View landlord contacts & full details for 30 days',icon:'🔓'},listing_fee:{amount:100,title:'Post Your Listing',desc:'Go live for 5 days across all Thika Road areas',icon:'🏠'},listing_renewal:{amount:100,title:'Renew Listing',desc:'Extend your listing for another 5 days',icon:'🔄'}};
export default function MpesaModal({type='tenant_access',listingId=null,onClose,onSuccess}){
  const{user}=useAuth(),cfg=CFG[type];
  const[step,setStep]=useState('form');const[phone,setPhone]=useState(user?.phone?.replace(/^254/,'0')||'');
  const[paymentId,setPaymentId]=useState(null);const[receipt,setReceipt]=useState(null);const[error,setError]=useState('');
  const pollRef=useRef(null);const pollCount=useRef(0);
  useEffect(()=>()=>clearInterval(pollRef.current),[]);
  function fmtPhone(r){let p=r.replace(/\D/g,'');if(p.startsWith('0'))p='254'+p.slice(1);if(!p.startsWith('254'))p='254'+p;return p;}
  async function initiatePay(){
    const fmt=fmtPhone(phone);if(fmt.length!==12){setError('Enter a valid Kenyan phone number');return;}
    setError('');setStep('processing');
    try{
      const{data}=await paymentsAPI.initiate({type,phone:fmt,listing_id:listingId||undefined});
      setPaymentId(data.paymentId);setStep('polling');pollCount.current=0;
      pollRef.current=setInterval(async()=>{
        pollCount.current++;
        if(pollCount.current>24){clearInterval(pollRef.current);setStep('failed');setError('Payment timed out. Please try again.');return;}
        try{const{data:pd}=await paymentsAPI.getStatus(data.paymentId);
          if(pd.status==='completed'){clearInterval(pollRef.current);setReceipt(pd.mpesa_receipt_number);setStep('success');toast.success('Payment confirmed! 🎉');onSuccess?.(pd);}
          else if(['failed','cancelled','timeout'].includes(pd.status)){clearInterval(pollRef.current);setStep('failed');setError('Payment was not completed.');}
        }catch(_){}
      },5000);
    }catch(err){setError(err.response?.data?.error||'Failed to send STK Push');setStep('form');}
  }
  return(
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&step!=='processing'&&onClose()}>
      <div className="modal max-w-sm w-full mx-4 sm:mx-0">
        <div className="flex items-center justify-between p-5 border-b border-[#e0ede6]">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-green-600 flex items-center justify-center text-white text-xl font-black">M</div><div><div className="font-bold text-[#1a2e23] text-sm">M-Pesa Payment</div><div className="text-xs text-[#5a6e63]">Safaricom Daraja API</div></div></div>
          {step!=='processing'&&<button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-[#5a6e63] hover:bg-[#f0f5f2] text-sm">✕</button>}
        </div>
        <div className="p-5">
          <div className="bg-gradient-to-br from-green-600 to-green-500 rounded-2xl p-5 text-white text-center mb-5">
            <div className="text-3xl mb-1">{cfg.icon}</div><div className="text-3xl font-extrabold">KSh {cfg.amount}</div>
            <div className="font-bold text-sm mt-1">{cfg.title}</div><div className="text-xs text-white/75 mt-1 max-w-[220px] mx-auto">{cfg.desc}</div>
          </div>
          {step==='form'&&(<div className="space-y-4">
            <div><label className="label">M-Pesa Phone Number</label>
              <div className="flex gap-2"><span className="input w-16 text-center shrink-0 text-[#5a6e63] font-semibold">+254</span>
              <input className="input flex-1" type="tel" placeholder="712 345 678" value={phone.replace(/^(\+?254|0)/,'')} onChange={e=>setPhone(e.target.value)} maxLength={10} autoComplete="tel"/></div>
              {error&&<p className="text-xs text-red-500 mt-1.5">{error}</p>}
              <p className="text-xs text-[#7a9085] mt-1.5">An STK Push will be sent to this number.</p>
            </div>
            <div className="bg-[#f7faf8] rounded-xl p-4 space-y-2">
              {['Enter your M-Pesa number and tap Pay','A prompt appears on your phone','Enter your M-Pesa PIN to confirm','Access granted instantly ✅'].map((s,i)=>(
                <div key={i} className="flex items-start gap-2.5"><div className="w-5 h-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i+1}</div><span className="text-xs text-[#5a6e63]">{s}</span></div>
              ))}
            </div>
            <button onClick={initiatePay} className="btn btn-primary w-full btn-lg">📲 Pay KSh {cfg.amount} via M-Pesa</button>
            <p className="text-center text-[10px] text-[#a0b0a8]">🔒 Secure via Safaricom Daraja API</p>
          </div>)}
          {step==='processing'&&<div className="text-center py-6 space-y-4"><div className="w-14 h-14 spinner mx-auto"/><div className="font-bold text-[#1a2e23]">Sending STK Push…</div><p className="text-sm text-[#5a6e63]">Check your phone for the M-Pesa prompt.</p></div>}
          {step==='polling'&&<div className="text-center py-6 space-y-4"><div className="text-5xl anim-pulse-green rounded-full w-16 h-16 bg-green-50 flex items-center justify-center mx-auto">📱</div><div className="font-bold text-[#1a2e23]">Waiting for payment…</div><p className="text-sm text-[#5a6e63]">Enter your M-Pesa PIN on your phone.</p><div className="flex items-center justify-center gap-2 text-xs text-[#7a9085]"><div className="w-3 h-3 spinner border-2"/>Checking status…</div><button onClick={()=>{clearInterval(pollRef.current);setStep('form');}} className="btn btn-outline btn-sm mx-auto">Cancel</button></div>}
          {step==='success'&&<div className="text-center py-6 space-y-3"><div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-3xl">✅</div><div className="font-extrabold text-green-600 text-lg">Payment Confirmed!</div><p className="text-sm text-[#5a6e63]">KSh {cfg.amount} received successfully.</p>{receipt&&<div className="bg-green-50 rounded-xl p-3 border border-green-200"><div className="text-xs text-[#5a6e63]">M-Pesa Receipt</div><div className="font-bold font-mono tracking-wider">{receipt}</div></div>}<button onClick={onClose} className="btn btn-primary w-full">Continue →</button></div>}
          {step==='failed'&&<div className="text-center py-6 space-y-3"><div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto text-3xl">❌</div><div className="font-bold text-red-600">Payment Failed</div><p className="text-sm text-[#5a6e63]">{error}</p><button onClick={()=>{setStep('form');setError('');}} className="btn btn-primary w-full">Try Again</button></div>}
        </div>
      </div>
    </div>
  );
}
