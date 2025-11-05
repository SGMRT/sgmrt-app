import { CommonShareProps, ShareVariant } from "./types";

import { ComponentType, memo } from "react";
import DefaultShareContent from "./variants/DefaultShareContent";
import LogoShareContent from "./variants/LogoShareContent";
import RecordShareContent from "./variants/RecordShareContent";
import SimpleShareContent from "./variants/SimpleShareContent";

type ShareContentComponent = ComponentType<CommonShareProps>;

export const SHARE_REGISTRY: Record<ShareVariant, ShareContentComponent> = {
    default: memo(DefaultShareContent),
    logo: memo(LogoShareContent),
    simple: memo(SimpleShareContent),
    record: memo(RecordShareContent),
};
