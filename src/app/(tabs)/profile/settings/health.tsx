import { Header, StyledSwitch } from "@/src/components/ui";
import {
    ListSectionContainer,
    ListSectionItem,
} from "@/src/components/ui";
import { useAppPermissions } from "@/src/features/permission/useAppPermissions";
import {
    AuthorizationStatus,
    authorizationStatusFor,
    ObjectTypeIdentifier,
} from "@kingstinct/react-native-healthkit";
import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
    Alert,
    AppState,
    Linking,
    SafeAreaView,
    StyleSheet,
    View,
} from "react-native";

const HK: Record<string, ObjectTypeIdentifier> = {
    writeWorkout: "HKWorkoutTypeIdentifier",
    writeWR: "HKQuantityTypeIdentifierDistanceWalkingRunning",
    writeRoute: "HKWorkoutRouteTypeIdentifier",
    writeEnergy: "HKQuantityTypeIdentifierActiveEnergyBurned",
    readHeartRate: "HKQuantityTypeIdentifierHeartRate",
    readWorkout: "HKWorkoutTypeIdentifier",
} as const;

export default function Health() {
    const { requestOptional } = useAppPermissions();
    const [healthKitAuth, setHealthKitAuth] = useState<{
        writeWRAuth: AuthorizationStatus;
        writeWorkoutAuth: AuthorizationStatus;
        writeRouteAuth: AuthorizationStatus;
        writeEnergyAuth: AuthorizationStatus;
        readHeartRateAuth: AuthorizationStatus;
        readWorkoutAuth: AuthorizationStatus;
    }>({
        writeWRAuth: AuthorizationStatus.notDetermined,
        writeWorkoutAuth: AuthorizationStatus.notDetermined,
        writeRouteAuth: AuthorizationStatus.notDetermined,
        writeEnergyAuth: AuthorizationStatus.notDetermined,
        readHeartRateAuth: AuthorizationStatus.notDetermined,
        readWorkoutAuth: AuthorizationStatus.notDetermined,
    });

    const updateHealthKitAuth = useCallback(async () => {
        const writeWRAuth = authorizationStatusFor(HK.writeWR);
        const writeWorkoutAuth = authorizationStatusFor(HK.writeWorkout);
        const writeRouteAuth = authorizationStatusFor(HK.writeRoute);
        const writeEnergyAuth = authorizationStatusFor(HK.writeEnergy);
        const readHeartRateAuth = authorizationStatusFor(HK.readHeartRate);
        const readWorkoutAuth = authorizationStatusFor(HK.readWorkout);

        setHealthKitAuth({
            writeWRAuth,
            writeWorkoutAuth,
            writeRouteAuth,
            writeEnergyAuth,
            readHeartRateAuth,
            readWorkoutAuth,
        });
    }, []);

    const handleHealthKitChange = () => {
        Alert.alert(
            "애플 건강 연동",
            "앱 > 건강 > 데이터 접근 및 기기에서 고스트러너의 건강 권한을 허용해주세요.",
            [
                { text: "취소", style: "destructive" },
                { text: "설정 열기", onPress: () => Linking.openSettings() },
            ]
        );
    };

    useEffect(() => {
        requestOptional("HEALTHKIT");
    }, []);

    useEffect(() => {
        const sub = AppState.addEventListener("change", async (next) => {
            if (next === "active") {
                updateHealthKitAuth();
            }
        });
        return () => sub.remove();
    }, [updateHealthKitAuth]);

    useFocusEffect(
        useCallback(() => {
            updateHealthKitAuth();
        }, [updateHealthKitAuth])
    );

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText="애플 건강 연동" />
            <View style={styles.content}>
                <ListSectionContainer>
                    <ListSectionItem
                        title="쓰기: 걷기 + 달리기"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    healthKitAuth.writeWRAuth ===
                                    AuthorizationStatus.sharingAuthorized
                                }
                                onValueChange={handleHealthKitChange}
                            />
                        }
                    />
                    <ListSectionItem
                        title="쓰기: 운동"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    healthKitAuth.writeWorkoutAuth ===
                                    AuthorizationStatus.sharingAuthorized
                                }
                                onValueChange={handleHealthKitChange}
                            />
                        }
                    />
                    <ListSectionItem
                        title="쓰기: 운동 경로"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    healthKitAuth.writeRouteAuth ===
                                    AuthorizationStatus.sharingAuthorized
                                }
                                onValueChange={handleHealthKitChange}
                            />
                        }
                    />
                    <ListSectionItem
                        title="쓰기: 활동 에너지"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    healthKitAuth.writeEnergyAuth ===
                                    AuthorizationStatus.sharingAuthorized
                                }
                                onValueChange={handleHealthKitChange}
                            />
                        }
                    />

                    {/* TODO: 심박수 권한 추가 */}
                    {/* <ListSectionItem
                        title="읽기: 심박수"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    healthKitAuth.readHeartRateAuth ===
                                    AuthorizationStatus.sharingAuthorized
                                }
                                onValueChange={handleHealthKitChange}
                            />
                        }
                    /> */}

                    {/* <ListSectionItem
                        title="읽기: 운동"
                        rightElement={
                            <StyledSwitch
                                isSelected={
                                    healthKitAuth.readWorkoutAuth ===
                                    AuthorizationStatus.sharingAuthorized
                                }
                                onValueChange={handleHealthKitChange}
                            />
                        }
                    /> */}
                </ListSectionContainer>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    content: {
        marginTop: 20,
        paddingHorizontal: 16.5,
    },
});
