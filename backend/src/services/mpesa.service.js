const axios=require('axios');
const BASE=process.env.MPESA_ENV==='production'?'https://api.safaricom.co.ke':'https://sandbox.safaricom.co.ke';
async function getMpesaToken(){
  const key=process.env.MPESA_CONSUMER_KEY,secret=process.env.MPESA_CONSUMER_SECRET;
  if(!key||!secret) throw new Error('M-Pesa keys not configured');
  const {data}=await axios.get(`${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {headers:{Authorization:`Basic ${Buffer.from(`${key}:${secret}`).toString('base64')}`},timeout:10000});
  return data.access_token;
}
function getTimestamp(){ return new Date().toISOString().replace(/[-T:Z.]/g,'').slice(0,14); }
function getMpesaPassword(ts){ return Buffer.from(`${process.env.MPESA_SHORTCODE}${process.env.MPESA_PASSKEY}${ts}`).toString('base64'); }
function formatPhone(p){ p=p.replace(/\D/g,''); if(p.startsWith('0'))p='254'+p.slice(1); if(p.startsWith('+'))p=p.slice(1); if(!p.startsWith('254'))p='254'+p; return p; }
async function initiateStkPush({phone,amount,accountRef,description}){
  const token=await getMpesaToken(),ts=getTimestamp();
  const {data}=await axios.post(`${BASE}/mpesa/stkpush/v1/processrequest`,{
    BusinessShortCode:process.env.MPESA_SHORTCODE,Password:getMpesaPassword(ts),Timestamp:ts,
    TransactionType:'CustomerPayBillOnline',Amount:Math.ceil(amount),PartyA:formatPhone(phone),
    PartyB:process.env.MPESA_SHORTCODE,PhoneNumber:formatPhone(phone),CallBackURL:process.env.MPESA_CALLBACK_URL,
    AccountReference:accountRef.slice(0,20),TransactionDesc:description.slice(0,13),
  },{headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},timeout:15000});
  return data;
}
async function queryStkStatus(checkoutRequestId){
  const token=await getMpesaToken(),ts=getTimestamp();
  const {data}=await axios.post(`${BASE}/mpesa/stkpushquery/v1/query`,
    {BusinessShortCode:process.env.MPESA_SHORTCODE,Password:getMpesaPassword(ts),Timestamp:ts,CheckoutRequestID:checkoutRequestId},
    {headers:{Authorization:`Bearer ${token}`},timeout:10000});
  return data;
}
module.exports={initiateStkPush,queryStkStatus,formatPhone};
