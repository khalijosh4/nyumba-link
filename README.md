# 🏠 NyumbaLink – Thika Road House Hunting Platform

Full-stack property platform for the Thika Road corridor in Kenya.

## Stack
- Frontend: React 18 + Vite + TailwindCSS
- Backend:  Node.js + Express.js + PostgreSQL
- Auth:     JWT + bcrypt
- Payments: Safaricom M-Pesa Daraja API (STK Push)
- Email:    MailerSend
- Images:   Cloudinary
- Maps:     Google Maps API
- Cron:     node-cron (listing expiry)

## Quick Start

### 1. Install
```bash
cd backend  && npm install
cd ../frontend && npm install
```

### 2. Configure
```bash
cp backend/.env.example  backend/.env    # fill in your keys
cp frontend/.env.example frontend/.env   # fill in your keys
```

### 3. Database
```bash
cd backend
npm run db:migrate   # creates tables
npm run db:seed      # adds 12 demo listings + test users
```

### 4. Run
```bash
# Terminal 1 – API (port 5000)npm ind
cd backend && npm run dev

# Terminal 2 – Frontend (port 5173)
cd frontend && npm run dev
```

## Demo Login (after seeding) – password: Password123!
| Role     | Email                     |
|----------|---------------------------|
| Admin    | admin@nyumbalink.co.ke    |
| Landlord | james.mwangi@demo.com     |
| Tenant   | jane.kamau@demo.com       |

## M-Pesa Test
- Phone: 254708374149  PIN: 1234  (sandbox only)
- Set MPESA_ENV=sandbox in backend/.env

## Areas Covered (25+)
Roysambu, Zimmerman, Car Wash, Drive In, Safari Park, Kahawa Sukari,
Kahawa Wendani, Kamakis, Bypass, Ruiru, Kimbo, Toll, Juja, JKUAT,
Highpoint, Gwa Kairo, K-Road, K.U, Jomoko, Tora, Kibute,
Witeitie, Ngoingwa, Kiganjo, Thika
