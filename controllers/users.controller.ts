import type { Request, Response } from "express";
import db from "../lib/db"
import { StatusCodes } from 'http-status-codes';
import { z } from "zod";
import { RegisterSchema } from "../schemas/register.schema";
import bcrypt from 'bcryptjs';

export const createUser = async (req: Request, res: Response) => {
    try {
        const result = await RegisterSchema.safeParseAsync(req.body);
        if (!result.success) {
            return res.status(StatusCodes.UNAUTHORIZED).json({errors: z.treeifyError(result.error)});
        }
        console.log(result.data);
        const { email, name, password, confirmPassword } = result.data;

        const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt());

        console.log(hashedPassword);
        
        const user = await db.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
            }
        })

        res.json({msg: 'Register behasil'});
    } catch (error) {
        console.error('Login error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Login failed'
        });
    }
}

