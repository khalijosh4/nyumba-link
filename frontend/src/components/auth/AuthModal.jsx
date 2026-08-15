import{useState}from'react';import{useNavigate}from'react-router-dom';import{useAuth}from'../../context/AuthContext';import toast from'react-hot-toast';
export default function AuthModal({mode,onClose,onSwitch}){return(<div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}><div className="modal max-w-md w-full mx-4 sm:mx-0">{mode==='login'?<LoginForm onClose={onClose} onSwitch={onSwitch}/>:<RegisterForm onClose={onClose} onSwitch={onSwitch}/>}</div></div>);}
function LoginForm({onClose,onSwitch}){
  const{login}=useAuth(),nav=useNavigate();
  const[form,setForm]=useState({email:'',password:''});
  const[loading,setLoading]=useState(false);const[showPwd,setShowPwd]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  async function submit(e){e.preventDefault();if(!form.email||!form.password)return toast.error('Please fill all fields');setLoading(true);try{const u=await login(form.email,form.password);toast.success(`Welcome back, ${u.first_name}! 👋`);onClose();nav('/dashboard');}catch(err){toast.error(err.response?.data?.error||'Login failed');}finally{setLoading(false);}}
  const demo=async email=>{setLoading(true);try{const u=await login(email,'Password123!');toast.success(`Demo: ${u.role}`);onClose();nav('/dashboard');}catch{toast.error('Demo failed');}finally{setLoading(false);}};
  return(<div>
    <div className="flex items-center justify-between p-6 pb-0"><h2 className="text-xl font-extrabold text-[#1a2e23]">Welcome Back 👋</h2><button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a6e63] hover:bg-[#f0f5f2]">✕</button></div>
    <div className="p-6">
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} autoComplete="email"/></div>
        <div><label className="label">Password</label><div className="relative"><input className="input pr-12" type={showPwd?'text':'password'} placeholder="••••••••" value={form.password} onChange={set('password')}/><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5a6e63] font-semibold">{showPwd?'Hide':'Show'}</button></div></div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full">{loading?<><span className="w-4 h-4 spinner mr-2"/>Logging in…</>:'Login to Account'}</button>
      </form>
      <div className="relative my-4 text-center text-xs text-[#a0b0a8]"><span className="bg-white px-3 relative z-10">or try a demo</span><div className="absolute inset-x-0 top-1/2 h-px bg-[#e0ede6]"/></div>
      <div className="grid grid-cols-3 gap-2">
        {[['🏠 Tenant','jane.kamau@demo.com'],['🏗️ Landlord','james.mwangi@demo.com'],['🛡️ Admin','admin@nyumbalink.co.ke']].map(([label,email])=><button key={email} onClick={()=>demo(email)} disabled={loading} className="btn btn-outline btn-sm text-xs">{label}</button>)}
      </div>
      <p className="text-center text-sm text-[#5a6e63] mt-5">No account? <button onClick={()=>onSwitch('register')} className="text-green-600 font-semibold hover:underline">Sign Up</button></p>
    </div>
  </div>);
}
function RegisterForm({onClose,onSwitch}){
  const{register}=useAuth(),nav=useNavigate();
  const[role,setRole]=useState('tenant');const[loading,setLoading]=useState(false);const[showPwd,setShowPwd]=useState(false);
  const[form,setForm]=useState({first_name:'',last_name:'',email:'',phone:'',password:''});
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  async function submit(e){e.preventDefault();const{first_name,last_name,email,phone,password}=form;if(!first_name||!last_name||!email||!phone||!password)return toast.error('Please fill all fields');if(password.length<8)return toast.error('Password must be at least 8 characters');setLoading(true);try{const u=await register({...form,phone:phone.replace(/\s/g,''),role});toast.success(`Welcome, ${u.first_name}! 🎉`);onClose();nav('/dashboard');}catch(err){toast.error(err.response?.data?.error||'Registration failed');}finally{setLoading(false);}}
  return(<div>
    <div className="flex items-center justify-between p-6 pb-0"><h2 className="text-xl font-extrabold text-[#1a2e23]">Create Account</h2><button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-[#5a6e63] hover:bg-[#f0f5f2]">✕</button></div>
    <div className="p-6">
      <p className="text-xs text-[#5a6e63] font-semibold mb-2 uppercase tracking-wide">I am a:</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[{v:'tenant',icon:'🏠',name:'Tenant / Seeker',desc:"Looking for a house"},{v:'landlord',icon:'🏗️',name:'Landlord / Caretaker',desc:'Have a house to let'}].map(r=><button key={r.v} type="button" onClick={()=>setRole(r.v)} className={`p-3 rounded-xl border-2 text-left transition-all ${role===r.v?'border-green-600 bg-green-50':'border-[#d4e4da] hover:border-green-300'}`}><div className="text-xl mb-1">{r.icon}</div><div className="text-xs font-bold text-[#1a2e23]">{r.name}</div><div className="text-xs text-[#5a6e63] mt-0.5">{r.desc}</div></button>)}
      </div>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3"><div><label className="label">First Name</label><input className="input" placeholder="John" value={form.first_name} onChange={set('first_name')}/></div><div><label className="label">Last Name</label><input className="input" placeholder="Kamau" value={form.last_name} onChange={set('last_name')}/></div></div>
        <div><label className="label">Email</label><input className="input" type="email" placeholder="john@email.com" value={form.email} onChange={set('email')}/></div>
        <div><label className="label">Phone (M-Pesa)</label><div className="flex gap-2"><span className="input w-16 text-center shrink-0 text-[#5a6e63]">+254</span><input className="input" type="tel" placeholder="7XX XXX XXX" value={form.phone} onChange={set('phone')} maxLength={10}/></div></div>
        <div><label className="label">Password</label><div className="relative"><input className="input pr-12" type={showPwd?'text':'password'} placeholder="At least 8 characters" value={form.password} onChange={set('password')}/><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#5a6e63] font-semibold">{showPwd?'Hide':'Show'}</button></div></div>
        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">{loading?<><span className="w-4 h-4 spinner mr-2"/>Creating…</>:'Create Account'}</button>
      </form>
      <p className="text-center text-sm text-[#5a6e63] mt-4">Already have an account? <button onClick={()=>onSwitch('login')} className="text-green-600 font-semibold hover:underline">Login</button></p>
    </div>
  </div>);
}
