import type { NextFunction, Request, Response } from "express";
import { prisma } from "@/api/lib/prisma";
import crypto from "node:crypto";

const discordClientId = process.env.DISCORD_CLIENT_ID ?? "";
const discordClientSecret = process.env.DISCORD_CLIENT_SECRET ?? "";
/** Must byte-for-byte match a redirect registered on the Discord application. */
const discordRedirectUri = process.env.DISCORD_REDIRECT_URI ?? "http://localhost:3000/auth/discord/callback";
/** Where the browser hands control back to the app. */
const appRedirectScheme = process.env.APP_REDIRECT_SCHEME ?? "vradio://auth";

/** An unfinished OAuth attempt is worthless after a few minutes. */
const authFlowTtlMs = 10 * 60 * 1000;

export const discordConfigured = discordClientId !== "" && discordClientSecret !== "";

export const discordAuthConfig = {
  clientId: discordClientId,
  clientSecret: discordClientSecret,
  redirectUri: discordRedirectUri,
  appRedirectScheme,
};

/** 256 bits from the CSPRNG. Long enough that guessing is not a threat model. */
export function randomToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

/** The PKCE transform: base64url(SHA-256(verifier)), no padding. */
export function sha256Base64Url(input: string): string {
  return crypto.createHash("sha256").update(input).digest("base64url");
}

/**
 * Constant-time compare, so an attacker cannot learn the expected value one
 * byte at a time from response timing.
 */
export function safeEquals(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function pruneExpiredAuthFlows(): Promise<void> {
  await prisma.authFlow.deleteMany({
    where: { created_at: { lt: new Date(Date.now() - authFlowTtlMs) } },
  });
}

export type AuthedRequest = Request & { userId?: string };

/**
 * Resolves `Authorization: Bearer <token>` to a user.
 *
 * Cookies are deliberately absent: the only client is native, so there is no
 * browser to carry them and no CSRF surface to defend.
 */
export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (typeof header !== "string" || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const token = header.slice("Bearer ".length).trim();
  if (token === "") {
    res.status(401).json({ error: "Missing bearer token." });
    return;
  }

  const session = await prisma.session.findUnique({ where: { token }, select: { user_id: true } });
  if (!session) {
    res.status(401).json({ error: "Invalid or expired session." });
    return;
  }

  req.userId = session.user_id;
  next();
}

export type DiscordUser = {
  id: string;
  username: string;
  avatarUrl: string | null;
};

/** Exchanges the authorization code for a token, then identifies the user. */
export async function exchangeDiscordCode(code: string): Promise<DiscordUser> {
  const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: discordClientId,
      client_secret: discordClientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: discordRedirectUri,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error(`Discord token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`);
  }

  const token = await tokenRes.json() as { access_token?: string };
  if (!token.access_token) throw new Error("Discord token response had no access_token.");

  const meRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meRes.ok) {
    throw new Error(`Discord /users/@me failed: ${meRes.status}`);
  }

  const me = await meRes.json() as { id?: string; username?: string; global_name?: string | null; avatar?: string | null };
  if (!me.id || !me.username) throw new Error("Discord /users/@me was missing id or username.");

  return {
    id: me.id,
    username: me.global_name ?? me.username,
    avatarUrl: me.avatar ? `https://cdn.discordapp.com/avatars/${me.id}/${me.avatar}.png` : null,
  };
}
