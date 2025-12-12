# Job Matching Platform - Backend API

Express + TypeScript + Prisma backend for the job matching platform.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Setup Environment

Create `.env` file in the `backend` folder:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/jobmatching"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 4. Run Development Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP
- `GET /api/auth/me` - Get current user (Protected)

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:id` - Get category details

### Jobs
- `GET /api/jobs` - List all jobs (Public)
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create job (Shop Owner only)
- `GET /api/jobs/my/posts` - Get my job posts (Shop Owner)
- `PATCH /api/jobs/:id/status` - Update job status (Shop Owner)

### Applications
- `POST /api/applications` - Apply to job (Job Seeker)
- `GET /api/applications/my` - Get my applications (Job Seeker)
- `GET /api/applications/job/:jobId` - Get job applications (Shop Owner)
- `PATCH /api/applications/:id/status` - Update application status (Shop Owner)
- `DELETE /api/applications/:id` - Withdraw application (Job Seeker)

### Matches
- `GET /api/matches/my` - Get my matches (Job Seeker)

### Shops
- `GET /api/shops` - List all shops
- `GET /api/shops/:id` - Get shop details
- `GET /api/shops/my/profile` - Get my shop (Shop Owner)
- `POST /api/shops` - Create shop (Shop Owner)
- `PATCH /api/shops/my/profile` - Update shop (Shop Owner)

### Job Seekers
- `GET /api/job-seekers/my/profile` - Get my profile (Job Seeker)
- `POST /api/job-seekers` - Create profile (Job Seeker)
- `PATCH /api/job-seekers/my/profile` - Update profile (Job Seeker)

### Users
- `GET /api/users/:id` - Get user info
- `GET /api/users/me/full` - Get full profile (Protected)

## 🔐 Authentication

Use JWT Bearer token in Authorization header:

```
Authorization: Bearer <your-token>
```

## 🛠️ Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:push` - Push schema to database
- `npm run prisma:studio` - Open Prisma Studio

## 📦 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT + bcrypt

## 🚢 Deployment

### Railway (Recommended)

1. Push code to GitHub
2. Connect Railway to your repo
3. Add PostgreSQL database addon
4. Set environment variables
5. Deploy!

### Environment Variables for Production

```
DATABASE_URL=<your-production-database-url>
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=production
FRONTEND_URL=<your-frontend-url>
```

## 📄 License

MIT
