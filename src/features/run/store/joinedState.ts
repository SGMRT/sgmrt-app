import { RawRunData } from "../types";

type Listener = (state: RawRunData) => void;

class JoinedState {
    private last?: RawRunData;
    private listeners = new Set<Listener>();

    push(state: RawRunData) {
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
