import { json, loadJson, withCors } from "../_lib/storage.js";

function buildPublicShare(shareId, share, origin) {
  return {
    shareId,
    title: share.title || "",
    description: share.description || "",
    time: share.time || "None",
    productImageUrl: `${origin}/api/image/${encodeURIComponent(shareId)}/product`,
    detailImageUrl: `${origin}/api/image/${encodeURIComponent(shareId)}/detail`,
    createdAt: share.createdAt || ""
  };
}

export async function onRequestOptions() {
  return withCors(new Response(null, { status: 204 }));
}

export async function onRequestGet(context) {
  try {
    const url = new URL(context.request.url);
    const shareId = url.searchParams.get("id");

    if (!shareId) {
      return withCors(json({ error: "缺少分享 id。" }, 400));
    }

    const share = await loadJson(context.env.SHARES_BUCKET, `shares/${shareId}.json`);
    if (!share) {
      return withCors(json({ error: "未找到对应分享内容。" }, 404));
    }

    return withCors(json({ share: buildPublicShare(shareId, share, url.origin) }));
  } catch (error) {
    return withCors(json({ error: error instanceof Error ? error.message : "读取失败" }, 500));
  }
}
