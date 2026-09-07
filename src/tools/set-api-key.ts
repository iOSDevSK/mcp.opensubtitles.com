import { z } from "zod";
import { OpenSubtitlesKongClient } from "../api-client.js";
import {
  getSessionApiKey,
  getSessionLabel,
  getSessionToken,
  maskSecret,
  setSessionApiKey,
  setSessionToken,
  clearSessionCredentials,
} from "../runtime.js";

const SetApiKeyArgsSchema = z
  .object({
    api_key: z.string().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().min(1).optional(),
  })
  .refine((a) => Boolean(a.api_key) || Boolean(a.username && a.password), {
    message: "Provide api_key, or username together with password",
  });

function text(body: string) {
  return { content: [{ type: "text", text: body }] };
}

export async function setApiKey(args: unknown) {
  const { api_key, username, password } = SetApiKeyArgsSchema.parse(args);
  const client = new OpenSubtitlesKongClient();

  // Username + password: the login call verifies the credentials for us and
  // returns the account's real download quota.
  if (username && password) {
    let login;
    try {
      login = await client.login({ username, password });
    } catch (error) {
      throw new Error(
        `OpenSubtitles rejected those credentials for ${username}. ` +
          `Check the username and password, or use an API key instead. ` +
          `(${error instanceof Error ? error.message : "unknown error"})`
      );
    }
    setSessionToken(login.token, username);

    return text(
      [
        `Logged in as ${username} for this session.`,
        `Account level: ${login.user.level}${login.user.vip ? " (VIP)" : ""}`,
        `Downloads allowed per day: ${login.user.allowed_downloads}`,
        "",
        "The credentials are kept in memory only and are gone when the server restarts.",
        "For a permanent setup, set OPENSUBTITLES_API_KEY in the MCP server environment.",
      ].join("\n")
    );
  }

  // API key: the search endpoint answers for any key, so this only catches a
  // key the API outright rejects. A wrong-but-accepted key surfaces on the
  // first download, with the quota message from the API.
  setSessionApiKey(api_key!, "api key");
  try {
    await client.searchSubtitles({ query: "matrix" });
  } catch (error) {
    clearSessionCredentials();
    throw new Error(
      `The API rejected that key: ${error instanceof Error ? error.message : "unknown error"}`
    );
  }

  return text(
    [
      `API key ${maskSecret(api_key!)} is now used for this session.`,
      "",
      "It is kept in memory only and is gone when the server restarts.",
      "For a permanent setup, set OPENSUBTITLES_API_KEY in the MCP server environment.",
    ].join("\n")
  );
}

export async function apiKeyStatus() {
  const token = getSessionToken();
  if (token) {
    return text(`Using session login for ${getSessionLabel() ?? "an OpenSubtitles account"}.`);
  }

  const sessionKey = getSessionApiKey();
  if (sessionKey) {
    return text(`Using the session API key ${maskSecret(sessionKey)} (set with set_api_key).`);
  }

  const envKey = process.env.OPENSUBTITLES_API_KEY || process.env.OPENSUBTITLES_USER_KEY;
  if (envKey) {
    return text(`Using the API key from the server environment (${maskSecret(envKey)}).`);
  }

  return text(
    [
      "No API key configured - running on the shared built-in key.",
      "Search works, downloads share one small daily quota with every other installation and usually fail.",
      "Ask the user for their key (free at https://www.opensubtitles.com/api) and pass it to set_api_key.",
    ].join("\n")
  );
}
