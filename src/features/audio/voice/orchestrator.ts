import { formatEvent } from "./formatters";
import {
    canBarge,
    clearPacerOnAnyNav,
    shouldDropNavKeep,
    shouldKillPacerOnApproach,
} from "./policies";
import { Event, P, Priority, Settings, TTSEngine, Utterance } from "./types";
import { splitSentencesKorean, uid } from "./utils";

export class VoiceOrchestrator {
    private speaking: Utterance | null = null;
    private queue: Utterance[] = [];
    private lastSpokenAt: Record<string, number> = {};
    private duckingOn = false;
    constructor(private tts: TTSEngine, private settings: Settings) {}

    dispatch(e: Event) {
        if (!this.settings.enabled) return;
        if (e.type === "pacer/script")
            return this.announcePacerScript(e.script, e.priority ?? "NORMAL");
        const list = formatEvent(e);
        for (const u of list) {
            if (u.cooldownKey && !this.consumeCooldown(u.cooldownKey)) continue;
            this.enqueue(u);
        }
        void this.tick();
    }

    announcePacerScript(script: string, priority: Priority = "NORMAL") {
        const groupId = uid("pacer");
        const lines = splitSentencesKorean(script);
        for (const text of lines) {
            const u: Utterance = {
                id: uid("pacer_line"),
                channel: "PACER",
                text,
                priority,
                atomic: true,
                canBarge: false,
                interruptLower: false,
                groupId,
            };
            this.enqueue(u);
        }
        void this.tick();
    }

    stopAll() {
        this.tts.stop();
        this.speaking = null;
        this.queue = [];
        void this.disableDuckIfIdle();
    }
    clearQueue() {
        this.queue = [];
    }
    setEnabled(v: boolean) {
        this.settings.enabled = v;
    }
    setRate(v: number) {
        this.settings.rate = v;
    }
    setLang(v: string) {
        this.settings.lang = v;
    }
    setCooldownMs(k: string, ms: number) {
        this.settings.cooldownMs[k] = ms;
    }

    // ——— 내부 ———
    private enqueue(u: Utterance) {
        if (u.hardCut) {
            if (this.speaking) {
                this.tts.stop();
                this.speaking = null;
            }
            this.queue = [];
            this.queue.push(u);
            void this.tick();
            return;
        }

        // 1) RUN/START는 PACER 진행 중이면 버림
        if (u.channel === "RUN" && u.runKind === "START") {
            const pacerIsSpeaking = this.speaking?.channel === "PACER";
            const pacerQueued = this.queue.some((q) => q.channel === "PACER");
            if (pacerIsSpeaking || pacerQueued) {
                return; // drop
            }
        }
        // NAV 정책
        if (u.channel === "NAV") {
            const killPacer =
                (u.navKind === "APPROACH" && shouldKillPacerOnApproach) ||
                clearPacerOnAnyNav;
            if (killPacer) {
                this.queue = this.queue.filter((q) => q.channel !== "PACER");
            }
            if (
                u.navKind === "KEEP" &&
                shouldDropNavKeep(this.queue, this.speaking)
            )
                return;
        }

        if (u.interruptLower) {
            this.queue = this.queue.filter(
                (q) => P[q.priority] >= P[u.priority]
            );
        }

        const idx = this.queue.findIndex((q) => P[q.priority] < P[u.priority]);
        if (idx >= 0) this.queue.splice(idx, 0, u);
        else this.queue.push(u);

        if (canBarge(this.speaking, u)) {
            this.tts.stop();
            this.speaking = null;
            void this.tick();
        }
    }

    private async tick() {
        if (this.speaking || this.queue.length === 0)
            return this.disableDuckIfIdle();
        const now = Date.now();
        this.queue = this.queue.filter((q) => !q.expireAt || q.expireAt > now);
        if (this.queue.length === 0) return this.disableDuckIfIdle();

        const next = this.queue.shift()!;
        this.speaking = next;
        await this.enableDuckIfNeeded();

        this.tts.speak(next.text, {
            lang: this.settings.lang,
            rate: this.settings.rate,
            onDone: () => this.onFinish(),
            onStopped: () => this.onFinish(),
            onError: () => this.onFinish(),
        });
    }

    private onFinish() {
        this.speaking = null;
        void this.tick();
    }

    private consumeCooldown(key: string) {
        const n = Date.now(),
            last = this.lastSpokenAt[key] ?? 0,
            cool = this.settings.cooldownMs[key] ?? 1000;
        if (n - last < cool) return false;
        this.lastSpokenAt[key] = n;
        return true;
    }
    private async enableDuckIfNeeded() {
        if (this.duckingOn) return;
        await this.tts.enableDuck().catch(() => {});
        this.duckingOn = true;
    }
    private async disableDuckIfIdle() {
        if (!this.duckingOn || this.speaking || this.queue.length > 0) return;
        await this.tts.disableDuck().catch(() => {});
        this.duckingOn = false;
    }
}
