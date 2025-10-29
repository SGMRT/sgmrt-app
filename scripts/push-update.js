const path = require("path");
const fs = require("fs/promises");
const spawnAsync = require("@expo/spawn-async");

const projectRoot = path.resolve(__dirname, "..");

// 현재 크리티컬 인덱스를 가져오고, 필요한 경우 증가시킨다
async function getAndMaybeBumpCriticalIndex(shouldBump) {
    const p = path.join(projectRoot, ".criticalIndex");
    let v = 0;
    try {
        v = Number(await fs.readFile(p, "utf-8")) || 0;
    } catch {}
    const next = shouldBump ? v + 1 : v;
    await fs.writeFile(p, String(next), "utf-8");
    return next;
}

async function main() {
    const args = process.argv.slice(2);
    const opts = {
        message: "",
        channel: "main",
        critical: false,
        platform: "all",
    };

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-m" || a === "--message") opts.message = args[++i] || "";
        else if (a === "-c" || a === "--critical") opts.critical = true;
        else if (a === "-ch" || a === "--channel")
            opts.channel = args[++i] || "main";
        else if (a === "-p" || a === "--platform")
            opts.platform = args[++i] || "all";
    }

    if (!opts.message) {
        console.log(
            'Usage: node scripts/push-update.js -m "message" [--critical] [--channel production|staging|preview] [--platform ios|android|all]'
        );
        process.exit(1);
    }

    const criticalIndex = await getAndMaybeBumpCriticalIndex(opts.critical);
    const env = {
        ...process.env,
        CRITICAL_INDEX: String(criticalIndex),
        UPDATE_CHANNEL: opts.channel,
    };

    console.log(
        `Pushing update with critical index ${criticalIndex} to channel ${opts.channel} (platform: ${opts.platform})`
    );
    console.log(`Options: ${JSON.stringify(opts)}`);

    // 플랫폼별로 나누어 실행
    const platforms =
        opts.platform === "all"
            ? ["ios", "android"]
            : [opts.platform.toLowerCase()];

    for (const p of platforms) {
        console.log(`\nRunning EAS update for ${p.toUpperCase()}...`);
        await spawnAsync(
            "eas",
            [
                "update",
                "--message",
                opts.message,
                "--channel",
                opts.channel,
                "--platform",
                p,
            ],
            { stdio: "inherit", cwd: projectRoot, env }
        );
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
