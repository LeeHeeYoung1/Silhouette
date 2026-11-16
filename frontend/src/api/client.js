import axios from "axios"

const Client = axios.create({
    baseURL: "http://localhost"
});

Client.interceptors.request.use((config)=>{
    const token = sessionStorage.getItem("token");
    if(token) config.headers.Authorization = `Bearer ${token}`
    return config;
})

export default Client;