require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { testConnection } = require('./config/database');
const { startCronJobs } = require('./utils/cronJobs');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:5180', 'http://localhost:3000'],
  credentials: true, methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use('/api/', rateLimit({ windowMs:parseInt(process.env.RATE_LIMIT_WINDOW_MS)||900000, max:parseInt(process.env.RATE_LIMIT_MAX)||100, standardHeaders:true, legacyHeaders:false }));
app.use('/api/auth/', rateLimit({ windowMs:900000, max:10, message:{error:'Too many auth attempts. Wait 15 min.'} }));
app.use('/api/payments/', rateLimit({ windowMs:300000, max:5, message:{error:'Too many payment requests.'} }));
app.use(express.json({ limit:'10mb' }));
app.use(express.urlencoded({ extended:true, limit:'10mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req,res) => res.json({ status:'OK', app:'NyumbaLink API', version:'1.0.0', env:process.env.NODE_ENV }));

app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/listings', require('./routes/listing.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/payments', require('./routes/payment.routes'));
app.use('/api/users',    require('./routes/user.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));
app.use('/api/upload',   require('./routes/upload.routes'));

app.use((req,res) => res.status(404).json({ error:`Route ${req.method} ${req.path} not found` }));
app.use((err,req,res,next) => {
  console.error('Error:', err.message);
  if (err.code==='23505') return res.status(409).json({ error:'Resource already exists' });
  if (err.code==='23503') return res.status(400).json({ error:'Referenced resource not found' });
  res.status(err.status||500).json({ error: process.env.NODE_ENV==='production' ? 'Internal server error' : err.message });
});

async function start() {
  try {
    await testConnection(); console.log('✅ Database connected');
    startCronJobs();        console.log('✅ Cron jobs started');
    app.listen(PORT, () => console.log(`\n🏠 NyumbaLink API → http://localhost:${PORT}\n`));
  } catch(err) { console.error('❌ Startup failed:', err); process.exit(1); }
}
start();
module.exports = app;
