const bcrypt=require('bcryptjs'),{query}=require('../config/database');
const getProfile=async(req,res,next)=>{try{const{rows}=await query('SELECT id,first_name,last_name,email,phone,role,bio,location,avatar_url,is_verified,access_paid,access_expires_at,created_at FROM users WHERE id=$1',[req.user.id]);res.json({user:rows[0]});}catch(err){next(err);}};
const updateProfile=async(req,res,next)=>{try{const{first_name,last_name,bio,location,phone}=req.body;if(phone&&phone!==req.user.phone){const{rows}=await query('SELECT id FROM users WHERE phone=$1 AND id!=$2',[phone,req.user.id]);if(rows.length)return res.status(409).json({error:'Phone already in use'});}const{rows:[u]}=await query(`UPDATE users SET first_name=COALESCE($1,first_name),last_name=COALESCE($2,last_name),bio=COALESCE($3,bio),location=COALESCE($4,location),phone=COALESCE($5,phone),updated_at=NOW() WHERE id=$6 RETURNING id,first_name,last_name,email,phone,role,bio,location,avatar_url,is_verified`,[first_name,last_name,bio,location,phone,req.user.id]);res.json({message:'Profile updated',user:u});}catch(err){next(err);}};
const changePassword=async(req,res,next)=>{try{const{current_password,new_password}=req.body;const{rows}=await query('SELECT password_hash FROM users WHERE id=$1',[req.user.id]);if(!await bcrypt.compare(current_password,rows[0].password_hash))return res.status(400).json({error:'Current password is incorrect'});await query('UPDATE users SET password_hash=$1 WHERE id=$2',[await bcrypt.hash(new_password,12),req.user.id]);res.json({message:'Password changed'});}catch(err){next(err);}};
const getNotifications=async(req,res,next)=>{try{const{page=1,limit=20}=req.query;const{rows}=await query('SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',[req.user.id,limit,(page-1)*limit]);const{rows:[c]}=await query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE',[req.user.id]);res.json({notifications:rows,unread_count:parseInt(c.count)});}catch(err){next(err);}};
const markNotificationRead=async(req,res,next)=>{try{await query('UPDATE notifications SET is_read=TRUE WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({message:'Marked read'});}catch(err){next(err);}};
const markAllNotificationsRead=async(req,res,next)=>{try{await query('UPDATE notifications SET is_read=TRUE WHERE user_id=$1',[req.user.id]);res.json({message:'All marked read'});}catch(err){next(err);}};
const deleteNotification=async(req,res,next)=>{try{await query('DELETE FROM notifications WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({message:'Deleted'});}catch(err){next(err);}};
const getSearchAlerts=async(req,res,next)=>{try{const{rows}=await query('SELECT * FROM search_alerts WHERE user_id=$1 ORDER BY created_at DESC',[req.user.id]);res.json({alerts:rows});}catch(err){next(err);}};
const createSearchAlert=async(req,res,next)=>{try{const{rows:[c]}=await query('SELECT COUNT(*) FROM search_alerts WHERE user_id=$1',[req.user.id]);if(parseInt(c.count)>=5)return res.status(400).json({error:'Max 5 alerts'});const{area,room_type,min_rent,max_rent}=req.body;const{rows:[a]}=await query('INSERT INTO search_alerts(user_id,area,room_type,min_rent,max_rent) VALUES($1,$2,$3,$4,$5) RETURNING *',[req.user.id,area,room_type,min_rent,max_rent]);res.status(201).json({alert:a});}catch(err){next(err);}};
const deleteSearchAlert=async(req,res,next)=>{try{await query('DELETE FROM search_alerts WHERE id=$1 AND user_id=$2',[req.params.id,req.user.id]);res.json({message:'Deleted'});}catch(err){next(err);}};
const getDashboardStats=async(req,res,next)=>{
  try{
    const uid=req.user.id,isL=['landlord','caretaker','admin'].includes(req.user.role);
    if(isL){
      const[l,b,v,r]=await Promise.all([
        query("SELECT COUNT(*) FROM listings WHERE landlord_id=$1 AND status='active'",[uid]),
        query("SELECT COUNT(*) FROM bookings WHERE landlord_id=$1",[uid]),
        query("SELECT COALESCE(SUM(views),0) as total FROM listings WHERE landlord_id=$1",[uid]),
        query("SELECT COALESCE(SUM(amount),0) as total FROM payments WHERE user_id=$1 AND status='completed'",[uid]),
      ]);
      return res.json({active_listings:parseInt(l.rows[0].count),total_bookings:parseInt(b.rows[0].count),total_views:parseInt(v.rows[0].total),total_paid:parseInt(r.rows[0].total)});
    }
    const[b,f,n,u]=await Promise.all([
      query("SELECT COUNT(*) FROM bookings WHERE tenant_id=$1",[uid]),
      query("SELECT COUNT(*) FROM favourites WHERE user_id=$1",[uid]),
      query("SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=FALSE",[uid]),
      query("SELECT access_paid,access_expires_at FROM users WHERE id=$1",[uid]),
    ]);
    res.json({total_bookings:parseInt(b.rows[0].count),saved_listings:parseInt(f.rows[0].count),unread_notifications:parseInt(n.rows[0].count),access_paid:u.rows[0]?.access_paid||false,access_expires_at:u.rows[0]?.access_expires_at});
  }catch(err){next(err);}
};
module.exports={getProfile,updateProfile,changePassword,getNotifications,markNotificationRead,markAllNotificationsRead,deleteNotification,getSearchAlerts,createSearchAlert,deleteSearchAlert,getDashboardStats};
