import axios from "axios";

// 오류 뜨면 console.log 하도록 수정
const server = axios.create({
    baseURL: process.env.EXPO_PUBLIC_API_URL + "/v1/",
    headers: {
        "Content-Type": "application/json",
    },
});

export default server;
