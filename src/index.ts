import express, { Express, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import categoryRoutes from "./routes/category.routes";
import jobRoutes from "./routes/job.routes";
import applicationRoutes from "./routes/application.routes";
import matchRoutes from "./routes/match.routes";
import shopRoutes from "./routes/shop.routes";
import jobSeekerRoutes from "./routes/job-seeker.routes";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// ===========================
// Middleware
// ===========================
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ===========================
// Health Check
// ===========================
app.get("/", (req: Request, res: Response) => {
    res.json({
        message: "🚀 Job Matching API Server",
        version: "1.0.0",
        status: "running",
    });
});

app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===========================
// API Routes
// ===========================
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/shops", shopRoutes);
app.use("/api/job-seekers", jobSeekerRoutes);

// ===========================
// Error Handler
// ===========================
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error("Error:", err);
    res.status(err.status || 500).json({
        error: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
});

// ===========================
// 404 Handler
// ===========================
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: "Route not found" });
});

// ===========================
// Start Server
// ===========================
app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║  🚀 Server is running!                  ║
  ║  📡 Port: ${PORT}                        ║
  ║  🌍 Environment: ${process.env.NODE_ENV || "development"}         ║
  ║  🔗 URL: http://localhost:${PORT}        ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
