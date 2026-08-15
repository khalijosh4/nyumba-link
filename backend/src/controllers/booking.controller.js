const {query}=require('../config/database'),email=require('../services/email.service');
async function createBooking(req,res,next){
  try{
    const{listing_id,viewing_date,viewing_time,message}=req.body;
    const{rows:ls}=await query(`SELECT l.*,u.email as lemail,u.first_name as lfirst,u.phone as lphone
      FROM listings l JOIN users u ON u.id=l.landlord_id WHERE l.id=$1`,[listing_id]);
    if(!ls.length) return res.status(404).json({error:'Listing not found'});
    const listing=ls[0];
    if(listing.status!=='active') return res.status(400).json({error:'Listing is no longer active'});
    if(listing.landlord_id===req.user.id) return res.status(400).json({error:'Cannot book your own listing'});
    const{rows:ex}=await query('SELECT id FROM bookings WHERE listing_id=$1 AND tenant_id=$2 AND viewing_date=$3',[listing_id,req.user.id,viewing_date]);
    if(ex.length) return res.status(409).json({error:'You already have a booking for this date'});
    const{rows:[b]}=await query(`INSERT INTO bookings(listing_id,tenant_id,landlord_id,viewing_date,viewing_time,message)
      VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[listing_id,req.user.id,listing.landlord_id,viewing_date,viewing_time,message]);
    await Promise.all([
      email.sendBookingConfirmationTenant({to:req.user.email,tenantName:req.user.first_name,listing,booking:b}).catch(()=>{}),
      email.sendBookingNotificationLandlord({to:listing.lemail,landlordName:listing.lfirst,listing,booking:b,tenant:req.user}).catch(()=>{}),
    ]);
    await query("INSERT INTO notifications(user_id,type,title,message,data) VALUES($1,'new_booking','📅 New Booking',$2,$3)",
      [listing.landlord_id,`New viewing for "${listing.title}" on ${viewing_date}`,JSON.stringify({booking_id:b.id})]).catch(()=>{});
    res.status(201).json({message:'Booking sent',booking:b});
  }catch(err){next(err);}
}
async function getMyBookings(req,res,next){
  try{
    const isL=['landlord','caretaker','admin'].includes(req.user.role);
    const{rows}=await query(`SELECT b.*,l.title as listing_title,l.area,l.room_type,l.monthly_rent,
      t.first_name as tenant_first,t.last_name as tenant_last,t.phone as tenant_phone,t.email as tenant_email,
      ll.first_name as landlord_first,ll.last_name as landlord_last
      FROM bookings b JOIN listings l ON l.id=b.listing_id JOIN users t ON t.id=b.tenant_id JOIN users ll ON ll.id=b.landlord_id
      WHERE ${isL?'b.landlord_id':'b.tenant_id'}=$1 ORDER BY b.created_at DESC`,[req.user.id]);
    res.json({bookings:rows});
  }catch(err){next(err);}
}
async function updateBookingStatus(req,res,next){
  try{
    const{status,landlord_notes}=req.body;
    if(!['confirmed','cancelled','completed','no_show'].includes(status)) return res.status(400).json({error:'Invalid status'});
    const{rows:ex}=await query(`SELECT b.*,l.title as listing_title,t.email as tenant_email,t.first_name as tenant_name,t.id as tenant_id
      FROM bookings b JOIN listings l ON l.id=b.listing_id JOIN users t ON t.id=b.tenant_id WHERE b.id=$1`,[req.params.id]);
    if(!ex.length) return res.status(404).json({error:'Booking not found'});
    if(ex[0].landlord_id!==req.user.id&&req.user.role!=='admin') return res.status(403).json({error:'Not authorized'});
    const{rows:[updated]}=await query('UPDATE bookings SET status=$1,landlord_notes=$2 WHERE id=$3 RETURNING *',[status,landlord_notes,req.params.id]);
    if(status==='confirmed'){
      await email.sendBookingConfirmedTenant({to:ex[0].tenant_email,tenantName:ex[0].tenant_name,listing:ex[0],booking:{...ex[0],landlord_notes}}).catch(()=>{});
      await query("INSERT INTO notifications(user_id,type,title,message) VALUES($1,'booking_confirmed','✅ Viewing Confirmed',$2)",
        [ex[0].tenant_id,`Your viewing for "${ex[0].listing_title}" on ${ex[0].viewing_date} is confirmed!`]).catch(()=>{});
    }
    res.json({message:'Updated',booking:updated});
  }catch(err){next(err);}
}
module.exports={createBooking,getMyBookings,updateBookingStatus};
