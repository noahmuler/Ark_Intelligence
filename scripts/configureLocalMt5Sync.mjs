import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const envText = readFileSync(".env.local", "utf8");
const token = envText.match(/^MT5_SYNC_TOKEN=(.*)$/m)?.[1]?.trim();
if (!token || token.length < 32) {
  throw new Error("Set a private MT5_SYNC_TOKEN of at least 32 characters in .env.local first.");
}

const localConfig = JSON.parse(
  readFileSync(".convex/local/default/config.json", "utf8"),
);
if (
  typeof localConfig.adminKey !== "string" ||
  !Number.isInteger(localConfig.ports?.cloud)
) {
  throw new Error("Could not read the local Convex deployment credentials.");
}

const result = spawnSync(
  "npx",
  [
    "convex",
    "env",
    "set",
    "MT5_SYNC_TOKEN",
    "--url",
    `http://127.0.0.1:${localConfig.ports.cloud}`,
    "--admin-key",
    localConfig.adminKey,
  ],
  { input: `${token}\n`, encoding: "utf8", stdio: ["pipe", "inherit", "inherit"] },
);

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
console.log("Configured the MT5 sync key on the local Convex deployment.");
