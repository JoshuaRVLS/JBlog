import express from 'express';
import cors from 'cors';
import UsersRouter from './routes/users.router';
import db from './lib/db';

const app = express();

app.use(cors({
    credentials: true,
    allowedHeaders: ['*'],
    origin: ['*'],
    methods: ['*']
}))
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use('/api/users/', UsersRouter);

// db.$connect().then(() => console.log('Database connected'));
app.listen(8000, () => console.log('Server is running'));



