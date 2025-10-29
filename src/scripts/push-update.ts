const path = require("path");
const fs = require("fs/promises");
const spawnAsync = require("@expo/spawn-async");

const projectRoot = path.resolve(__dirname, "..");

// 현재 크리티컬 인덱스를 가져오고, 필요한 경우 증가시킨다
async function getAndMaybeBumpCriticalIndex(shouldBump: boolean) {
    const p = path.join(projectRoot, ".criticalIndex");
    let v = 0;
    try {
        v = Number(await fs.readFile(p, "utf-8")) || 0;
    } catch {}
    const next = shouldBump ? v + 1 : v;
    await fs.writeFile(p, String(next), "utf-8");
    return next;
}

async () => {
    const args = process.argv.slice(2);
    const opts = { message: "", channel: "main", critical: false };

    for (let i = 0; i < args.length; i++) {
        const a = args[i];
        if (a === "-m" || a === "--message") opts.message = args[++i] || "";
        else if (a === "-c" || a === "--critical") opts.critical = true;
        else if (a === "-ch" || a === "--channel")
            opts.channel = args[++i] || "main";
    }

    if (!opts.message) {
        console.log(
            'Usage: node scripts/push-update.js -m "message" [--critical] [--channel main]'
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
        `Pushing update with critical index ${criticalIndex} to channel ${opts.channel}`
    );
    console.log(`Options: ${JSON.stringify(opts)}`);

    await spawnAsync(
        "eas",
        ["update", "--message", opts.message, "--channel", opts.channel],
        { stdio: "inherit", cwd: projectRoot, env }
    );
};
