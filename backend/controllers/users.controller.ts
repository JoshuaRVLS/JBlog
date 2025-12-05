import type { Request, Response } from "express";
import db from "../lib/db";

export const createUser = async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body;
        console.log(email, name);
        const user = await db.user.create({
            data: {
                email: 'kontol@gmail.com',
                name: 'KONTOLMEMEK',
            }
        })
        res.json(user);
    } catch (error) {
        console.log(error);
    }
}