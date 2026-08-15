const router=require('express').Router(),multer=require('multer'),cloudinary=require('cloudinary').v2;
const{authenticate,authorize}=require('../middleware/auth.middleware'),{query}=require('../config/database');
cloudinary.config({cloud_name:process.env.CLOUDINARY_CLOUD_NAME,api_key:process.env.CLOUDINARY_API_KEY,api_secret:process.env.CLOUDINARY_API_SECRET});
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter:(req,file,cb)=>{if(['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype))cb(null,true);else cb(new Error('Only JPEG/PNG/WebP allowed'));}});
router.post('/listing/:listing_id',authenticate,authorize('landlord','caretaker','admin'),upload.array('images',10),async(req,res,next)=>{
  try{
    const{listing_id}=req.params,{category='other',is_primary=false}=req.body;
    const{rows}=await query('SELECT id FROM listings WHERE id=$1 AND landlord_id=$2',[listing_id,req.user.id]);
    if(!rows.length&&req.user.role!=='admin') return res.status(403).json({error:'Not your listing'});
    if(!req.files?.length) return res.status(400).json({error:'No files uploaded'});
    const uploaded=[];
    for(const file of req.files){
      const result=await new Promise((resolve,reject)=>{
        const s=cloudinary.uploader.upload_stream({folder:`nyumbalink/listings/${listing_id}`,transformation:[{width:1200,height:900,crop:'limit',quality:'auto'}]},(err,r)=>err?reject(err):resolve(r));
        s.end(file.buffer);
      });
      const{rows:[img]}=await query(`INSERT INTO listing_images(listing_id,url,public_id,category,is_primary,sort_order) VALUES($1,$2,$3,$4,$5,(SELECT COALESCE(MAX(sort_order),0)+1 FROM listing_images WHERE listing_id=$1)) RETURNING *`,
        [listing_id,result.secure_url,result.public_id,category,is_primary]);
      uploaded.push(img);
    }
    res.json({message:`${uploaded.length} image(s) uploaded`,images:uploaded});
  }catch(err){next(err);}
});
router.delete('/image/:image_id',authenticate,async(req,res,next)=>{
  try{
    const{rows}=await query('SELECT li.*,l.landlord_id FROM listing_images li JOIN listings l ON l.id=li.listing_id WHERE li.id=$1',[req.params.image_id]);
    if(!rows.length) return res.status(404).json({error:'Image not found'});
    if(rows[0].landlord_id!==req.user.id&&req.user.role!=='admin') return res.status(403).json({error:'Not authorized'});
    if(rows[0].public_id) await cloudinary.uploader.destroy(rows[0].public_id).catch(()=>{});
    await query('DELETE FROM listing_images WHERE id=$1',[req.params.image_id]);
    res.json({message:'Image deleted'});
  }catch(err){next(err);}
});
module.exports=router;
