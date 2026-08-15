import{useState}from'react';import{useSearchParams,Link}from'react-router-dom';import{authAPI}from'../services/api';import toast from'react-hot-toast';
export default function ResetPasswordPage(){
  const[sp]=useSearchParams();const[form,setForm]=useState({password:'',confirm:''});const[done,setDone]=useState(false);const[loading,setLoading]=useState(false);
  async function handleSubmit(e){e.preventDefault();if(form.password!==form.confirm)return toast.error('Passwords do not match');if(form.password.length<8)return toast.error('Password must be at least 8 characters');setLoading(true);try{await authAPI.resetPassword({token:sp.get('token'),password:form.password});setDone(true);}catch(err){toast.error(err.response?.data?.error||'Reset failed');}finally{setLoading(false);}}
  return(<div className="min-h-[60vh] flex items-center justify-center px-4">
    <div className="card p-8 max-w-sm w-full">
      {done?(<div className="text-center"><div className="text-5xl mb-4">✅</div><h2 className="text-xl font-bold text-[#1a2e23] mb-2">Password Reset!</h2><p className="text-sm text-[#5a6e63] mb-6">Your password has been updated. Please log in with your new password.</p><Link to="/?login=1" className="btn btn-primary">Login Now</Link></div>):(
        <><h2 className="text-xl font-extrabold text-[#1a2e23] mb-6">Reset Password 🔒</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="label">New Password</label><input className="input" type="password" placeholder="At least 8 characters" value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/></div>
          <div><label className="label">Confirm Password</label><input className="input" type="password" placeholder="Repeat password" value={form.confirm} onChange={e=>setForm(p=>({...p,confirm:e.target.value}))}/></div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading?'Resetting…':'Reset Password'}</button>
        </form></>
      )}
    </div>
  </div>);
}
