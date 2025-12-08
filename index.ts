import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import UsersRouter from './routes/users.route';
import AuthRouter from './routes/auth.route';
import db from './lib/db';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';


const app = express();

app.use(morgan('dev'));
app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser(process.env.COOKIE_SECRET));

app.use('/api/users/', UsersRouter);
app.use('/api/auth/', AuthRouter);

