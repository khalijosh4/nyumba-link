require('dotenv').config({ path: require('path').join(__dirname,'../../.env') });
const bcrypt = require('bcryptjs');
const { pool } = require('./database');
async function seed(){
  const c=await pool.connect(); console.log('\n🌱 Seeding...\n');
  try {
    await c.query('BEGIN');
    const h=await bcrypt.hash('Password123!',12);
    const users=[
      ['Admin','NyumbaLink','admin@nyumbalink.co.ke','254700000001','admin',true],
      ['James','Mwangi','james.mwangi@demo.com','254712345678','landlord',true],
      ['Mary','Wanjiku','mary.wanjiku@demo.com','254723456789','landlord',true],
      ['Peter','Otieno','peter.otieno@demo.com','254734567890','caretaker',true],
      ['Jane','Kamau','jane.kamau@demo.com','254745678901','tenant',true],
      ['Kevin','Njoroge','kevin.njoroge@demo.com','254756789012','tenant',true],
    ];
    const ids={};
    for(const [fn,ln,email,phone,role,verified] of users){
      const {rows}=await c.query(
        `INSERT INTO users(first_name,last_name,email,phone,password_hash,role,is_verified,access_paid,access_expires_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(email) DO UPDATE SET first_name=EXCLUDED.first_name RETURNING id,role,email`,
        [fn,ln,email,phone,h,role,verified,role==='tenant',role==='tenant'?new Date(Date.now()+30*864e5):null]);
      ids[email]=rows[0].id; console.log(`  ✓ [${role.padEnd(9)}] ${fn} ${ln}`);
    }
    const listings=[
      {lid:ids['james.mwangi@demo.com'],title:'Modern 1BR – Roysambu Junction',type:'one_bedroom',area:'Roysambu',rent:18000,dep:18000,lm:'50m from Total Petrol Station',desc:'Spacious 1BR on 2nd floor, tiled throughout, fitted kitchen.',am:['Running Water','24hr Electricity','Security Guard','Parking']},
      {lid:ids['mary.wanjiku@demo.com'],title:'Bedsitter – Zimmerman',type:'bedsitter',area:'Zimmerman',rent:6500,dep:6500,lm:'100m from Zimmerman stage',desc:'Clean bedsitter, borehole water, good electricity.',am:['Borehole Water','24hr Electricity']},
      {lid:ids['james.mwangi@demo.com'],title:'Spacious 2BR – Kahawa Sukari (Gated)',type:'two_bedroom',area:'Kahawa Sukari',rent:25000,dep:25000,lm:'Opp. Kahawa Sukari Market',desc:'Gated community, master en-suite, balcony, modern kitchen.',am:['Running Water','Security Guard','Parking','En-suite','Gated Community']},
      {lid:ids['peter.otieno@demo.com'],title:'Single Room – JKUAT Area',type:'single_room',area:'JKUAT',rent:4500,dep:4500,lm:'5 min walk from JKUAT Gate',desc:'Affordable room near JKUAT. Good water and power supply.',am:['Running Water','24hr Electricity']},
      {lid:ids['mary.wanjiku@demo.com'],title:'3BR Townhouse – Ruiru',type:'three_bedroom',area:'Ruiru',rent:38000,dep:45000,lm:'Near Ruiru Hospital',desc:'Standalone townhouse with garden, borehole, double garage.',am:['Borehole','Garden','Parking','Security Guard','Solar']},
      {lid:ids['james.mwangi@demo.com'],title:'Studio – Near KU Gate',type:'studio',area:'K.U (Kenyatta University)',rent:12000,dep:12000,lm:'3 min from KU Main Gate',desc:'Modern studio, internet-ready, secure compound with CCTV.',am:['Wi-Fi Ready','Security Guard','Running Water','CCTV']},
      {lid:ids['mary.wanjiku@demo.com'],title:'1BR – Eastern Bypass',type:'one_bedroom',area:'Bypass',rent:16000,dep:16000,lm:'200m from Bypass Flyover',desc:'Well-maintained 1BR along Bypass. Easy Nairobi access.',am:['Running Water','24hr Electricity','Parking']},
      {lid:ids['peter.otieno@demo.com'],title:'Bedsitter – Juja Town',type:'bedsitter',area:'Juja',rent:7500,dep:7500,lm:'Next to Juja Stage',desc:'Clean bedsitter in Juja town centre, near matatu stage.',am:['Running Water','24hr Electricity']},
      {lid:ids['james.mwangi@demo.com'],title:'2BR – Kahawa Wendani',type:'two_bedroom',area:'Kahawa Wendani',rent:20000,dep:20000,lm:'Near Police Post',desc:'Peaceful 2BR away from road noise, borehole water.',am:['Running Water','Security Guard','Borehole','Parking']},
      {lid:ids['mary.wanjiku@demo.com'],title:'Single Room – Kimbo',type:'single_room',area:'Kimbo',rent:4000,dep:4000,lm:'Near Kimbo Stage',desc:'Budget-friendly single room, tiled, reliable power.',am:['Running Water','24hr Electricity']},
      {lid:ids['james.mwangi@demo.com'],title:'1BR Highpoint – Scenic Views',type:'one_bedroom',area:'Highpoint',rent:22000,dep:22000,lm:'Highpoint Shopping Centre',desc:'Beautiful views from balcony, upmarket quiet estate.',am:['Running Water','Security Guard','Parking','Balcony','CCTV']},
      {lid:ids['peter.otieno@demo.com'],title:'Bedsitter – Kamakis',type:'bedsitter',area:'Kamakis',rent:8500,dep:8500,lm:'Near Kamakis Junction',desc:'Spacious self-contained bedsitter near Bypass interchange.',am:['Running Water','24hr Electricity','Security Guard','Self-Contained']},
    ];
    console.log('\n🏠 Seeding listings...');
    let firstId=null;
    for(const l of listings){
      const {rows}=await c.query(
        `INSERT INTO listings(landlord_id,title,description,room_type,area,landmark,monthly_rent,deposit,status,published_at,expires_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,'active',NOW(),NOW()+INTERVAL '5 days') RETURNING id`,
        [l.lid,l.title,l.desc,l.type,l.area,l.lm,l.rent,l.dep]);
      if(!firstId) firstId=rows[0].id;
      for(const a of l.am) await c.query('INSERT INTO listing_amenities(listing_id,amenity) VALUES($1,$2)',[rows[0].id,a]);
      console.log(`  ✓ [${l.area.padEnd(24)}] ${l.title}`);
    }
    await c.query(`INSERT INTO bookings(listing_id,tenant_id,landlord_id,viewing_date,viewing_time,message,status)
      VALUES($1,$2,$3,CURRENT_DATE+3,'Morning (8am-12pm)','I would like to view this property.','pending') ON CONFLICT DO NOTHING`,
      [firstId,ids['jane.kamau@demo.com'],ids['james.mwangi@demo.com']]);
    await c.query('INSERT INTO notifications(user_id,type,title,message) VALUES($1,$2,$3,$4)',
      [ids['jane.kamau@demo.com'],'welcome','🏠 Welcome to NyumbaLink!','Browse verified listings and find your perfect home on Thika Road.']);
    await c.query('COMMIT');
    console.log('\n✅ Seed complete!\n─────────────────────────────');
    console.log('Password for all demo accounts: Password123!');
    console.log('Admin:    admin@nyumbalink.co.ke');
    console.log('Landlord: james.mwangi@demo.com');
    console.log('Tenant:   jane.kamau@demo.com\n');
  } catch(e){ await c.query('ROLLBACK'); console.error('Seed failed:',e.message); throw e; }
  finally { c.release(); await pool.end(); }
}
seed().catch(()=>process.exit(1));
