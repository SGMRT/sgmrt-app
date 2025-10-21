import { GhostGuide } from "@/src/components/onboarding/GhostGuide";
import { Button } from "@/src/components/ui/Button";
import { Typography } from "@/src/components/ui/Typography";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { View } from "react-native";
import { CreateGhosty } from "./CreateGhosty";

interface BottomGuideProps {
    type: "run" | "ghost" | "ghosty" | "create";
    handleClose: () => void;
    handleRun: () => void;
}

export const BottomGuide = ({
    type,
    handleClose,
    handleRun,
}: BottomGuideProps) => {
    switch (type) {
        case "run":
            return (
                <View style={{ gap: 35 }}>
                    <Typography
                        variant="sectionhead"
                        color="white"
                        style={{ textAlign: "center" }}
                    >
                        내 고스트가 필요한가요?{"\n"}기록을 고스트로 남기고
                        싶다면
                        {"\n"}
                        일시정지 없이 완주해야 해요
                    </Typography>
                    <Button
                        style={{
                            marginHorizontal: 16.5,
                        }}
                        type="active"
                        title="네, 확인했어요"
                        onPress={async () => {
                            await AsyncStorage.setItem(
                                "sgmrt.hasRunCourse.v1",
                                "true"
                            );
                            handleRun();
                        }}
                    />
                </View>
            );
        case "ghost":
            return <GhostGuide show={true} handleClose={handleClose} />;
        case "create":
            return <CreateGhosty />;
        case "ghosty":
            return <View />;
    }
};
