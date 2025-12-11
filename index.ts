import "dotenv/config";

import express from "express";
import cors from "cors";
import UsersRoutes from "./routes/users.route";
import AuthRoutes from "./routes/auth.route";
import EmailRoutes from "./routes/email.route";
import db from "./lib/db";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const app = express();

app.set("trust proxy", 1);
app.use(
  cors({
    credentials: true,
    origin: ["http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan("dev"));

app.use("/api/users/", UsersRoutes);
app.use("/api/auth/", AuthRoutes);
app.use("/api/email/", EmailRoutes);

app.listen(8000, async () => {
  console.log("Server online!");
});
