import { setTelemetryEnabled } from "@rnmapbox/maps";
import { StyleSheet, View } from "react-native";

import BottomCourseInfoModal from "@/src/components/map/courseInfo/BottomCourseInfoModal";
import HomeMap from "@/src/components/map/HomeMap";
import SlideToAction from "@/src/components/map/SlideToAction";
import TopWeatherInfo from "@/src/components/map/TopWeatherInfo";
import TabBar from "@/src/components/ui/TabBar";
import { Course } from "@/src/types/course";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";

export default function Home() {
    const [courses, setCourses] = useState<Course[]>([]);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const handlePresentModalPress = () => {
        bottomSheetRef.current?.present();
    };
    const router = useRouter();

    const makeCircularCourse = (
        lon: number,
        lat: number,
        length: number
    ): [number, number][] => {
        return Array.from({ length }, (_, i) => {
            const pi = (2 * Math.PI * i) / length;
            const radius = 0.001;
            const newLon = lon + radius * Math.cos(pi);
            const newLat = lat + radius * Math.sin(pi);
            return [newLon, newLat] as [number, number];
        });
    };

    useEffect(() => {
        for (let i = 0; i < 3; i++) {
            setCourses((prev) => [
                ...prev,
                {
                    id: i,
                    name: `course${i}`,
                    count: 49,
                    topUsers: [
                        {
                            userId: 1,
                            username: "user1",
                            profileImage: "https://via.placeholder.com/150",
                        },
                        {
                            userId: 2,
                            username: "user2",
                            profileImage: "https://via.placeholder.com/150",
                        },
                    ],
                    coordinates: makeCircularCourse(
                        126.9503078182 + Math.random() * 0.005 * i,
                        37.5439468182 + Math.random() * 0.005 * i,
                        90
                    ),
                },
            ]);
        }

        console.log(courses);
    }, []);

    useEffect(() => {
        setTelemetryEnabled(false);
    }, []);

    return (
        <View style={styles.container}>
            <TopWeatherInfo />
            <HomeMap
                courses={courses}
                handlePresentModalPress={handlePresentModalPress}
            />
            <BottomCourseInfoModal bottomSheetRef={bottomSheetRef} />
            <TabBar />
            <SlideToAction
                label="밀어서 러닝시작"
                onSlideSuccess={() => {
                    router.push("/run");
                }}
                color="green"
                direction="left"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
});
