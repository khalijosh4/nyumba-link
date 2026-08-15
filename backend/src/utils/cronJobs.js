const cron=require('node-cron');
const {query}=require('../config/database');
const email=require('../services/email.service');
function startCronJobs(){
  cron.schedule('0 * * * *',async()=>{
    try{
      const {rows}=await query("UPDATE listings SET status='expired' WHERE status='active' AND expires_at<=NOW() RETURNING id,title");
      if(rows.length) console.log(`⏰ Expired ${rows.length} listing(s)`);
    }catch(e){console.error('Cron expire:',e.message);}
  });
  cron.schedule('0 8 * * *',async()=>{
    try{
      const {rows}=await query(`SELECT l.*,u.email,u.first_name FROM listings l JOIN users u ON u.id=l.landlord_id
        WHERE l.status='active' AND l.expires_at BETWEEN NOW() AND NOW()+INTERVAL '26 hours'`);
      for(const l of rows){
        await email.sendListingExpiryWarning({to:l.email,landlordName:l.first_name,listing:l}).catch(()=>{});
        await query("INSERT INTO notifications(user_id,type,title,message) VALUES($1,'expiry_warning','⚠️ Listing Expiring Soon',$2)",
          [l.landlord_id,`"${l.title}" expires tomorrow. Renew for KSh 100.`]).catch(()=>{});
      }
    }catch(e){console.error('Cron warning:',e.message);}
  });
  cron.schedule('*/5 * * * *',async()=>{
    await query("UPDATE payments SET status='timeout' WHERE status='pending' AND created_at<NOW()-INTERVAL '10 minutes'").catch(()=>{});
  });
  cron.schedule('0 9 * * *',async()=>{
    try{
      const {rows:alerts}=await query(`SELECT sa.*,u.email,u.first_name FROM search_alerts sa JOIN users u ON u.id=sa.user_id
        WHERE sa.is_active=TRUE AND (sa.last_notified_at IS NULL OR sa.last_notified_at<NOW()-INTERVAL '1 day')`);
      for(const a of alerts){
        const conds=["l.status='active'","l.published_at>NOW()-INTERVAL '1 day'"]; const params=[];
        if(a.area){params.push(a.area);conds.push(`l.area=$${params.length}`);}
        if(a.room_type){params.push(a.room_type);conds.push(`l.room_type=$${params.length}`);}
        if(a.min_rent){params.push(a.min_rent);conds.push(`l.monthly_rent>=$${params.length}`);}
        if(a.max_rent){params.push(a.max_rent);conds.push(`l.monthly_rent<=$${params.length}`);}
        const {rows:ls}=await query(`SELECT title,area,room_type,monthly_rent FROM listings l WHERE ${conds.join(' AND ')} LIMIT 5`,params);
        if(ls.length){
          await email.sendNewListingAlert({to:a.email,tenantName:a.first_name,listings:ls}).catch(()=>{});
          await query('UPDATE search_alerts SET last_notified_at=NOW() WHERE id=$1',[a.id]);
        }
      }
    }catch(e){console.error('Cron alerts:',e.message);}
  });
  console.log('⏰ Cron jobs registered');
}
module.exports={startCronJobs};
