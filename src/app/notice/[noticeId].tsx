import { getNotice } from "@/src/apis";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import { Typography } from "@/src/components/ui/Typography";
import { formatDate } from "@/src/utils/formatDate";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoticeDetailPage() {
    const { noticeId } = useLocalSearchParams();
    const { data } = useQuery({
        queryKey: ["notice", noticeId],
        queryFn: () => getNotice(Number(noticeId)),
        enabled: !!noticeId,
    });

    const formattedDate = useMemo(() => {
        return formatDate(new Date(data?.startAt ?? 0));
    }, [data]);

    return (
        <SafeAreaView style={styles.container}>
            <Header titleText={formattedDate} hasBackButton={true} />
            <ScrollView
                contentContainerStyle={{
                    gap: 20,
                    marginTop: 20,
                    marginHorizontal: 16,
                    flex: 1,
                }}
            >
                <View style={{ gap: 10 }}>
                    <Typography variant="headline" color="white">
                        {data?.title}
                    </Typography>
                    <Divider direction="horizontal" />
                </View>
                <Typography variant="body1" color="gray40">
                    {data?.content}
                </Typography>
                {data?.imageUrl && (
                    <Image
                        source={{ uri: data?.imageUrl }}
                        style={{
                            borderRadius: 20,
                            width: "100%",
                            resizeMode: "cover",
                            flex: 1,
                        }}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        paddingBottom: 50,
    },
});
