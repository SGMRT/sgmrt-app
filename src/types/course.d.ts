export interface Course {
    id: number;
    name: string;
    count: number;
    topUsers: { userId: number; username: string; profileImage: string }[];
    coordinates: [number, number][];
}
