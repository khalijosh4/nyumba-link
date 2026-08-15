const {query}=require('../config/database'),mpesa=require('../services/mpesa.service'),email=require('../services/email.service');
const AMOUNTS={tenant_access:50,listing_fee:100,listing_renewal:100};
async function initiatePayment(req,res,next){
  try{
    const{type,phone,listing_id}=req.body;
    if(!AMOUNTS[type]) return res.status(400).json({error:'Invalid payment type'});
    const amount=AMOUNTS[type],ref=`NL-${type.slice(0,3).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const descs={tenant_access:'NyumbaLink Access',listing_fee:'Listing Fee',listing_renewal:'Listing Renewal'};
    const{rows:[p]}=await query("INSERT INTO payments(user_id,listing_id,type,amount,phone,status) VALUES($1,$2,$3,$4,$5,'pending') RETURNING *",
      [req.user.id,listing_id||null,type,amount,phone]);
    let stk;
    try{stk=await mpesa.initiateStkPush({phone,amount,accountRef:ref,description:descs[type]});}
    catch(e){await query("UPDATE payments SET status='failed' WHERE id=$1",[p.id]);return res.status(502).json({error:'STK Push failed',details:e.message});}
    if(stk.ResponseCode!=='0'){await query("UPDATE payments SET status='failed' WHERE id=$1",[p.id]);return res.status(400).json({error:stk.ResponseDescription||'STK Push failed'});}
    await query('UPDATE payments SET mpesa_checkout_request_id=$1,mpesa_merchant_request_id=$2 WHERE id=$3',[stk.CheckoutRequestID,stk.MerchantRequestID,p.id]);
    res.json({message:'STK Push sent. Enter your M-Pesa PIN.',paymentId:p.id,checkoutRequestId:stk.CheckoutRequestID,amount});
  }catch(err){next(err);}
}
async function mpesaCallback(req,res){
  try{
    const cb=req.body?.Body?.stkCallback;
    if(!cb) return res.json({ResultCode:0,ResultDesc:'Accepted'});
    const{CheckoutRequestID,ResultCode,ResultDesc,CallbackMetadata}=cb;
    const{rows}=await query('SELECT p.*,u.email,u.first_name FROM payments p JOIN users u ON u.id=p.user_id WHERE p.mpesa_checkout_request_id=$1',[CheckoutRequestID]);
    if(!rows.length) return res.json({ResultCode:0,ResultDesc:'Accepted'});
    const p=rows[0];
    if(ResultCode===0){
      const items=CallbackMetadata?.Item||[],meta=n=>items.find(i=>i.Name===n)?.Value;
      const receipt=meta('MpesaReceiptNumber');
      await query("UPDATE payments SET status='completed',result_code=$1,result_desc=$2,mpesa_receipt_number=$3 WHERE id=$4",[ResultCode,ResultDesc,receipt,p.id]);
      if(p.type==='tenant_access') await query("UPDATE users SET access_paid=TRUE,access_paid_at=NOW(),access_expires_at=NOW()+INTERVAL '30 days' WHERE id=$1",[p.user_id]);
      if((p.type==='listing_fee'||p.type==='listing_renewal')&&p.listing_id){
        await query("UPDATE listings SET status='active',published_at=NOW(),expires_at=NOW()+INTERVAL '5 days' WHERE id=$1",[p.listing_id]);
        const{rows:[l]}=await query('SELECT * FROM listings WHERE id=$1',[p.listing_id]);
        if(l) await email.sendListingPublishedEmail({to:p.email,landlordName:p.first_name,listing:l}).catch(()=>{});
      }
      await query("INSERT INTO notifications(user_id,type,title,message) VALUES($1,'payment_success','✅ Payment Confirmed',$2)",
        [p.user_id,`KSh ${p.amount} received. ${p.type==='tenant_access'?'Full access unlocked!':'Listing is now live!'}`]).catch(()=>{});
      await email.sendPaymentSuccessEmail({to:p.email,name:p.first_name,payment:{...p,mpesa_receipt_number:receipt}}).catch(()=>{});
    }else{
      await query('UPDATE payments SET status=$1,result_code=$2,result_desc=$3 WHERE id=$4',[ResultCode===1032?'cancelled':'failed',ResultCode,ResultDesc,p.id]);
    }
    res.json({ResultCode:0,ResultDesc:'Accepted'});
  }catch(err){console.error('Callback error:',err);res.json({ResultCode:0,ResultDesc:'Accepted'});}
}
async function queryPaymentStatus(req,res,next){
  try{
    const{rows}=await query('SELECT id,status,mpesa_receipt_number,amount,type FROM payments WHERE id=$1 AND user_id=$2',[req.params.paymentId,req.user.id]);
    if(!rows.length) return res.status(404).json({error:'Payment not found'});
    res.json(rows[0]);
  }catch(err){next(err);}
}
async function getMyPayments(req,res,next){
  try{
    const{rows}=await query('SELECT p.*,l.title as listing_title FROM payments p LEFT JOIN listings l ON l.id=p.listing_id WHERE p.user_id=$1 ORDER BY p.created_at DESC LIMIT 50',[req.user.id]);
    res.json({payments:rows});
  }catch(err){next(err);}
}
module.exports={initiatePayment,mpesaCallback,queryPaymentStatus,getMyPayments};
