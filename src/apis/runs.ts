import server from "./instance";

async function postRun(data: Running, memberId: number) {
    try {
        const response = await server.post(`runs/${memberId}`, data);
        return response.data;
    } catch (error) {
        console.error(error);
        throw error;
    }
}
