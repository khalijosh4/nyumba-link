import{createContext,useContext,useState,useEffect,useCallback}from'react';
import api from'../services/api';
const AuthContext=createContext(null);
export function AuthProvider({children}){
  const[user,setUser]=useState(null);
  const[loading,setLoading]=useState(true);
  const[token,setToken]=useState(()=>localStorage.getItem('nl_token'));
  useEffect(()=>{
    if(token){
      api.defaults.headers.common['Authorization']=`Bearer ${token}`;
      api.get('/auth/me').then(({data})=>setUser(data.user)).catch(()=>{localStorage.removeItem('nl_token');setToken(null);}).finally(()=>setLoading(false));
    }else{setLoading(false);}
  },[]);
  const login=useCallback(async(email,password)=>{const{data}=await api.post('/auth/login',{email,password});localStorage.setItem('nl_token',data.token);api.defaults.headers.common['Authorization']=`Bearer ${data.token}`;setToken(data.token);setUser(data.user);return data.user;},[]);
  const register=useCallback(async(payload)=>{const{data}=await api.post('/auth/register',payload);localStorage.setItem('nl_token',data.token);api.defaults.headers.common['Authorization']=`Bearer ${data.token}`;setToken(data.token);setUser(data.user);return data.user;},[]);
  const logout=useCallback(()=>{localStorage.removeItem('nl_token');delete api.defaults.headers.common['Authorization'];setToken(null);setUser(null);},[]);
  const refreshUser=useCallback(async()=>{const{data}=await api.get('/auth/me');setUser(data.user);return data.user;},[]);
  return<AuthContext.Provider value={{user,token,loading,login,register,logout,refreshUser,isLandlord:user?.role==='landlord'||user?.role==='caretaker',isAdmin:user?.role==='admin',isLoggedIn:!!user}}>{children}</AuthContext.Provider>;
}
export function useAuth(){const ctx=useContext(AuthContext);if(!ctx)throw new Error('useAuth must be inside AuthProvider');return ctx;}
