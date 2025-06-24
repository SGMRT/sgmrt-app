import { ChevronIcon, EditIcon, ShareIcon } from "@/assets/svgs/svgs";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import TextWithUnit from "@/src/components/ui/TextWithUnit";
import { Typography, typographyStyles } from "@/src/components/ui/Typography";
import { useLocalSearchParams } from "expo-router";
import { useRef, useState } from "react";
import { ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Result() {
    const { recordId } = useLocalSearchParams();
    const date = new Date().toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
    const [isEditing, setIsEditing] = useState(false);
    const titleInputRef = useRef<TextInput>(null);

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText={date} />
            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.titleContainer}>
                    <View style={styles.titleLeft}>
                        <TextInput
                            editable={isEditing}
                            placeholder="월요일 아침 러닝"
                            style={styles.titleInput}
                            ref={titleInputRef}
                            onBlur={() => {
                                setIsEditing(false);
                                console.log("blur");
                            }}
                        />
                        <EditIcon
                            onPress={() => {
                                setIsEditing(true);
                                titleInputRef.current?.focus();
                            }}
                        />
                    </View>
                    <ShareIcon />
                </View>
                <View style={styles.mapContainer}>
                    <MapViewWrapper
                        controlEnabled={false}
                        showPuck={false}
                        center={[126.85, 37.48]}
                    />
                </View>
                <View
                    style={{
                        paddingHorizontal: 17,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            paddingVertical: 20,
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <TextWithUnit
                            value="1.45"
                            unit="km"
                            align="flex-start"
                            description="전체 거리"
                        />
                        <Divider />
                        <TextWithUnit
                            value="25:45"
                            unit=""
                            align="flex-start"
                            description="시간"
                        />
                        <Divider />
                        <TextWithUnit
                            value="150"
                            unit="spm"
                            align="flex-start"
                            description="케이던스"
                        />
                        <Divider />
                        <TextWithUnit
                            value="90"
                            unit="kcal"
                            align="flex-start"
                            description="칼로리"
                        />
                    </View>
                    <View
                        style={{
                            height: 1,
                            width: "100%",
                            backgroundColor: "#3f3f3f",
                        }}
                    />
                    <View style={{ paddingVertical: 15, gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="body1" color="gray60">
                                페이스
                            </Typography>
                            <ChevronIcon
                                style={{ transform: [{ rotate: "-90deg" }] }}
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                gap: 20,
                                alignItems: "center",
                            }}
                        >
                            <TextWithUnit
                                value="8'23''"
                                unit=""
                                align="flex-start"
                                description="평균"
                            />
                            <Divider />
                            <TextWithUnit
                                value="10'23''"
                                unit=""
                                align="flex-start"
                                description="최고"
                            />
                        </View>
                    </View>
                    <View
                        style={{
                            height: 1,
                            width: "100%",
                            backgroundColor: "#3f3f3f",
                        }}
                    />
                    <View style={{ paddingVertical: 15, gap: 10 }}>
                        <View
                            style={{
                                flexDirection: "row",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <Typography variant="body1" color="gray60">
                                고도
                            </Typography>
                            <ChevronIcon
                                style={{ transform: [{ rotate: "-90deg" }] }}
                            />
                        </View>
                        <View
                            style={{
                                flexDirection: "row",
                                gap: 20,
                                alignItems: "center",
                            }}
                        >
                            <TextWithUnit
                                value="17'"
                                unit="m"
                                align="flex-start"
                                description="평균"
                            />
                            <Divider />
                            <TextWithUnit
                                value="+18"
                                unit="m"
                                align="flex-start"
                                description="상승"
                            />
                            <Divider />
                            <TextWithUnit
                                value="-13"
                                unit="m"
                                align="flex-start"
                                description="하강"
                            />
                        </View>
                    </View>
                </View>
            </ScrollView>
            <SlideToDualAction
                onSlideLeft={() => {}}
                onSlideRight={() => {}}
                leftLabel="메인으로"
                rightLabel="코스 등록"
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        height: 50,
    },
    content: {
        backgroundColor: "#171717",
    },
    titleContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 17,
        paddingVertical: 20,
    },
    titleLeft: {
        flexDirection: "row",
        gap: 4,
    },
    titleInput: {
        ...typographyStyles.subhead1,
        color: "#fff",
        lineHeight: undefined,
    },
    mapContainer: {
        height: 356,
    },
});
