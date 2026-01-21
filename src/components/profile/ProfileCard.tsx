import { DefaultProfileIcon } from "@/assets/icons/icons";
import { GetUserInfoResponse } from "@/src/apis/types/user";
import { Image, StyleSheet, View } from "react-native";
import { Divider, Typography } from "@/src/components/ui";

interface ProfileCardProps {
    userInfo: GetUserInfoResponse | null;
    loading?: boolean;
}

export const ProfileCard = ({ userInfo, loading }: ProfileCardProps) => {
    const userProfileImageUrl =
        userInfo?.profilePictureUrl?.split("?X-Amz-")[0];

    return (
        <View style={styles.profileContent}>
            <Image
                source={
                    userProfileImageUrl
                        ? { uri: userProfileImageUrl }
                        : DefaultProfileIcon
                }
                style={styles.profileImage}
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
        gap: 15,
        alignItems: "center",
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 100,
    },
    profileInfo: {
        flexDirection: "row",
        gap: 10,
        alignItems: "center",
    },
});
