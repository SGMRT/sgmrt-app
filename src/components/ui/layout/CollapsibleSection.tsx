import { ChevronIcon } from "@/assets/svgs/svgs";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Typography } from "../display/Typography";
import { spacing } from "@/src/design-system/tokens/spacing";
import { darkTheme } from "@/src/design-system/themes/dark";

interface CollapsibleSectionProps {
    title: string;
    defaultOpen?: boolean;
    alwaysVisibleChildren?: React.ReactNode;
    children?: React.ReactNode;
}

export default function CollapsibleSection({
    title,
    defaultOpen = false,
    alwaysVisibleChildren,
    children,
}: CollapsibleSectionProps) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <View style={{ paddingVertical: spacing[16], gap: spacing[8] }}>
            <View
                style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                }}
            >
                <Typography variant="body2" color="gray60">
                    {title}
                </Typography>
                <Pressable onPress={() => setOpen(!open)}>
                    <ChevronIcon
                        style={{
                            transform: [{ rotate: open ? "90deg" : "-90deg" }],
                        }}
                        color={darkTheme.ui04}
                    />
                </Pressable>
            </View>
            {alwaysVisibleChildren}
            {open && children}
        </View>
    );
}
