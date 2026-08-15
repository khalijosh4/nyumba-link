import{useEffect,useState}from'react';import{useSearchParams,Link}from'react-router-dom';import{authAPI}from'../services/api';
export default function VerifyEmailPage(){
  const[sp]=useSearchParams();const[status,setStatus]=useState('verifying');const[msg,setMsg]=useState('');
  useEffect(()=>{const t=sp.get('token');if(!t){setStatus('error');setMsg('No verification token found.');return;}authAPI.verifyEmail(t).then(()=>setStatus('success')).catch(err=>{setStatus('error');setMsg(err.response?.data?.error||'Verification failed.');});},[sp]);
  return(<div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="card p-10 max-w-md w-full text-center">
      {status==='verifying'&&<><div className="w-12 h-12 spinner mx-auto mb-4"/><h2 className="text-xl font-bold text-[#1a2e23]">Verifying your email…</h2></>}
      {status==='success'&&<><div className="text-5xl mb-4">✅</div><h2 className="text-xl font-bold text-[#1a2e23] mb-2">Email Verified!</h2><p className="text-sm text-[#5a6e63] mb-6">Your account is now active. You can log in and start browsing.</p><Link to="/?login=1" className="btn btn-primary">Login Now</Link></>}
      {status==='error'&&<><div className="text-5xl mb-4">❌</div><h2 className="text-xl font-bold text-[#1a2e23] mb-2">Verification Failed</h2><p className="text-sm text-[#5a6e63] mb-6">{msg}</p><Link to="/" className="btn btn-outline">Go Home</Link></>}
    </div>
  </div>);
}
