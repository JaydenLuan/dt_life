import { del, list } from "@vercel/blob";

const CLEANUP_MODE = process.env.CLEANUP_MODE || "shanghai-daily";
const RETENTION_HOURS = Number.parseInt(process.env.RETENTION_HOURS || "24", 10);
const SHANGHAI_TIMEZONE = "Asia/Shanghai";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

function isAuthorized(request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return true;
  }

  const authHeader = request.headers.get("authorization") || "";
  return authHeader === `Bearer ${cronSecret}`;
}

async function readJsonFromUrl(url) {
  const response = await fetch(url, {
    headers: {
      "Cache-Control": "no-cache"
    }
  });

  if (!response.ok) {
    throw new Error("读取分享 JSON 失败");
  }

  return response.json();
}

function shouldDelete(createdAt) {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) {
    return true;
  }

  if (CLEANUP_MODE === "age") {
    return Date.now() - createdMs > RETENTION_HOURS * 60 * 60 * 1000;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHANGHAI_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  const createdDay = formatter.format(new Date(createdMs));
  const currentDay = formatter.format(new Date());
  return createdDay !== currentDay;
}

export async function GET(request) {
  if (!isAuthorized(request)) {
    return json({ error: "未授权" }, 401);
  }

  try {
    const shareEntries = [];
    let cursor;

    do {
      const page = await list({
        prefix: "shares/",
        cursor,
        limit: 100
      });
      shareEntries.push(...page.blobs);
      cursor = page.hasMore ? page.cursor : undefined;
    } while (cursor);

    const deletedShareIds = [];

    for (const blob of shareEntries) {
      try {
        const share = await readJsonFromUrl(blob.url);
        if (!shouldDelete(share.createdAt)) {
          continue;
        }

        const targets = [blob.url];
        if (share.productImageUrl) {
          targets.push(share.productImageUrl);
        }
        if (share.detailImageUrl) {
          targets.push(share.detailImageUrl);
        }

        await del(targets);
        deletedShareIds.push(share.shareId || blob.pathname);
      } catch (error) {
        continue;
      }
    }

    return json({
      ok: true,
      cleanupMode: CLEANUP_MODE,
      retentionHours: RETENTION_HOURS,
      deletedCount: deletedShareIds.length,
      deletedShareIds
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "清理失败" }, 500);
  }
}
