'use client';

import AxiosInstance from "@/utils/api";
import axios from "axios";
import React, { FormEvent, useState } from "react";
import { FieldValues, useForm } from 'react-hook-form';

export default function Page() {
    const { register, handleSubmit } = useForm();
    const [data, setData] = useState('');

    const login = async (data: FieldValues) => {
        const { email, password } = data;
        console.log(email, password);
        try {
            const response = await AxiosInstance.post('http://localhost:8000/api/users/login', {
                email,
                password
            })
            alert(response.data);
        } catch (error) {
            if (axios.isAxiosError(error)) {
                alert(JSON.stringify(error.response?.data));
            }
        }
    }

    return (
        <div>   
            <h1>Login Page</h1>
            <form className="flex flex-col justify-center items-center h-full" onSubmit={handleSubmit(login)}>
                <input type="email"  {...register('email')} placeholder="Email" required />
                <input type="password" {...register('password')} placeholder="Password" required />
                <button type="submit" className="cursor-pointer">
                    Login
                </button>
            </form>
        </div>
    );
}