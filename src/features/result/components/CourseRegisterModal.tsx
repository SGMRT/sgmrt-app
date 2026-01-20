import { patchCourseName } from "@/src/apis";
import BottomModal from "@/src/components/ui/BottomModal";
import { Button } from "@/src/components/ui/Button";
import NameInput from "@/src/components/ui/NameInput";
import { showToast } from "@/src/components/ui/toastConfig";
import { Typography } from "@/src/components/ui/Typography";
import { trackAmplitude } from "@/src/utils/trackAmplitude";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { RefObject, useState } from "react";
import { StyleSheet, View } from "react-native";

interface Props {
    bottomSheetRef: RefObject<BottomSheetModal | null>;
    courseInfoId: number;
    distance: number;
    elevationGain: number;
    courseId: string;
    bottom: number;
}

export default function CourseRegisterModal({
    bottomSheetRef,
    courseInfoId,
    distance,
    elevationGain,
    courseId,
    bottom,
}: Props) {
    const [courseName, setCourseName] = useState("");
    const router = useRouter();
    const queryClient = useQueryClient();

    const handleRegister = () => {
        patchCourseName(courseInfoId, courseName, true)
            .then(() => {
                bottomSheetRef.current?.dismiss();
                router.replace({
                    pathname: "/(tabs)/profile",
                    params: { tab: "course" },
                });
                trackAmplitude("Course Created", {
                    courseId: courseInfoId,
                    courseName: courseName,
                    distance: distance,
                    elevationGain: elevationGain,
                });
                showToast("success", "코스가 등록되었습니다", bottom);
            })
            .finally(() => {
                queryClient.invalidateQueries({ queryKey: ["courses"] });
                queryClient.invalidateQueries({
                    queryKey: ["course", courseId],
                });
                queryClient.invalidateQueries({ queryKey: ["user-courses"] });
            });
    };

    return (
        <BottomModal
            bottomSheetRef={bottomSheetRef}
            canClose={true}
            handleStyle={styles.handle}
        >
            <View style={styles.content}>
                <NameInput
                    placeholder="코스명을 입력해주세요"
                    onChangeText={setCourseName}
                    bottomSheet
                />
                <Typography variant="body3" color="gray40">
                    코스를 한 번 등록하면 삭제 및 수정이 어렵습니다
                </Typography>
            </View>
            <Button title="코스 등록" onPress={handleRegister} type="active" />
        </BottomModal>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingTop: 30,
        paddingBottom: 50,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        backgroundColor: "#111111",
    },
    handle: {
        paddingTop: 10,
        paddingBottom: 0,
    },
});
