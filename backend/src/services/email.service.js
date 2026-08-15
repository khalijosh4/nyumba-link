const axios=require('axios');
const {query}=require('../config/database');
const FROM=process.env.MAILERSEND_FROM_EMAIL||'noreply@nyumbalink.co.ke';
const FROM_NAME=process.env.MAILERSEND_FROM_NAME||'NyumbaLink';
const FE=()=>process.env.FRONTEND_URL||'http://localhost:5173';

async function send({to,toName,subject,html,type='general'}){
  const key=process.env.MAILERSEND_API_KEY;
  if(!key||key.includes('your_api_token')){console.log(`📧 [SKIP] ${to} — ${subject}`);return{skipped:true};}
  try{
    const {headers}=await axios.post('https://api.mailersend.com/v1/email',
      {from:{email:FROM,name:FROM_NAME},to:[{email:to,name:toName||to}],subject,html},
      {headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},timeout:10000});
    await query('INSERT INTO email_logs(recipient_email,recipient_name,type,subject,status,mailersend_message_id) VALUES($1,$2,$3,$4,$5,$6)',
      [to,toName,type,subject,'sent',headers['x-message-id']||null]).catch(()=>{});
    return{success:true};
  }catch(err){
    const msg=err.response?.data?.message||err.message;
    await query('INSERT INTO email_logs(recipient_email,type,subject,status,error_message) VALUES($1,$2,$3,$4,$5)',
      [to,type,subject,'failed',msg]).catch(()=>{});
    console.error('Email error:',msg);
  }
}

function base(content){return `<!DOCTYPE html><html><body style="font-family:Sora,sans-serif;background:#f4f7f6;padding:32px 0">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table width="600" style="background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:linear-gradient(135deg,#111c17,#1a7a4a);padding:24px 40px;text-align:center">
  <div style="font-size:22px;font-weight:800;color:#fff">🏠 Nyumba<span style="color:#2ea06a">Link</span></div>
  <div style="font-size:11px;color:rgba(255,255,255,.5)">Thika Road's Premier Home Platform</div>
</td></tr>
<tr><td style="padding:32px 40px">${content}</td></tr>
<tr><td style="background:#f4f7f6;padding:16px 40px;text-align:center;border-top:1px solid #e0ede6">
  <p style="font-size:11px;color:#a0b0a8;margin:0">© ${new Date().getFullYear()} NyumbaLink · Thika Road, Kenya</p>
</td></tr></table></td></tr></table></body></html>`;}
function btn(t,u){return `<a href="${u}" style="display:inline-block;background:#1a7a4a;color:#fff;padding:12px 24px;border-radius:24px;text-decoration:none;font-weight:700;font-size:14px;margin:16px 0">${t}</a>`;}
function row(l,v){return `<div style="padding:6px 0;font-size:13px"><span style="color:#7a9085;width:130px;display:inline-block">${l}</span><strong>${v}</strong></div>`;}

const sendVerificationEmail=({to,name,verificationLink})=>send({to,toName:name,type:'verification',
  subject:'✅ Verify your NyumbaLink account',html:base(`<h2 style="font-size:20px;font-weight:800">Welcome, ${name}! 🎉</h2>
  <p style="color:#5a6e63">Click below to verify your email and activate your account.</p>
  <div style="text-align:center">${btn('✅ Verify My Email',verificationLink)}</div>
  <p style="font-size:12px;color:#a0b0a8">Link expires in 24 hours.</p>`)});

const sendBookingConfirmationTenant=({to,tenantName,listing,booking})=>send({to,toName:tenantName,type:'booking_tenant',
  subject:`📅 Viewing request sent – ${listing.title}`,html:base(`<h2 style="font-size:20px;font-weight:800">Viewing Requested! 📅</h2>
  <p>Hi <strong>${tenantName}</strong>, your viewing has been sent. Landlord will confirm within 24 hours.</p>
  <div style="background:#e6f5ed;border-radius:12px;padding:16px;margin:16px 0">
    ${row('🏠 Property',listing.title)}${row('📍 Area',listing.area)}
    ${row('📅 Date',booking.viewing_date)}${row('⏰ Time',booking.viewing_time)}
  </div><div style="text-align:center">${btn('View My Bookings',FE()+'/dashboard/bookings')}</div>`)});

const sendBookingNotificationLandlord=({to,landlordName,listing,booking,tenant})=>send({to,toName:landlordName,type:'booking_landlord',
  subject:`🔔 New viewing request – ${listing.title}`,html:base(`<h2 style="font-size:20px;font-weight:800">New Viewing Request! 🔔</h2>
  <p>Hi <strong>${landlordName}</strong>, a tenant wants to view <strong>${listing.title}</strong>.</p>
  <div style="background:#e6f5ed;border-radius:12px;padding:16px;margin:16px 0">
    ${row('👤 Tenant',`${tenant.first_name} ${tenant.last_name}`)}${row('📞 Phone',tenant.phone)}
    ${row('📧 Email',tenant.email)}${row('📅 Date',booking.viewing_date)}${row('⏰ Time',booking.viewing_time)}
    ${booking.message?row('💬 Message',booking.message):''}
  </div><div style="text-align:center">${btn('Manage Bookings',FE()+'/dashboard/bookings')}</div>`)});

const sendBookingConfirmedTenant=({to,tenantName,listing,booking})=>send({to,toName:tenantName,type:'booking_confirmed',
  subject:`✅ Viewing confirmed – ${listing.title}`,html:base(`<h2 style="font-size:20px;font-weight:800;color:#1a7a4a">Viewing Confirmed! ✅</h2>
  <p>Great news, <strong>${tenantName}</strong>! Your viewing is confirmed.</p>
  <div style="background:#e6f5ed;border-radius:12px;padding:16px;margin:16px 0;border-left:4px solid #1a7a4a">
    ${row('🏠 Property',listing.title||listing.listing_title)}${row('📅 Date',booking.viewing_date)}
    ${row('⏰ Time',booking.viewing_time)}${booking.landlord_notes?row('📝 Note',booking.landlord_notes):''}
  </div>`)});

const sendPaymentSuccessEmail=({to,name,payment})=>send({to,toName:name,type:'payment_success',
  subject:`✅ Payment of KSh ${payment.amount} received`,html:base(`<h2 style="font-size:20px;font-weight:800;color:#1a7a4a">Payment Confirmed ✅</h2>
  <div style="background:#e6f5ed;border-radius:12px;padding:16px;margin:16px 0">
    ${row('💰 Amount',`KSh ${payment.amount}`)}${row('📱 M-Pesa Code',payment.mpesa_receipt_number||'Processing')}
    ${row('📋 Type',payment.type.replace(/_/g,' '))}
  </div>`)});

const sendListingPublishedEmail=({to,landlordName,listing})=>send({to,toName:landlordName,type:'listing_published',
  subject:`🏠 Your listing is live – ${listing.title}`,html:base(`<h2 style="font-size:20px;font-weight:800">Listing is Live! 🎉</h2>
  <p>Hi <strong>${landlordName}</strong>, your property is now visible to thousands on Thika Road.</p>
  <div style="background:#e6f5ed;border-radius:12px;padding:16px;margin:16px 0">
    ${row('🏠 Property',listing.title)}${row('📍 Area',listing.area)}
    ${row('💰 Rent',`KSh ${Number(listing.monthly_rent).toLocaleString()}/mo`)}
    ${row('⏰ Expires',new Date(listing.expires_at).toLocaleDateString('en-KE'))}
  </div>
  <p style="background:#fef7e0;padding:12px;border-radius:8px;font-size:13px">⚠️ Auto-expires in 5 days. Renew for KSh 100.</p>`)});

const sendListingExpiryWarning=({to,landlordName,listing})=>send({to,toName:landlordName,type:'expiry_warning',
  subject:`⚠️ Listing expiring tomorrow – ${listing.title}`,html:base(`<h2 style="font-size:20px;font-weight:800;color:#c8920a">⚠️ Listing Expiring Tomorrow</h2>
  <p>Hi <strong>${landlordName}</strong>, <strong>"${listing.title}"</strong> expires tomorrow. Renew now!</p>
  <div style="text-align:center;margin:20px 0"><div style="font-size:32px;font-weight:800;color:#c8920a">KSh 100</div><div style="font-size:13px;color:#7a9085">to renew for 5 more days</div></div>
  <div style="text-align:center">${btn('🔄 Renew Listing',FE()+'/dashboard/listings')}</div>`)});

const sendPasswordResetEmail=({to,name,resetLink})=>send({to,toName:name,type:'password_reset',
  subject:'🔑 Reset your NyumbaLink password',html:base(`<h2 style="font-size:20px;font-weight:800">Reset Your Password 🔒</h2>
  <p>Hi <strong>${name}</strong>, click below to reset your password. Expires in 1 hour.</p>
  <div style="text-align:center">${btn('🔑 Reset Password',resetLink)}</div>
  <p style="font-size:12px;color:#a0b0a8">If you didn't request this, ignore this email.</p>`)});

const sendNewListingAlert=({to,tenantName,listings})=>send({to,toName:tenantName,type:'listing_alert',
  subject:`🏠 ${listings.length} new listings match your search`,html:base(`<h2 style="font-size:20px;font-weight:800">New Listings For You!</h2>
  <p>Hi <strong>${tenantName}</strong>, these match your saved search:</p>
  ${listings.map(l=>`<div style="border:1px solid #e0ede6;border-radius:10px;padding:12px;margin-bottom:10px">
    <div style="font-weight:700">${l.title}</div><div style="font-size:12px;color:#7a9085">📍 ${l.area}</div>
    <div style="font-size:16px;font-weight:800;color:#1a7a4a">KSh ${Number(l.monthly_rent).toLocaleString()}/mo</div>
  </div>`).join('')}
  <div style="text-align:center">${btn('View All Listings',FE()+'/listings')}</div>`)});

module.exports={sendVerificationEmail,sendBookingConfirmationTenant,sendBookingNotificationLandlord,
  sendBookingConfirmedTenant,sendPaymentSuccessEmail,sendListingPublishedEmail,
  sendListingExpiryWarning,sendPasswordResetEmail,sendNewListingAlert};
