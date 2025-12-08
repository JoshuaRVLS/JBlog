import axios from "axios";

const AxiosInstance = axios.create({
    baseURL: process.env.BASE_URL,
    withCredentials: true
})

export default AxiosInstance;
