import { useReducer } from "react";

type AgreeKey = "terms" | "privacy" | "consign" | "thirdparty" | "marketing";

export type AgreeState = {
    [K in AgreeKey]: boolean;
};

export type AgreeAction =
    | { type: "TOGGLE_ITEM"; key: AgreeKey }
    | { type: "TOGGLE_ALL"; value: boolean };

const initialAgreeState: AgreeState = {
    terms: false,
    privacy: false,
    consign: false,
    thirdparty: false,
    marketing: false,
};

function agreeReducer(state: AgreeState, action: AgreeAction): AgreeState {
    switch (action.type) {
        case "TOGGLE_ITEM":
            return { ...state, [action.key]: !state[action.key] };
        case "TOGGLE_ALL":
            return Object.fromEntries(
                Object.keys(state).map((k) => [k, action.value])
            ) as AgreeState;
        default:
            return state;
    }
}

export function useAgreeState() {
    return useReducer(agreeReducer, initialAgreeState);
}
