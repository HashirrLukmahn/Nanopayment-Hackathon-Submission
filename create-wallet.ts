/**
 * create-wallet.ts: Create a Dev-Controlled Wallet
 *
 * 1. Register entity secret (appends CIRCLE_ENTITY_SECRET to .env)
 * 2. Create wallet set
 * 3. Create Wallet (appends CIRCLE_WALLET_ADDRESS, CIRCLE_WALLET_ID, and CIRCLE_WALLET_BLOCKCHAIN to .env)
 *
 * Required .env (or environment):
 *   CIRCLE_API_KEY: Your Circle API key (https://console.circle.com)
 *
 * Usage:
 *   node --env-file=.env --import=tsx create-wallet.ts
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  registerEntitySecretCiphertext,
  initiateDeveloperControlledWalletsClient,
} from "@circle-fin/developer-controlled-wallets";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "output");
const WALLET_SET_NAME = "Circle Wallet Onboarding";

async function main() {
  const apiKey = process.env.CIRCLE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CIRCLE_API_KEY is required. Add it to .env or set it as an environment variable.",
    );
  }

  // Register entity secret
  console.log("Registering entity secret...");
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const entitySecret = crypto.randomBytes(32).toString("hex");
  await registerEntitySecretCiphertext({
    apiKey,
    entitySecret,
    recoveryFileDownloadPath: OUTPUT_DIR,
  });
  const envPath = path.join(__dirname, ".env");
  fs.appendFileSync(
    envPath,
    `\nCIRCLE_ENTITY_SECRET=${entitySecret}\n`,
    "utf-8",
  );
  console.log("Entity secret registered.");

  // Create wallet set
  console.log("\nCreating wallet set...");
  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });
  const walletSet = (await client.createWalletSet({ name: WALLET_SET_NAME }))
    .data?.walletSet;
  if (!walletSet?.id) {
    throw new Error("Wallet set creation failed: no ID returned");
  }
  console.log("Wallet set ID:", walletSet.id);

  // Create Wallet
  console.log("\nCreating Wallet on ARC-TESTNET...");
  const wallet = (
    await client.createWallets({
      walletSetId: walletSet.id,
      blockchains: ["ARC-TESTNET"],
      count: 1,
      accountType: "EOA",
    })
  ).data?.wallets?.[0];
  if (!wallet) {
    throw new Error("Wallet creation failed: no wallet returned");
  }
  console.log("Wallet ID:", wallet.id);
  console.log("Address:", wallet.address);

  fs.appendFileSync(envPath, `CIRCLE_WALLET_ADDRESS=${wallet.address}\n`, "utf-8");
  fs.appendFileSync(envPath, `CIRCLE_WALLET_ID=${wallet.id}\n`, "utf-8");
  fs.appendFileSync(envPath, `CIRCLE_WALLET_BLOCKCHAIN=${wallet.blockchain}\n`, "utf-8");
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "wallet-info.json"),
    JSON.stringify(wallet, null, 2),
    "utf-8",
  );
  console.log("\nCredentials written to .env");
  console.log("Done!");
}

main().catch((err) => {
  console.error("Error:", err.message || err);
  process.exit(1);
});