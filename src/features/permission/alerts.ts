import { Alert, Linking, Platform } from "react-native";

export function showMissingPermissionAlert(title: string, missing: string[]) {
    const message = `${missing.join(
        ", "
    )} 권한이 허용되지 않았습니다. \n\n설정에서 권한을 허용해주세요.`;

    Alert.alert(title, message, [
        { text: "취소", style: "cancel" },
        { text: "설정으로 이동", onPress: () => Linking.openSettings() },
    ]);
}

export const Labels = {
    locationFg: "위치",
    activity: "활동",
    barometer: "기압",
    healthkit: "건강",
    att: Platform.select({ ios: "광고 추적 허용", android: "광고 추적 허용" }),
    watch: "워치",
};
