import{useState,useEffect}from'react';import{Routes,Route,Link,useNavigate,useLocation}from'react-router-dom';
import{useAuth}from'../context/AuthContext';
import{useBookings,useFavourites,useMyListings,useNotifications,useDashboardStats}from'../hooks/index.js';
import{bookingsAPI,listingsAPI,usersAPI,adminAPI,paymentsAPI}from'../services/api';
import ListingCard from'../components/listings/ListingCard';
import MpesaModal from'../components/payment/MpesaModal';
import PostListingWizard from'../components/listings/PostListingWizard';
import{StatusBadge,EmptyState,FullPageSpinner,Countdown,Ksh,roomLabel}from'../components/common/index.jsx';
import toast from'react-hot-toast';

function Sidebar({onClose}){
  const{user,logout,isLandlord,isAdmin}=useAuth();const nav=useNavigate();const loc=useLocation();
  const isActive=p=>loc.pathname===p||(p!=='/dashboard'&&loc.pathname.startsWith(p));
  const links=[{to:'/dashboard',icon:'📊',label:'Overview'},{to:'/dashboard/bookings',icon:'📅',label:'Bookings'},{to:'/dashboard/favourites',icon:'❤️',label:'Saved Houses'},{to:'/dashboard/notifications',icon:'🔔',label:'Notifications'},...(isLandlord||isAdmin?[{to:'/dashboard/listings',icon:'🏠',label:'My Listings'},{to:'/dashboard/post',icon:'➕',label:'Post Listing'}]:[]),...(isAdmin?[{to:'/dashboard/admin',icon:'🛡️',label:'Admin Panel'}]:[]),{to:'/dashboard/profile',icon:'👤',label:'Profile'},{to:'/dashboard/payments',icon:'💳',label:'Payments'}];
  return(<div className="h-full flex flex-col bg-[#111c17] w-64 shrink-0">
    <div className="p-5 border-b border-white/10"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center font-bold text-white text-sm shrink-0">{user?.first_name?.[0]}{user?.last_name?.[0]}</div><div className="min-w-0"><div className="font-bold text-white text-sm truncate">{user?.first_name} {user?.last_name}</div><div className="text-xs text-white/40 capitalize">{user?.role}</div></div></div></div>
    <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
      {links.map(({to,icon,label})=><Link key={to} to={to} onClick={onClose} className={`sidebar-link ${isActive(to)?'sidebar-link-active':''}`}><span className="text-base w-5 text-center">{icon}</span><span className="text-sm">{label}</span></Link>)}
    </nav>
    <div className="p-3 border-t border-white/10"><button onClick={()=>{logout();nav('/');}} className="sidebar-link w-full text-red-400 hover:bg-red-500/10 hover:text-red-400"><span>🚪</span><span className="text-sm">Sign Out</span></button></div>
  </div>);
}

export default function DashboardPage(){
  const[sidebarOpen,setSidebarOpen]=useState(false);
  return(<div className="flex h-[calc(100vh-64px)] overflow-hidden">
    <aside className="hidden lg:flex shrink-0"><Sidebar/></aside>
    {sidebarOpen&&<div className="fixed inset-0 z-50 lg:hidden flex"><div className="fixed inset-0 bg-black/50" onClick={()=>setSidebarOpen(false)}/><div className="relative z-10 flex"><Sidebar onClose={()=>setSidebarOpen(false)}/></div></div>}
    <div className="flex-1 overflow-y-auto">
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-[#d4e4da] bg-white sticky top-0 z-10">
        <button onClick={()=>setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-[#f0f5f2]"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg></button>
        <span className="font-bold text-[#1a2e23]">Dashboard</span>
      </div>
      <div className="p-4 sm:p-6 lg:p-8">
        <Routes>
          <Route index element={<Overview/>}/>
          <Route path="bookings" element={<BookingsTab/>}/>
          <Route path="favourites" element={<FavouritesTab/>}/>
          <Route path="listings" element={<MyListingsTab/>}/>
          <Route path="post" element={<PostListingWizard/>}/>
          <Route path="notifications" element={<NotificationsTab/>}/>
          <Route path="profile" element={<ProfileTab/>}/>
          <Route path="payments" element={<PaymentsTab/>}/>
          <Route path="admin" element={<AdminTab/>}/>
        </Routes>
      </div>
    </div>
  </div>);
}

function Overview(){
  const{user,isLandlord}=useAuth();const{stats,loading}=useDashboardStats();const[showPay,setShowPay]=useState(false);
  const cards=isLandlord?[{icon:'🏠',label:'Active Listings',value:stats?.active_listings??'–'},{icon:'📅',label:'Total Bookings',value:stats?.total_bookings??'–'},{icon:'👁️',label:'Total Views',value:stats?.total_views??'–'},{icon:'💰',label:'Total Paid',value:stats?`KSh ${stats.total_paid}`:'–'}]:[{icon:'📅',label:'My Bookings',value:stats?.total_bookings??'–'},{icon:'❤️',label:'Saved Listings',value:stats?.saved_listings??'–'},{icon:'🔔',label:'Unread Alerts',value:stats?.unread_notifications??'–'},{icon:'🔓',label:'Access',value:stats?.access_paid?'Active':'Inactive'}];
  return(<div>
    <div className="mb-6"><h1 className="text-2xl font-extrabold text-[#1a2e23]">Good day, {user?.first_name}! 👋</h1><p className="text-sm text-[#5a6e63] mt-1">Here's what's happening with your account.</p></div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map(({icon,label,value})=><div key={label} className="card p-4"><div className="text-2xl mb-2">{icon}</div><div className="text-xs text-[#7a9085] font-semibold uppercase tracking-wide">{label}</div><div className="text-2xl font-extrabold text-[#1a2e23] mt-1">{loading?'–':value}</div></div>)}
    </div>
    {!isLandlord&&!stats?.access_paid&&<div className="card p-5 border-green-300 bg-green-50 mb-6 flex flex-col sm:flex-row sm:items-center gap-4"><div className="text-3xl">🔓</div><div className="flex-1"><div className="font-bold text-green-800">Unlock Full Access</div><div className="text-sm text-green-700 mt-0.5">Pay KSh 50 via M-Pesa to view landlord contacts and phone numbers.</div></div><button onClick={()=>setShowPay(true)} className="btn btn-primary shrink-0">Pay KSh 50</button></div>}
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {[{to:'/listings',icon:'🔍',label:'Browse Houses'},{to:'/dashboard/bookings',icon:'📅',label:'My Bookings'},{to:'/dashboard/favourites',icon:'❤️',label:'Saved Houses'},{to:'/dashboard/notifications',icon:'🔔',label:'Notifications'},{to:'/dashboard/profile',icon:'👤',label:'Edit Profile'},{to:'/dashboard/payments',icon:'💳',label:'Payment History'}].map(({to,icon,label})=>(
        <Link key={to} to={to} className="card p-4 flex items-center gap-3 hover:border-green-400 hover:bg-green-50 transition-all"><span className="text-xl">{icon}</span><span className="text-sm font-semibold text-[#1a2e23]">{label}</span></Link>
      ))}
    </div>
    {showPay&&<MpesaModal type="tenant_access" onClose={()=>setShowPay(false)} onSuccess={()=>{setShowPay(false);window.location.reload();}}/>}
  </div>);
}

function BookingsTab(){
  const{bookings,loading,refetch}=useBookings();const{isLandlord}=useAuth();const[filter,setFilter]=useState('all');
  const filtered=filter==='all'?bookings:bookings.filter(b=>b.status===filter);
  async function update(id,status){try{await bookingsAPI.updateStatus(id,{status});toast.success(`Booking ${status}`);refetch();}catch{toast.error('Failed to update');}}
  return(<div>
    <h1 className="text-2xl font-extrabold text-[#1a2e23] mb-6">Bookings</h1>
    <div className="flex gap-2 mb-5 flex-wrap">{['all','pending','confirmed','completed','cancelled'].map(s=><button key={s} onClick={()=>setFilter(s)} className={`chip capitalize ${filter===s?'chip-active':''}`}>{s}</button>)}</div>
    {loading?<FullPageSpinner/>:filtered.length===0?<EmptyState icon="📅" title="No bookings yet" message="Browse listings and book a viewing to see them here." action={<Link to="/listings" className="btn btn-primary">Browse Houses</Link>}/>:(
      <div className="space-y-3">
        {filtered.map(b=><div key={b.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0"><div className="font-bold text-[#1a2e23] text-sm truncate">{b.listing_title}</div><div className="text-xs text-[#7a9085] mt-0.5">📍 {b.area}</div><div className="text-xs text-[#5a6e63] mt-1">📅 {b.viewing_date} · {b.viewing_time}</div>{isLandlord&&<div className="text-xs text-[#5a6e63] mt-0.5">👤 {b.tenant_first} {b.tenant_last} · {b.tenant_phone}</div>}</div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap"><StatusBadge status={b.status}/>{isLandlord&&b.status==='pending'&&<><button onClick={()=>update(b.id,'confirmed')} className="btn btn-primary btn-sm">✅ Confirm</button><button onClick={()=>update(b.id,'cancelled')} className="btn btn-outline btn-sm text-red-500">✕</button></>}{!isLandlord&&b.status==='pending'&&<button onClick={()=>update(b.id,'cancelled')} className="btn btn-outline btn-sm text-red-500">Cancel</button>}</div>
        </div>)}
      </div>
    )}
  </div>);
}

function FavouritesTab(){
  const{listings,loading,refetch}=useFavourites();
  return(<div><h1 className="text-2xl font-extrabold text-[#1a2e23] mb-6">Saved Houses</h1>{loading?<FullPageSpinner/>:listings.length===0?<EmptyState icon="❤️" title="No saved houses yet" message="Browse listings and tap ❤️ to save them here." action={<Link to="/listings" className="btn btn-primary">Browse Houses</Link>}/>:<div className="listings-grid">{listings.map(l=><ListingCard key={l.id} listing={{...l,isFavourite:true}} onFavToggle={refetch}/>)}</div>}</div>);
}

function MyListingsTab(){
  const{listings,loading,refetch}=useMyListings();const[showPay,setShowPay]=useState(false);const[renewId,setRenewId]=useState(null);
  async function del(id){if(!confirm('Delete this listing?'))return;try{await listingsAPI.remove(id);toast.success('Listing deleted');refetch();}catch{toast.error('Failed');}}
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-extrabold text-[#1a2e23]">My Listings</h1><Link to="/dashboard/post" className="btn btn-primary btn-sm">➕ New Listing</Link></div>
    {loading?<FullPageSpinner/>:listings.length===0?<EmptyState icon="🏠" title="No listings yet" message="Post your first listing and reach thousands of house seekers on Thika Road." action={<Link to="/dashboard/post" className="btn btn-primary">Post a Listing</Link>}/>:(
      <div className="space-y-3">{listings.map(l=><div key={l.id} className="card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0"><div className="flex items-center gap-2 flex-wrap mb-1"><span className="font-bold text-[#1a2e23] text-sm">{l.title}</span><StatusBadge status={l.status}/></div><div className="text-xs text-[#7a9085]">📍 {l.area} · {roomLabel(l.room_type)}</div><div className="flex items-center gap-3 mt-1 text-xs text-[#5a6e63]"><span className="font-bold text-green-600"><Ksh amount={l.monthly_rent}/>/mo</span><span>👁️ {l.views} views</span><span>📅 {l.booking_count} bookings</span>{l.expires_at&&<Countdown expiresAt={l.expires_at}/>}</div></div>
        <div className="flex gap-2 shrink-0 flex-wrap"><Link to={`/listings/${l.id}`} className="btn btn-outline btn-sm">👁️ View</Link>{(l.status==='active'||l.status==='expired')&&<button onClick={()=>{setRenewId(l.id);setShowPay(true);}} className="btn btn-gold btn-sm">🔄 Renew</button>}<button onClick={()=>del(l.id)} className="btn btn-outline btn-sm text-red-500">🗑️</button></div>
      </div>)}</div>
    )}
    {showPay&&<MpesaModal type="listing_renewal" listingId={renewId} onClose={()=>setShowPay(false)} onSuccess={()=>{setShowPay(false);refetch();}}/>}
  </div>);
}

function NotificationsTab(){
  const{notifications,loading,markRead,markAllRead}=useNotifications();
  return(<div>
    <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-extrabold text-[#1a2e23]">Notifications</h1><button onClick={markAllRead} className="btn btn-outline btn-sm">Mark All Read</button></div>
    {loading?<FullPageSpinner/>:notifications.length===0?<EmptyState icon="🔔" title="No notifications yet" message="You're all caught up!"/>:(
      <div className="space-y-2">{notifications.map(n=><div key={n.id} onClick={()=>!n.is_read&&markRead(n.id)} className={`card p-4 flex gap-3 cursor-pointer transition-all ${!n.is_read?'border-green-300 bg-green-50':'hover:bg-[#f7faf8]'}`}>
        <div className="text-xl shrink-0 mt-0.5">{n.title.slice(0,2)}</div>
        <div className="flex-1 min-w-0"><div className={`text-sm ${!n.is_read?'font-semibold text-[#1a2e23]':'text-[#5a6e63]'}`}>{n.title}</div><div className="text-xs text-[#7a9085] mt-0.5 line-clamp-2">{n.message}</div><div className="text-[10px] text-[#a0b0a8] mt-1">{new Date(n.created_at).toLocaleString('en-KE',{dateStyle:'medium',timeStyle:'short'})}</div></div>
        {!n.is_read&&<div className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-2"/>}
      </div>)}</div>
    )}
  </div>);
}

function ProfileTab(){
  const{user,refreshUser}=useAuth();
  const[form,setForm]=useState({first_name:user?.first_name||'',last_name:user?.last_name||'',phone:user?.phone||'',bio:user?.bio||'',location:user?.location||''});
  const[pwd,setPwd]=useState({current_password:'',new_password:'',confirm:''});
  const[saving,setSaving]=useState(false);
  const set=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const sp=k=>e=>setPwd(p=>({...p,[k]:e.target.value}));
  async function saveProfile(e){e.preventDefault();setSaving(true);try{await usersAPI.updateProfile(form);await refreshUser();toast.success('Profile updated ✅');}catch(err){toast.error(err.response?.data?.error||'Update failed');}finally{setSaving(false);}}
  async function changePwd(e){e.preventDefault();if(pwd.new_password!==pwd.confirm)return toast.error('Passwords do not match');try{await usersAPI.changePassword({current_password:pwd.current_password,new_password:pwd.new_password});toast.success('Password changed ✅');setPwd({current_password:'',new_password:'',confirm:''});}catch(err){toast.error(err.response?.data?.error||'Failed');}}
  return(<div className="max-w-lg">
    <h1 className="text-2xl font-extrabold text-[#1a2e23] mb-6">Profile & Settings</h1>
    <div className="card p-5 mb-5"><h2 className="font-bold text-[#1a2e23] mb-4">Personal Information</h2>
      <form onSubmit={saveProfile} className="space-y-4">
        <div className="grid grid-cols-2 gap-3"><div><label className="label">First Name</label><input className="input" value={form.first_name} onChange={set('first_name')}/></div><div><label className="label">Last Name</label><input className="input" value={form.last_name} onChange={set('last_name')}/></div></div>
        <div><label className="label">Email</label><input className="input bg-[#f0f5f2]" value={user?.email} disabled/></div>
        <div><label className="label">Phone (M-Pesa)</label><input className="input" value={form.phone} onChange={set('phone')}/></div>
        <div><label className="label">Location/Area</label><input className="input" placeholder="e.g. Roysambu" value={form.location} onChange={set('location')}/></div>
        <div><label className="label">Bio</label><textarea className="input resize-none h-20" placeholder="Tell us about yourself…" value={form.bio} onChange={set('bio')}/></div>
        <button type="submit" disabled={saving} className="btn btn-primary">{saving?'Saving…':'Save Changes'}</button>
      </form>
    </div>
    <div className="card p-5"><h2 className="font-bold text-[#1a2e23] mb-4">Change Password</h2>
      <form onSubmit={changePwd} className="space-y-3">
        <div><label className="label">Current Password</label><input className="input" type="password" value={pwd.current_password} onChange={sp('current_password')}/></div>
        <div><label className="label">New Password</label><input className="input" type="password" value={pwd.new_password} onChange={sp('new_password')}/></div>
        <div><label className="label">Confirm Password</label><input className="input" type="password" value={pwd.confirm} onChange={sp('confirm')}/></div>
        <button type="submit" className="btn btn-primary">Change Password</button>
      </form>
    </div>
  </div>);
}

function PaymentsTab(){
  const[payments,setPayments]=useState([]);const[loading,setLoading]=useState(true);
  useEffect(()=>{paymentsAPI.getMine().then(({data})=>setPayments(data.payments)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  return(<div><h1 className="text-2xl font-extrabold text-[#1a2e23] mb-6">Payment History</h1>
    {loading?<FullPageSpinner/>:payments.length===0?<EmptyState icon="💳" title="No payments yet" message="Your M-Pesa transactions will appear here."/>:(
      <div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
        <thead><tr className="bg-[#f7faf8] border-b border-[#e0ede6]">{['Date','Type','Amount','Status','M-Pesa Code'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-bold text-[#7a9085] uppercase whitespace-nowrap">{h}</th>)}</tr></thead>
        <tbody>{payments.map(p=><tr key={p.id} className="border-b border-[#f0f5f2] hover:bg-[#f7faf8]"><td className="px-4 py-3 text-[#5a6e63] whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('en-KE')}</td><td className="px-4 py-3 capitalize">{p.type.replace(/_/g,' ')}</td><td className="px-4 py-3 font-bold text-green-600">KSh {p.amount}</td><td className="px-4 py-3"><StatusBadge status={p.status}/></td><td className="px-4 py-3 font-mono text-xs text-[#7a9085]">{p.mpesa_receipt_number||'–'}</td></tr>)}</tbody>
      </table></div></div>
    )}
  </div>);
}

function AdminTab(){
  const[stats,setStats]=useState(null);const[listings,setListings]=useState([]);const[users,setUsers]=useState([]);const[tab,setTab]=useState('listings');const[loading,setLoading]=useState(true);
  useEffect(()=>{Promise.all([adminAPI.getStats(),adminAPI.getListings({status:'pending'}),adminAPI.getUsers()]).then(([s,l,u])=>{setStats(s.data);setListings(l.data.listings);setUsers(u.data.users);}).finally(()=>setLoading(false));},[]);
  async function approve(id){try{await adminAPI.approveListing(id);toast.success('Approved!');setListings(p=>p.filter(l=>l.id!==id));}catch{toast.error('Failed');}}
  async function suspend(id){try{await adminAPI.suspendListing(id);toast.success('Suspended');setListings(p=>p.filter(l=>l.id!==id));}catch{toast.error('Failed');}}
  if(loading)return<FullPageSpinner/>;
  return(<div>
    <h1 className="text-2xl font-extrabold text-[#1a2e23] mb-6">Admin Panel 🛡️</h1>
    {stats&&<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">{[{label:'Total Users',value:stats.users,icon:'👥'},{label:'Active Listings',value:stats.activeListings,icon:'🏠'},{label:'Pending Review',value:stats.pendingListings,icon:'⏳'},{label:'Revenue',value:`KSh ${stats.revenue}`,icon:'💰'}].map(({label,value,icon})=><div key={label} className="card p-4 text-center"><div className="text-2xl mb-1">{icon}</div><div className="text-xl font-extrabold text-[#1a2e23]">{value}</div><div className="text-xs text-[#7a9085] mt-0.5">{label}</div></div>)}</div>}
    <div className="flex gap-2 mb-5">{['listings','users'].map(t=><button key={t} onClick={()=>setTab(t)} className={`chip capitalize ${tab===t?'chip-active':''}`}>{t}</button>)}</div>
    {tab==='listings'&&<div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="bg-[#f7faf8] border-b border-[#e0ede6]">{['Title','Landlord','Area','Price','Actions'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-bold text-[#7a9085] uppercase">{h}</th>)}</tr></thead>
      <tbody>{listings.length===0?<tr><td colSpan={5} className="px-4 py-8 text-center text-[#7a9085]">No pending listings</td></tr>:listings.map(l=><tr key={l.id} className="border-b border-[#f0f5f2] hover:bg-[#f7faf8]"><td className="px-4 py-3 font-semibold max-w-[180px] truncate">{l.title}</td><td className="px-4 py-3 text-[#5a6e63]">{l.first_name} {l.last_name}</td><td className="px-4 py-3">{l.area}</td><td className="px-4 py-3 font-bold text-green-600">KSh {Number(l.monthly_rent).toLocaleString()}</td><td className="px-4 py-3"><div className="flex gap-2"><button onClick={()=>approve(l.id)} className="btn btn-primary btn-sm">✅ Approve</button><button onClick={()=>suspend(l.id)} className="btn btn-outline btn-sm text-red-500">🚫 Reject</button></div></td></tr>)}</tbody>
    </table></div></div>}
    {tab==='users'&&<div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="bg-[#f7faf8] border-b border-[#e0ede6]">{['Name','Email','Role','Verified','Status','Action'].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-bold text-[#7a9085] uppercase">{h}</th>)}</tr></thead>
      <tbody>{users.map(u=><tr key={u.id} className="border-b border-[#f0f5f2] hover:bg-[#f7faf8]"><td className="px-4 py-3 font-semibold">{u.first_name} {u.last_name}</td><td className="px-4 py-3 text-[#5a6e63] text-xs">{u.email}</td><td className="px-4 py-3 capitalize"><span className="badge badge-green">{u.role}</span></td><td className="px-4 py-3">{u.is_verified?'✅':'❌'}</td><td className="px-4 py-3">{u.is_active?'🟢 Active':'🔴 Suspended'}</td><td className="px-4 py-3"><button onClick={async()=>{await adminAPI.toggleUser(u.id);setUsers(p=>p.map(x=>x.id===u.id?{...x,is_active:!x.is_active}:x));}} className="btn btn-outline btn-sm text-xs">{u.is_active?'Suspend':'Activate'}</button></td></tr>)}
      </tbody>
    </table></div></div>}
  </div>);
}
