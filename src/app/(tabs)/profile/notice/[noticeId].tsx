import { getNotice, Notice } from "@/src/apis";
import localEvent from "@/src/components/notice/localEvent.json";
import { Divider } from "@/src/components/ui/Divider";
import Header from "@/src/components/ui/Header";
import TabBar from "@/src/components/ui/TabBar";
import { Typography } from "@/src/components/ui/Typography";
import colors from "@/src/theme/colors";
import { formatDate } from "@/src/utils/formatDate";
import { useQuery } from "@tanstack/react-query";
import { Image, ImageLoadEventData } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, View } from "react-native";
import Markdown from "react-native-markdown-display";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NoticeDetailPage() {
    const { noticeId } = useLocalSearchParams();
    const { data } = useQuery({
        queryKey: ["notice", noticeId],
        queryFn: () => {
            if (Number(noticeId) === -1) {
                return localEvent as unknown as Notice;
            }
            return getNotice(Number(noticeId));
        },
        enabled: !!noticeId,
    });
    const router = useRouter();

    const onBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.replace("/(tabs)/home");
        }
    };

    const formattedDate = useMemo(() => {
        return data?.startAt ? formatDate(new Date(data?.startAt)) : "";
    }, [data]);

    const [ratio, setRatio] = useState<number | null>(null);
    const onImageLoad = (e: ImageLoadEventData) => {
        const { width, height } = e.source;
        if (width && height) setRatio(width / height);
    };

    const imageWidth = Dimensions.get("window").width - 32;
    const imageHeight = (1 / (ratio ?? 1)) * imageWidth;

    const parsedContent = useMemo(() => {
        if (!data?.content) return "";
        // 서버에서 이스케이프된 \n → 실제 개행으로 변환
        let content = data.content.replace(/\\n/g, "\n");

        if (content.startsWith('"') && content.endsWith('"')) {
            content = content.slice(1, -1);
        }

        return content;
    }, [data?.content]);

    return (
        <SafeAreaView style={styles.container}>
            <Header
                titleText={formattedDate}
                hasBackButton={true}
                onBack={onBack}
            />
            <ScrollView contentContainerStyle={styles.contentContainer}>
                <View style={styles.titleContainer}>
                    <Typography variant="headline" color="white">
                        {data?.title}
                    </Typography>
                    <Divider direction="horizontal" />
                </View>

                {data?.content && (
                    <View style={{ marginTop: -10 }}>
                        <Markdown
                            style={{
                                body: styles.body,
                                strong: styles.strong,
                            }}
                        >
                            {parsedContent}
                        </Markdown>
                    </View>
                )}

                {data?.imageUrl && (
                    <View
                        style={{
                            width: imageWidth,
                            height: imageHeight,
                            alignItems: "center",
                        }}
                    >
                        <Image
                            source={{ uri: data.imageUrl }}
                            style={[styles.image]}
                            contentFit="contain"
                            onLoad={onImageLoad}
                        />
                    </View>
                )}
            </ScrollView>
            <TabBar />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111111",
        paddingBottom: 60,
    },
    contentContainer: {
        gap: 20,
        marginTop: 20,
        marginHorizontal: 16,
    },
    titleContainer: {
        gap: 10,
    },
    image: {
        borderRadius: 20,
        flex: 1,
        width: "100%",
        height: "100%",
    },
    body: {
        color: colors.white,
        fontFamily: "SpoqaHanSansNeo-Regular",
        fontSize: 16,
        lineHeight: 24,
        letterSpacing: -0.6,
    },
    strong: {
        fontFamily: "SpoqaHanSansNeo-Bold",
    },
});
