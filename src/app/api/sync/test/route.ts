import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import fs from "fs";

export async function POST(request: Request) {
  const body = await request.json();
  const platform = body.platform as string;

  const config = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (!config) {
    return NextResponse.json({ error: "No settings configured" }, { status: 400 });
  }

  try {
    switch (platform) {
      case "42": {
        if (!config.ftClientId || !config.ftClientSecret) {
          return NextResponse.json({ error: "42 API credentials not set" }, { status: 400 });
        }
        const tokenRes = await fetch("https://api.intra.42.fr/oauth/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            grant_type: "client_credentials",
            client_id: config.ftClientId,
            client_secret: config.ftClientSecret,
          }),
        });
        if (!tokenRes.ok) {
          return NextResponse.json({ error: `42 auth failed: ${tokenRes.status}` }, { status: 400 });
        }
        return NextResponse.json({ message: "42 API credentials valid" });
      }

      case "thm": {
        if (!config.thmUsername) {
          return NextResponse.json({ error: "THM username not set" }, { status: 400 });
        }
        const res = await fetch(
          `https://tryhackme.com/api/v2/public-profile?username=${encodeURIComponent(config.thmUsername)}`
        );
        if (!res.ok) {
          return NextResponse.json({ error: `THM profile not found: ${res.status}` }, { status: 400 });
        }
        return NextResponse.json({ message: "TryHackMe profile accessible" });
      }

      case "htb": {
        if (!config.htbApiToken) {
          return NextResponse.json({ error: "HTB API token not set" }, { status: 400 });
        }
        const res = await fetch("https://labs.hackthebox.com/api/v4/profile", {
          headers: { Authorization: `Bearer ${config.htbApiToken}`, Accept: "application/json" },
        });
        if (!res.ok) {
          return NextResponse.json({ error: `HTB auth failed: ${res.status}` }, { status: 400 });
        }
        return NextResponse.json({ message: "HackTheBox API token valid" });
      }

      case "rootme": {
        if (!config.rootmeUserId) {
          return NextResponse.json({ error: "Root-me user ID not set" }, { status: 400 });
        }
        const headers: Record<string, string> = { Accept: "application/json" };
        const cookies: string[] = [];
        if (config.rootmeApiKey) cookies.push(`api_key=${config.rootmeApiKey}`);
        if (config.rootmeCookie) cookies.push(`spip_session=${config.rootmeCookie}`);
        if (cookies.length > 0) headers.Cookie = cookies.join("; ");

        const res = await fetch(
          `https://api.www.root-me.org/auteurs/${config.rootmeUserId}`,
          { headers }
        );
        if (!res.ok) {
          return NextResponse.json({ error: `Root-me API failed: ${res.status}` }, { status: 400 });
        }
        return NextResponse.json({ message: "Root-me credentials valid" });
      }

      case "maldev": {
        if (!config.maldevDbPath) {
          return NextResponse.json({ error: "Maldev DB path not set" }, { status: 400 });
        }
        if (!fs.existsSync(config.maldevDbPath)) {
          return NextResponse.json({ error: `File not found: ${config.maldevDbPath}` }, { status: 400 });
        }
        return NextResponse.json({ message: "Maldev database file accessible" });
      }

      default:
        return NextResponse.json({ error: `Unknown platform: ${platform}` }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Connection test failed" },
      { status: 500 }
    );
  }
}
