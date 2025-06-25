import axios from "axios";

console.log(process.env.EXPO_PUBLIC_API_URL);

const server = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL + "/v1/",
    headers: {
        "Content-Type": "application/json",
    },
});

export default server;
