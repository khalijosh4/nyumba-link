const jwt=require('jsonwebtoken');
const {query}=require('../config/database');
async function authenticate(req,res,next){
  try{
    const h=req.headers.authorization;
    if(!h?.startsWith('Bearer ')) return res.status(401).json({error:'No token provided'});
    const decoded=jwt.verify(h.split(' ')[1],process.env.JWT_SECRET);
    const {rows}=await query('SELECT id,email,first_name,last_name,role,is_active,is_verified,phone,access_paid FROM users WHERE id=$1',[decoded.userId]);
    if(!rows.length) return res.status(401).json({error:'User not found'});
    if(!rows[0].is_active) return res.status(403).json({error:'Account suspended'});
    req.user=rows[0]; next();
  }catch(err){
    if(err.name==='TokenExpiredError') return res.status(401).json({error:'Token expired'});
    if(err.name==='JsonWebTokenError') return res.status(401).json({error:'Invalid token'});
    next(err);
  }
}
async function optionalAuth(req,res,next){
  const h=req.headers.authorization;
  if(!h?.startsWith('Bearer ')) return next();
  try{
    const decoded=jwt.verify(h.split(' ')[1],process.env.JWT_SECRET);
    const {rows}=await query('SELECT id,email,first_name,last_name,role,access_paid FROM users WHERE id=$1',[decoded.userId]);
    if(rows.length) req.user=rows[0];
  }catch(_){}
  next();
}
function authorize(...roles){
  return(req,res,next)=>{
    if(!req.user) return res.status(401).json({error:'Authentication required'});
    if(!roles.includes(req.user.role)) return res.status(403).json({error:`Access denied. Required: ${roles.join(', ')}`});
    next();
  };
}
module.exports={authenticate,optionalAuth,authorize};
