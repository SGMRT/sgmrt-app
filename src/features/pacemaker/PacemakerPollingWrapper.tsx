import { usePacemakerJobPolling } from "./hooks/usePacemakerJobPolling";

// Pacemaker 폴링 Wrapper
export function PacemakerPollingWrapper() {
    usePacemakerJobPolling();

    return null;
}

export default PacemakerPollingWrapper;
