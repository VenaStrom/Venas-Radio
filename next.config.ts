import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import { PHASE_PRODUCTION_BUILD } from "next/constants";

const MAIN_BRANCH = "main";
const EXPERIMENTAL_STROKE = "#ff7a18";

function getBranchName() {
  try {
    const branch = execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    if (branch && branch !== "HEAD") return branch;
  }
  catch {
    // Fall back to env vars when git is unavailable.
  }

  try {
    const upstream = execSync("git rev-parse --abbrev-ref --symbolic-full-name @{u}", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();

    if (upstream) {
      return upstream.replace(/^origin\//, "");
    }
  }
  catch {
    // Ignore missing upstream; fall through.
  }

  try {
    const nameRev = execSync("git name-rev --name-only HEAD", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();

    if (nameRev) {
      const normalized = nameRev.replace(/^remotes\/origin\//, "").replace(/^origin\//, "");
      if (normalized && !normalized.includes("tags/")) return normalized;
    }
  }
  catch {
    // Ignore name-rev failures; fall through.
  }

  const candidates = [
    process.env.GITHUB_REF_NAME,
    process.env.GIT_BRANCH,
    process.env.BRANCH,
    process.env.GITHUB_REF,
  ].filter(Boolean) as string[];

  for (const value of candidates) {
    const trimmed = value.replace("refs/heads/", "");
    if (trimmed) return trimmed;
  }

  return null;
}

function getCommitSha() {
  try {
    const sha = execSync("git rev-parse HEAD", {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    }).trim();
    if (sha) return sha;
  }
  catch {
    // Fall back to env vars when git is unavailable.
  }

  return process.env.GIT_COMMIT ?? process.env.GITHUB_SHA ?? null;
}

function applyExperimentalIconStroke() {
  const iconPath = path.join(process.cwd(), "public", "icons", "audio-lines.svg");
  try {
    const original = fs.readFileSync(iconPath, "utf8");
    let updated = original;

    if (/stroke="[^"]*"/.test(updated)) {
      updated = updated.replace(/stroke="[^"]*"/, `stroke="${EXPERIMENTAL_STROKE}"`);
    }
    else if (updated.startsWith("<svg")) {
      updated = updated.replace("<svg", `<svg stroke=\"${EXPERIMENTAL_STROKE}\"`);
    }

    if (updated !== original) {
      fs.writeFileSync(iconPath, updated, "utf8");
    }
  }
  catch (error) {
    console.warn("Failed to update experimental icon stroke", error);
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  devIndicators: {
    position: "top-left",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.sr.se", },
      { protocol: "https", hostname: "static-cdn.sr.se" },
      { protocol: "https", hostname: "www.sverigesradio.se" },
    ],
  },
  allowedDevOrigins: [
    "ts.net",
    "laptop",
    "laptop.lan",
    "laptop.local",
    "localhost",
  ],
};

export default (phase: string) => {
  const branchName = getBranchName();
  const commitSha = getCommitSha();
  if (phase === PHASE_PRODUCTION_BUILD && branchName && branchName !== MAIN_BRANCH) {
    applyExperimentalIconStroke();
  }
  return {
    ...nextConfig,
    env: {
      ...nextConfig.env,
      NEXT_PUBLIC_GIT_BRANCH: branchName ?? "",
      NEXT_PUBLIC_GIT_COMMIT: commitSha ?? "",
    },
  };
};
