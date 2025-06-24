import { EditIcon, ShareIcon } from "@/assets/svgs/svgs";
import MapViewWrapper from "@/src/components/map/MapViewWrapper";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import SlideToDualAction from "@/src/components/ui/SlideToDualAction";
import TextWithUnit from "@/src/components/ui/TextWithUnit";
import { typographyStyles } from "@/src/components/ui/Typography";
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
                    <MapViewWrapper controlEnabled={false} showPuck={false} />
                </View>
                <View>
                    <View>
                        <TextWithUnit
                            value="1.45"
                            unit="km"
                            align="flex-start"
                            description="전체 거리"
                        />
                    </View>
                    <Divider />
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
        flex: 1,
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
