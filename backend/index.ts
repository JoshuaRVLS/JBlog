import 'dotenv/config';

import express from 'express';
import cors from 'cors';
import UsersRouter from './routes/users.route';
import db from './lib/db';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';


const app = express();

app.use(morgan('dev'));
app.use(cors({
    credentials: true,
    allowedHeaders: ['*'],
    origin: ['*'],
    methods: ['*']
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use('/api/users/', UsersRouter);

db.$connect().then(() => console.log('Database connected'));
app.listen(8000, () => console.log('Server is running'));



