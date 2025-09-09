import { CourseResponse } from "@/src/apis/types/course";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native";
import ExpendHeader from "../../ui/ExpendHeader";
import SlideToAction from "../../ui/SlideToAction";
import CoursesInfoList from "./CoursesInfoList";

interface BottomMyCourseModalProps {
    bottomSheetRef: React.RefObject<BottomSheetModal | null>;
    courses: CourseResponse[];
    onClickCourse: (course: CourseResponse) => void;
}

export default function BottomMyCourseModal({
    bottomSheetRef,
    courses,
    onClickCourse,
}: BottomMyCourseModalProps) {
    const [selectedCourse, setSelectedCourse] = useState<CourseResponse | null>(
        null
    );
    const router = useRouter();

    useEffect(() => {
        bottomSheetRef.current?.present();
    }, [bottomSheetRef]);

    useEffect(() => {
        if (courses && courses.length > 0) {
            setSelectedCourse(courses[0]);
        }
    }, [courses]);

    return (
        <>
            <ExpendHeader
                title={"최신 공개 코스"}
                titleColor="gray40"
                marginHorizontal={true}
                onPress={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push("/course");
                }}
            />
            <ScrollView>
                <CoursesInfoList
                    courses={courses}
                    selectedCourse={selectedCourse}
                    setSelectedCourse={setSelectedCourse}
                    onClickCourse={onClickCourse}
                />
            </ScrollView>

            <SlideToAction
                label={"이 코스로 러닝 시작"}
                onSlideSuccess={() => {
                    bottomSheetRef.current?.dismiss();
                    router.push(`/run/${selectedCourse?.id}/-1`);
                }}
                color="green"
                direction="left"
            />
        </>
    );
}
