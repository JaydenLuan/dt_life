import {
  isAuthorized,
  json,
  loadJson,
  shouldDelete,
  withCors
} from "../_lib/storage.js";

export async function onRequestOptions() {
  return withCors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  if (!isAuthorized(context.request, context.env.CRON_SECRET)) {
    return withCors(json({ error: "未授权" }, 401));
  }

  try {
    const mode = context.env.CLEANUP_MODE || "shanghai-daily";
    const retentionHours = Number.parseInt(context.env.RETENTION_HOURS || "24", 10);
    const deletedShareIds = [];

    let cursor;
    do {
      const page = await context.env.SHARES_BUCKET.list({
        prefix: "shares/",
        cursor,
        limit: 100
      });

      for (const item of page.objects) {
        const share = await loadJson(context.env.SHARES_BUCKET, item.key);
        if (!share || !shouldDelete(share.createdAt, mode, retentionHours)) {
          continue;
        }

        await context.env.SHARES_BUCKET.delete(item.key);
        if (share.productKey) {
          await context.env.SHARES_BUCKET.delete(share.productKey);
        }
        if (share.detailKey) {
          await context.env.SHARES_BUCKET.delete(share.detailKey);
        }

        deletedShareIds.push(share.shareId || item.key);
      }

      cursor = page.truncated ? page.cursor : undefined;
    } while (cursor);

    return withCors(json({
      ok: true,
      cleanupMode: mode,
      retentionHours,
      deletedCount: deletedShareIds.length,
      deletedShareIds
    }));
  } catch (error) {
    return withCors(json({ error: error instanceof Error ? error.message : "清理失败" }, 500));
  }
}
