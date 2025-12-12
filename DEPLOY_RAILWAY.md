# 🚂 Deploy Backend ไป Railway

## ขั้นตอนการ Deploy

### 1. เตรียม GitHub Repository

```bash
# ใน backend folder
git init
git add .
git commit -m "Initial backend setup"

# สร้าง repository ใหม่ใน GitHub ชื่อ "job-matching-backend"
git remote add origin https://github.com/YOUR_USERNAME/job-matching-backend.git
git branch -M main
git push -u origin main
```

### 2. Deploy บน Railway

1. **ไปที่** [railway.app](https://railway.app)
2. **Sign in with GitHub**
3. **คลิก "New Project"**
4. **เลือก "Deploy from GitHub repo"**
5. **เลือก repository `job-matching-backend`**

### 3. เพิ่ม PostgreSQL Database

1. ใน Railway Project → คลิก **"+ New"**
2. เลือก **"Database" → "Add PostgreSQL"**
3. Railway จะสร้าง database ให้อัตโนมัติ

### 4. ตั้งค่า Environment Variables

ใน Railway → **"Variables" tab** → เพิ่ม:

```env
# Database (Railway จะสร้างให้อัตโนมัติ)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT
JWT_SECRET=your-super-secret-production-key-change-this
JWT_EXPIRES_IN=7d

# Server
PORT=3001
NODE_ENV=production

# Frontend URL
FRONTEND_URL=https://your-app.netlify.app
```

**⚠️ สำคัญ:**
- `DATABASE_URL` → เลือกจาก **"Reference" dropdown** → `Postgres.DATABASE_URL`
- `JWT_SECRET` → สร้าง random string ที่ปลอดภัย
- `FRONTEND_URL` → ใส่ URL ของ Netlify (จะได้ในขั้นตอนต่อไป)

### 5. Deploy Settings

ใน Railway → **"Settings" tab**:

- **Build Command:** `npm run railway:build`
- **Start Command:** `npm run railway:start`
- **Root Directory:** (เว้นว่างถ้า backend อยู่ที่ root ของ repo)

### 6. Deploy!

Railway จะ build และ deploy อัตโนมัติ:
- ✅ Install dependencies
- ✅ Generate Prisma Client
- ✅ Build TypeScript
- ✅ Push schema to database
- ✅ Start server

### 7. ดู Backend URL

เมื่อ deploy สำเร็จ:
1. ไปที่ **"Settings" → "Domains"**
2. คลิก **"Generate Domain"**
3. จะได้ URL เช่น: `https://job-matching-backend-production.up.railway.app`

**เก็บ URL นี้ไว้** → จะใช้ตั้งค่า Frontend

---

## ✅ ทดสอบ Backend

เปิด browser ไปที่:
```
https://your-backend-url.railway.app/health
```

ควรเห็น:
```json
{
  "status": "ok",
  "timestamp": "2024-..."
}
```

---

## 🔍 Debug

ดู logs ใน Railway:
- **"Deployments" tab** → คลิกที่ deployment ล่าสุด
- **"View Logs"** → ดู error messages

### Common Issues:

**1. Database Connection Error**
```
Error: P1001: Can't reach database
```
**แก้:** ตรวจสอบว่า `DATABASE_URL` ตั้งค่าถูกต้อง

**2. Prisma Schema Error**
```
Error: Schema not found
```
**แก้:** ตรวจสอบว่า `npx prisma generate` รันสำเร็จ

**3. Build Failed**
```
Error: Cannot find module
```
**แก้:** ตรวจสอบ `dependencies` ใน `package.json`

---

## 💡 Tips

- **Free Tier:** Railway ให้ฟรี $5/เดือน (เพียงพอสำหรับ demo)
- **Auto Deploy:** ทุกครั้งที่ push ไป GitHub จะ deploy อัตโนมัติ
- **Database Backups:** ควร export database เป็นประจำ

---

## 🎉 Next Steps

เมื่อ Backend deploy สำเร็จแล้ว:
1. ✅ Copy Backend URL
2. ▶️ Deploy Frontend ไป Netlify (ดู `DEPLOY_FRONTEND.md`)
