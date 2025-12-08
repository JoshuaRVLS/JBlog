import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import AxiosInstance from "./utils/api";

const protectedRoutes = ['/'];
const publicRoutes = ['/login']

export default async function middleware(req: NextRequest) {
    const path = req.nextUrl.pathname;
    const isProctectedRoutes = protectedRoutes.includes(path);
    const isPublicRoutes = publicRoutes.includes(path);

    const accessToken = (await cookies()).get('accessToken');

    try {
        const response = await AxiosInstance.post('http://localhost:8000/api/auth/')
    } catch (
        
    ) {
        
    }

}