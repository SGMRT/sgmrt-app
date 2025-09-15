import { usePathname, useRootNavigationState } from "expo-router";
import { useMemo } from "react";

export function useShouldShowAd() {
    const pathname = usePathname();
    const navState = useRootNavigationState();
    const routerReady = !!navState?.key;

    return useMemo(() => {
        if (!routerReady) return false;
        const showOn = ["notice", "home", "stats", "profile"];
        const hideOn = ["register", "edit", "termDetail"];

        const shouldShow = showOn.some((s) => pathname.includes(s));
        const shouldHide = hideOn.some((s) => pathname.includes(s));
        return shouldShow && !shouldHide;
    }, [routerReady, pathname]);
}
