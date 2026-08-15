import{useState,useEffect,useCallback}from'react';
import{listingsAPI,usersAPI,bookingsAPI}from'../services/api';
export function useListings(params={}){
  const[listings,setListings]=useState([]);const[total,setTotal]=useState(0);const[pages,setPages]=useState(1);const[loading,setLoading]=useState(true);const[error,setError]=useState(null);
  const fetch=useCallback(async(p={})=>{setLoading(true);setError(null);try{const{data}=await listingsAPI.getAll({...params,...p});setListings(data.listings);setTotal(data.total);setPages(data.pages);}catch(err){setError(err.response?.data?.error||'Failed to load listings');}finally{setLoading(false);}},[]); 
  useEffect(()=>{fetch();},[fetch]);
  return{listings,total,pages,loading,error,refetch:fetch};
}
export function useListing(id){
  const[listing,setListing]=useState(null);const[loading,setLoading]=useState(true);const[error,setError]=useState(null);
  useEffect(()=>{if(!id)return;setLoading(true);listingsAPI.getOne(id).then(({data})=>setListing(data.listing)).catch(err=>setError(err.response?.data?.error||'Listing not found')).finally(()=>setLoading(false));},[id]);
  return{listing,loading,error};
}
export function useMyListings(){
  const[listings,setListings]=useState([]);const[loading,setLoading]=useState(true);
  const fetch=useCallback(()=>{setLoading(true);listingsAPI.getMine().then(({data})=>setListings(data.listings)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  useEffect(()=>{fetch();},[fetch]);return{listings,loading,refetch:fetch};
}
export function useFavourites(){
  const[listings,setListings]=useState([]);const[loading,setLoading]=useState(true);
  const fetch=useCallback(()=>{setLoading(true);listingsAPI.getFavourites().then(({data})=>setListings(data.listings)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  useEffect(()=>{fetch();},[fetch]);return{listings,loading,refetch:fetch};
}
export function useBookings(){
  const[bookings,setBookings]=useState([]);const[loading,setLoading]=useState(true);
  const fetch=useCallback(()=>{setLoading(true);bookingsAPI.getMine().then(({data})=>setBookings(data.bookings)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  useEffect(()=>{fetch();},[fetch]);return{bookings,loading,refetch:fetch};
}
export function useNotifications(){
  const[notifications,setNotifications]=useState([]);const[unreadCount,setUnreadCount]=useState(0);const[loading,setLoading]=useState(true);
  const fetch=useCallback(()=>{usersAPI.getNotifications().then(({data})=>{setNotifications(data.notifications);setUnreadCount(data.unread_count);}).catch(()=>{}).finally(()=>setLoading(false));},[]);
  useEffect(()=>{fetch();const t=setInterval(fetch,60000);return()=>clearInterval(t);},[fetch]);
  const markRead=useCallback(async id=>{await usersAPI.markRead(id);setNotifications(p=>p.map(n=>n.id===id?{...n,is_read:true}:n));setUnreadCount(p=>Math.max(0,p-1));},[]);
  const markAllRead=useCallback(async()=>{await usersAPI.markAllRead();setNotifications(p=>p.map(n=>({...n,is_read:true})));setUnreadCount(0);},[]);
  return{notifications,unreadCount,loading,refetch:fetch,markRead,markAllRead};
}
export function useDashboardStats(){
  const[stats,setStats]=useState(null);const[loading,setLoading]=useState(true);
  useEffect(()=>{usersAPI.getDashboardStats().then(({data})=>setStats(data)).catch(()=>{}).finally(()=>setLoading(false));},[]);
  return{stats,loading};
}
