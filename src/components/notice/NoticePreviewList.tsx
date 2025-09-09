import { Notice } from "@/src/apis";
import colors from "@/src/theme/colors";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import { forwardRef } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Typography } from "../ui/Typography";
import { NoticePreviewItem } from "./ui/NoticePreviewItem";

type Props = {
    data: Notice[];
    onEndReached?: () => void;
    isFetchingNextPage?: boolean;
};

export const NoticePreviewList = forwardRef<FlashListRef<Notice>, Props>(
    ({ data, onEndReached, isFetchingNextPage }, ref) => {
        const router = useRouter();
        return (
            <FlashList
                ref={ref}
                data={data}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.contentContainer}
                ItemSeparatorComponent={() => <View style={{ height: 20 }} />}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.6}
                renderItem={({ item }) => (
                    <NoticePreviewItem
                        title={item.title}
                        content={item.content}
                        date={new Date(item.startAt)}
                        onPress={() => {
                            router.push(`/notice/${item.id}`);
                        }}
                    />
                )}
                ListEmptyComponent={
                    <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <Typography variant="body1" color="gray40">
                            아직 공지사항이 없어요
                        </Typography>
                    </View>
                }
                ListFooterComponent={
                    isFetchingNextPage ? (
                        <View style={{ paddingVertical: 16 }}>
                            <ActivityIndicator
                                size="large"
                                color={colors.primary}
                            />
                        </View>
                    ) : null
                }
            />
        );
    }
);

NoticePreviewList.displayName = "NoticePreviewList";

const styles = StyleSheet.create({
    contentContainer: {
        paddingVertical: 20,
        paddingHorizontal: 16.5,
    },
});
