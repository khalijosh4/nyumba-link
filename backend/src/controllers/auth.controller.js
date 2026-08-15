const bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),{v4:uuidv4}=require('uuid');
const {query}=require('../config/database'),email=require('../services/email.service');
const sanitize=u=>{const{password_hash,verification_token,reset_password_token,...s}=u;return s;};
const genToken=id=>jwt.sign({userId:id},process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRES_IN||'7d'});
async function register(req,res,next){
  try{
    const{first_name,last_name,email:em,phone,password,role='tenant'}=req.body;
    if(!['tenant','landlord','caretaker'].includes(role)) return res.status(400).json({error:'Invalid role'});
    const{rows:ex}=await query('SELECT id FROM users WHERE email=$1 OR phone=$2',[em.toLowerCase(),phone]);
    if(ex.length) return res.status(409).json({error:'Email or phone already registered'});
    const hash=await bcrypt.hash(password,parseInt(process.env.BCRYPT_SALT_ROUNDS)||12);
    const vt=uuidv4();
    const{rows}=await query(`INSERT INTO users(first_name,last_name,email,phone,password_hash,role,verification_token,verification_token_expires)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [first_name,last_name,em.toLowerCase(),phone,hash,role,vt,new Date(Date.now()+864e5)]);
    const u=rows[0];
    await email.sendVerificationEmail({to:u.email,name:u.first_name,verificationLink:`${process.env.FRONTEND_URL}/verify-email?token=${vt}`}).catch(()=>{});
    res.status(201).json({message:'Account created. Check email to verify.',token:genToken(u.id),user:sanitize(u)});
  }catch(err){next(err);}
}
async function login(req,res,next){
  try{
    const{email:em,password}=req.body;
    const{rows}=await query('SELECT * FROM users WHERE email=$1 AND is_active=TRUE',[em.toLowerCase()]);
    if(!rows.length||!await bcrypt.compare(password,rows[0].password_hash)) return res.status(401).json({error:'Invalid email or password'});
    res.json({message:'Login successful',token:genToken(rows[0].id),user:sanitize(rows[0])});
  }catch(err){next(err);}
}
async function verifyEmail(req,res,next){
  try{
    const{token}=req.query;
    if(!token) return res.status(400).json({error:'Token required'});
    const{rows}=await query(`UPDATE users SET is_verified=TRUE,verification_token=NULL,verification_token_expires=NULL
      WHERE verification_token=$1 AND verification_token_expires>NOW() RETURNING *`,[token]);
    if(!rows.length) return res.status(400).json({error:'Invalid or expired token'});
    res.json({message:'Email verified',user:sanitize(rows[0])});
  }catch(err){next(err);}
}
async function forgotPassword(req,res,next){
  try{
    const{email:em}=req.body;
    const{rows}=await query('SELECT * FROM users WHERE email=$1',[em.toLowerCase()]);
    if(!rows.length) return res.json({message:'If that email exists, a reset link has been sent.'});
    const rt=uuidv4();
    await query('UPDATE users SET reset_password_token=$1,reset_password_expires=$2 WHERE id=$3',[rt,new Date(Date.now()+36e5),rows[0].id]);
    await email.sendPasswordResetEmail({to:rows[0].email,name:rows[0].first_name,resetLink:`${process.env.FRONTEND_URL}/reset-password?token=${rt}`}).catch(()=>{});
    res.json({message:'If that email exists, a reset link has been sent.'});
  }catch(err){next(err);}
}
async function resetPassword(req,res,next){
  try{
    const{token,password}=req.body;
    const{rows}=await query('SELECT * FROM users WHERE reset_password_token=$1 AND reset_password_expires>NOW()',[token]);
    if(!rows.length) return res.status(400).json({error:'Invalid or expired token'});
    await query('UPDATE users SET password_hash=$1,reset_password_token=NULL,reset_password_expires=NULL WHERE id=$2',[await bcrypt.hash(password,12),rows[0].id]);
    res.json({message:'Password reset. Please login.'});
  }catch(err){next(err);}
}
async function getMe(req,res){res.json({user:req.user});}
module.exports={register,login,verifyEmail,forgotPassword,resetPassword,getMe};
