const {query,getClient}=require('../config/database');
const email=require('../services/email.service');
async function getListings(req,res,next){
  try{
    const{area,room_type,min_rent,max_rent,search,page=1,limit=12,sort='newest'}=req.query;
    const params=[],conds=["l.status='active'","l.expires_at>NOW()"];
    if(area){params.push(area);conds.push(`l.area=$${params.length}`);}
    if(room_type){params.push(room_type);conds.push(`l.room_type=$${params.length}`);}
    if(min_rent){params.push(parseInt(min_rent));conds.push(`l.monthly_rent>=$${params.length}`);}
    if(max_rent){params.push(parseInt(max_rent));conds.push(`l.monthly_rent<=$${params.length}`);}
    if(search){params.push(`%${search}%`);conds.push(`(l.title ILIKE $${params.length} OR l.description ILIKE $${params.length} OR l.area ILIKE $${params.length})`);}
    const where=conds.join(' AND ');
    const orderMap={newest:'l.published_at DESC NULLS LAST',price_asc:'l.monthly_rent ASC',price_desc:'l.monthly_rent DESC',popular:'l.views DESC'};
    const order=orderMap[sort]||orderMap.newest;
    const offset=(parseInt(page)-1)*parseInt(limit);
    params.push(parseInt(limit),offset);
    const[{rows:listings},{rows:cnt}]=await Promise.all([
      query(`SELECT l.*,u.first_name as landlord_first_name,u.last_name as landlord_last_name,
        COALESCE(json_agg(DISTINCT la.amenity) FILTER(WHERE la.id IS NOT NULL),'[]') AS amenities,
        (SELECT url FROM listing_images WHERE listing_id=l.id AND is_primary=TRUE LIMIT 1) as primary_image
        FROM listings l LEFT JOIN users u ON u.id=l.landlord_id LEFT JOIN listing_amenities la ON la.listing_id=l.id
        WHERE ${where} GROUP BY l.id,u.first_name,u.last_name ORDER BY l.is_featured DESC,${order}
        LIMIT $${params.length-1} OFFSET $${params.length}`,params),
      query(`SELECT COUNT(*) FROM listings l WHERE ${where}`,params.slice(0,-2)),
    ]);
    res.json({listings,total:parseInt(cnt[0].count),page:parseInt(page),pages:Math.ceil(parseInt(cnt[0].count)/parseInt(limit))});
  }catch(err){next(err);}
}
async function getListingById(req,res,next){
  try{
    const{rows}=await query(`SELECT l.*,u.first_name as landlord_first_name,u.last_name as landlord_last_name,
      u.phone as landlord_phone,u.email as landlord_email,
      (SELECT COUNT(*) FROM listings WHERE landlord_id=l.landlord_id AND status='active') as landlord_active_listings,
      COALESCE(json_agg(DISTINCT jsonb_build_object('url',li.url,'category',li.category,'is_primary',li.is_primary)
        ORDER BY li.sort_order) FILTER(WHERE li.id IS NOT NULL),'[]') AS images,
      COALESCE(json_agg(DISTINCT la.amenity) FILTER(WHERE la.id IS NOT NULL),'[]') AS amenities
      FROM listings l LEFT JOIN users u ON u.id=l.landlord_id
        LEFT JOIN listing_images li ON li.listing_id=l.id LEFT JOIN listing_amenities la ON la.listing_id=l.id
      WHERE l.id=$1 GROUP BY l.id,u.first_name,u.last_name,u.phone,u.email`,[req.params.id]);
    if(!rows.length) return res.status(404).json({error:'Listing not found'});
    await query('UPDATE listings SET views=views+1 WHERE id=$1',[req.params.id]).catch(()=>{});
    const listing=rows[0];
    if(!req.user?.access_paid&&req.user?.role==='tenant'){listing.landlord_phone=null;listing.landlord_email=null;}
    let isFavourite=false;
    if(req.user){const{rows:f}=await query('SELECT id FROM favourites WHERE user_id=$1 AND listing_id=$2',[req.user.id,req.params.id]);isFavourite=f.length>0;}
    res.json({listing:{...listing,isFavourite}});
  }catch(err){next(err);}
}
async function createListing(req,res,next){
  const client=await getClient();
  try{
    await client.query('BEGIN');
    const{title,description,room_type,floor_number=0,area,street,landmark,directions,lat,lng,monthly_rent,deposit,extra_fees,available_from,minimum_lease='1 Month',is_negotiable=false,amenities=[]}=req.body;
    const{rows:[l]}=await client.query(`INSERT INTO listings(landlord_id,title,description,room_type,floor_number,area,street,landmark,directions,lat,lng,monthly_rent,deposit,extra_fees,available_from,minimum_lease,is_negotiable,status,expires_at)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'pending',NOW()+INTERVAL '5 days') RETURNING *`,
      [req.user.id,title,description,room_type,floor_number,area,street,landmark,directions,lat||null,lng||null,monthly_rent,deposit,extra_fees,available_from||null,minimum_lease,is_negotiable]);
    if(amenities.length){const v=amenities.map((_,i)=>`($1,$${i+2})`).join(',');await client.query(`INSERT INTO listing_amenities(listing_id,amenity) VALUES ${v}`,[l.id,...amenities]);}
    await client.query('COMMIT');
    res.status(201).json({message:'Listing created. Will go live after payment.',listing:l});
  }catch(err){await client.query('ROLLBACK');next(err);}
  finally{client.release();}
}
async function updateListing(req,res,next){
  try{
    const{rows:ex}=await query('SELECT * FROM listings WHERE id=$1',[req.params.id]);
    if(!ex.length) return res.status(404).json({error:'Not found'});
    if(req.user.role!=='admin'&&ex[0].landlord_id!==req.user.id) return res.status(403).json({error:'Not your listing'});
    const{title,description,monthly_rent,deposit,extra_fees,amenities}=req.body;
    const{rows:[updated]}=await query('UPDATE listings SET title=$1,description=$2,monthly_rent=$3,deposit=$4,extra_fees=$5 WHERE id=$6 RETURNING *',[title,description,monthly_rent,deposit,extra_fees,req.params.id]);
    if(amenities){await query('DELETE FROM listing_amenities WHERE listing_id=$1',[req.params.id]);if(amenities.length){const v=amenities.map((_,i)=>`($1,$${i+2})`).join(',');await query(`INSERT INTO listing_amenities(listing_id,amenity) VALUES ${v}`,[req.params.id,...amenities]);}}
    res.json({message:'Updated',listing:updated});
  }catch(err){next(err);}
}
async function deleteListing(req,res,next){
  try{
    const{rows}=await query('SELECT landlord_id FROM listings WHERE id=$1',[req.params.id]);
    if(!rows.length) return res.status(404).json({error:'Not found'});
    if(req.user.role!=='admin'&&rows[0].landlord_id!==req.user.id) return res.status(403).json({error:'Not your listing'});
    await query('DELETE FROM listings WHERE id=$1',[req.params.id]);
    res.json({message:'Deleted'});
  }catch(err){next(err);}
}
async function getMyListings(req,res,next){
  try{
    const{rows}=await query(`SELECT l.*,COALESCE(json_agg(DISTINCT la.amenity) FILTER(WHERE la.id IS NOT NULL),'[]') AS amenities,
      (SELECT COUNT(*) FROM bookings WHERE listing_id=l.id) as booking_count
      FROM listings l LEFT JOIN listing_amenities la ON la.listing_id=l.id WHERE l.landlord_id=$1 GROUP BY l.id ORDER BY l.created_at DESC`,[req.user.id]);
    res.json({listings:rows});
  }catch(err){next(err);}
}
async function toggleFavourite(req,res,next){
  try{
    const{rows:ex}=await query('SELECT id FROM favourites WHERE user_id=$1 AND listing_id=$2',[req.user.id,req.params.id]);
    if(ex.length){await query('DELETE FROM favourites WHERE user_id=$1 AND listing_id=$2',[req.user.id,req.params.id]);return res.json({saved:false,message:'Removed from favourites'});}
    await query('INSERT INTO favourites(user_id,listing_id) VALUES($1,$2)',[req.user.id,req.params.id]);
    res.json({saved:true,message:'Saved to favourites'});
  }catch(err){next(err);}
}
async function getFavourites(req,res,next){
  try{
    const{rows}=await query(`SELECT l.*,COALESCE(json_agg(DISTINCT la.amenity) FILTER(WHERE la.id IS NOT NULL),'[]') AS amenities,
      (SELECT url FROM listing_images WHERE listing_id=l.id LIMIT 1) as primary_image
      FROM favourites f JOIN listings l ON l.id=f.listing_id LEFT JOIN listing_amenities la ON la.listing_id=l.id
      WHERE f.user_id=$1 GROUP BY l.id,f.created_at ORDER BY f.created_at DESC`,[req.user.id]);
    res.json({listings:rows});
  }catch(err){next(err);}
}
module.exports={getListings,getListingById,createListing,updateListing,deleteListing,getMyListings,toggleFavourite,getFavourites};
