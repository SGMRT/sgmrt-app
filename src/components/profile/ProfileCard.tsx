import { GetUserInfoResponse } from "@/src/apis/types/user";
import { Divider, Typography } from "@/src/components/ui";
import { Avatar } from "@/src/design-system/atoms/Avatar";
import { spacing } from "@/src/design-system/tokens/spacing";
import { StyleSheet, View } from "react-native";

interface ProfileCardProps {
    userInfo: GetUserInfoResponse | null;
    loading?: boolean;
}

export const ProfileCard = ({ userInfo, loading }: ProfileCardProps) => {
    const userProfileImageUrl =
        userInfo?.profilePictureUrl?.split("?X-Amz-")[0];

    return (
        <View style={styles.profileContent}>
            {/* 회원 정보 등록 화면과 같은 Avatar 를 쓴다.
                예전에는 사진이 없을 때 PNG 한 장을 얹어 색을 바꿀 수 없었다. */}
            <Avatar
                source={
                    userProfileImageUrl ? { uri: userProfileImageUrl } : null
                }
                diameter={60}
            />
            <View>
                <Typography variant="headline" color="gray20">
                    {loading ? "" : userInfo?.nickname ?? "고스트러너"}
                </Typography>
                <View style={styles.profileInfo}>
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.height
                            ? `${userInfo.height}cm`
                            : "키 비공개"}
                    </Typography>

                    <Divider />
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.weight
                            ? `${userInfo.weight}kg`
                            : "몸무게 비공개"}
                    </Typography>

                    <Divider />
                    <Typography variant="body2" color="gray40">
                        {loading
                            ? ""
                            : userInfo?.gender === "MALE"
                            ? "남성"
                            : userInfo?.gender === "FEMALE"
                            ? "여성"
                            : "성별 비공개"}
                    </Typography>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    profileContent: {
        flexDirection: "row",
        gap: spacing[16],
        alignItems: "center",
    },
    profileInfo: {
        flexDirection: "row",
        gap: spacing[12],
        alignItems: "center",
    },
});
