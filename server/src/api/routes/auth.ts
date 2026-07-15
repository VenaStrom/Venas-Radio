import type { AuthedRequest } from "@/api/lib/auth";
import type { ApiError, MeDto, SessionDto } from "@/types/api";
import {
  discordAuthConfig,
  discordConfigured,
  exchangeDiscordCode,
  pruneExpiredAuthFlows,
  randomToken,
  requireAuth,
  safeEquals,
  sha256Base64Url,
} from "@/api/lib/auth";
import { isObj } from "@/types";
import { prisma } from "@/api/lib/prisma";
import express from "express";

export const authRouter = express.Router();

/** Bounded so a hostile challenge cannot be used to stuff the database. */
const maxChallengeLength = 128;

/**
 * Step 1. The app opens this in a browser (not a WebView) with a state and the
 * PKCE challenge, and we hand off to Discord.
 */
authRouter.get("/auth/discord/start", async (req, res) => {
  if (!discordConfigured) {
    res.status(503).json({ error: "Discord OAuth is not configured on this server." } satisfies ApiError);
    return;
  }

  const { state, challenge } = req.query;
  if (
    typeof state !== "string" || state.length < 16 || state.length > maxChallengeLength
    || typeof challenge !== "string" || challenge.length < 16 || challenge.length > maxChallengeLength
  ) {
    res.status(400).json({ error: "Missing or invalid 'state' or 'challenge'." } satisfies ApiError);
    return;
  }

  await pruneExpiredAuthFlows();
  await prisma.authFlow.upsert({
    where: { state },
    create: { state, code_challenge: challenge },
    update: { code_challenge: challenge, exchange_code: null, user_id: null, created_at: new Date() },
  });

  const url = new URL("https://discord.com/api/oauth2/authorize");
  url.searchParams.set("client_id", discordAuthConfig.clientId);
  url.searchParams.set("redirect_uri", discordAuthConfig.redirectUri);
  url.searchParams.set("response_type", "code");
  // identify is all we need: a snowflake, a name and an avatar. No email.
  url.searchParams.set("scope", "identify");
  url.searchParams.set("state", state);

  res.redirect(url.toString());
});

/**
 * Step 2. Discord sends the user back here. The client secret is used only on
 * this hop, server-side, and never reaches the app.
 */
authRouter.get("/auth/discord/callback", async (req, res) => {
  const { code, state } = req.query;
  if (typeof code !== "string" || typeof state !== "string") {
    res.status(400).send("Missing code or state.");
    return;
  }

  const flow = await prisma.authFlow.findUnique({ where: { state } });
  if (!flow) {
    res.status(400).send("Unknown or expired login attempt.");
    return;
  }

  let discordUser;
  try {
    discordUser = await exchangeDiscordCode(code);
  } catch (err: unknown) {
    console.error("Discord code exchange failed", err);
    await prisma.authFlow.delete({ where: { state } }).catch(() => undefined);
    res.status(502).send("Could not complete Discord sign-in.");
    return;
  }

  await prisma.user.upsert({
    where: { id: discordUser.id },
    create: { id: discordUser.id, username: discordUser.username, avatar_url: discordUser.avatarUrl },
    update: { username: discordUser.username, avatar_url: discordUser.avatarUrl },
  });

  // The deep link carries only this. Redeeming it still requires the verifier.
  const exchangeCode = randomToken();
  await prisma.authFlow.update({
    where: { state },
    data: { exchange_code: exchangeCode, user_id: discordUser.id },
  });

  const appUrl = new URL(discordAuthConfig.appRedirectScheme);
  appUrl.searchParams.set("code", exchangeCode);
  appUrl.searchParams.set("state", state);
  res.redirect(appUrl.toString());
});

/**
 * Step 3. The app redeems the one-time code by proving it holds the verifier.
 * This is the hop that makes deep-link interception useless.
 */
authRouter.post("/auth/discord/exchange", async (req, res) => {
  const body: unknown = req.body;
  if (!isObj(body) || typeof body.code !== "string" || typeof body.verifier !== "string") {
    res.status(400).json({ error: "Missing 'code' or 'verifier'." } satisfies ApiError);
    return;
  }
  const { code, verifier } = body;

  const flow = await prisma.authFlow.findUnique({ where: { exchange_code: code } });
  if (!flow?.user_id) {
    res.status(400).json({ error: "Unknown or already used code." } satisfies ApiError);
    return;
  }

  // Burn it first: a code is single-use whether or not the verifier checks out,
  // so a wrong guess cannot be retried.
  await prisma.authFlow.delete({ where: { state: flow.state } });

  if (!safeEquals(sha256Base64Url(verifier), flow.code_challenge)) {
    res.status(400).json({ error: "Verifier does not match the challenge." } satisfies ApiError);
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: flow.user_id } });
  if (!user) {
    res.status(500).json({ error: "User vanished mid-login." } satisfies ApiError);
    return;
  }

  const token = randomToken();
  await prisma.session.create({ data: { token, user_id: user.id } });

  const session: SessionDto = {
    token,
    userId: user.id,
    username: user.username,
    avatarUrl: user.avatar_url,
  };
  res.json(session);
});

/** Lets the app confirm a stored token is still good on launch. */
authRouter.get("/auth/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) {
    res.status(401).json({ error: "Invalid or expired session." } satisfies ApiError);
    return;
  }
  const me: MeDto = { userId: user.id, username: user.username, avatarUrl: user.avatar_url };
  res.json(me);
});

/** Revocation is a row delete, which is the whole point of opaque tokens. */
authRouter.post("/auth/signout", requireAuth, async (req, res) => {
  const token = (req.headers.authorization ?? "").slice("Bearer ".length).trim();
  await prisma.session.delete({ where: { token } }).catch(() => undefined);
  res.status(204).end();
});
