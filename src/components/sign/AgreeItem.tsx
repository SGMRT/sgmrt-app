import { CheckIcon, ChevronIcon } from "@/assets/svgs/svgs";
import colors from "@/src/theme/colors";
import { Pressable, StyleSheet, TouchableOpacity, View } from "react-native";
import { Typography } from "../ui/Typography";

interface AgreeItemProps {
    title: string;
    isAgreed: boolean;
    onPressAgree: () => void;
    onPressDetail: () => void;
}

const AgreeItem = ({
    title,
    isAgreed,
    onPressAgree,
    onPressDetail,
}: AgreeItemProps) => {
    // const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <View style={styles.container}>
                <View style={styles.contentContainer}>
                    <TouchableOpacity onPress={onPressAgree}>
                        <CheckIcon
                            color={isAgreed ? colors.primary : colors.gray[60]}
                        />
                    </TouchableOpacity>
                    <Typography variant="body2" color="gray40">
                        {title}
                    </Typography>
                </View>
                <Pressable onPress={onPressDetail}>
                    <ChevronIcon
                        color={colors.gray[40]}
                        // style={{
                        //     transform: [{ rotate: isOpen ? "90deg" : "0deg" }],
                        // }}
                    />
                </Pressable>
            </View>
            {/* {isOpen && (
                <View>
                    <Typography variant="body2" color="gray40">
                        {content}
                    </Typography>
                </View>
            )} */}
        </>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 40,
    },
    contentContainer: {
        gap: 8,
        alignItems: "center",
        flexDirection: "row",
    },
});

export default AgreeItem;
