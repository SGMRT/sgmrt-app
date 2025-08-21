type JoinedPublic = {
    timestamp: number;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    altitude: number | null;
    altitudeAccuracy: number | null;
    speed: number | null;
    pressure: number | null;
    steps: number | null;
    distance: number;
};

type Listener = (state: JoinedPublic) => void;

class JoinedState {
    private last?: JoinedPublic;
    private listeners = new Set<Listener>();

    push(state: JoinedPublic) {
        this.last = state;
        for (const listener of this.listeners) {
            listener(state);
        }
    }
    getLast() {
        return this.last;
    }
    subscribe(fn: Listener) {
        this.listeners.add(fn);
        return () => {
            this.listeners.delete(fn);
        };
    }
}

export const joinedState = new JoinedState();
