import { loadJson } from "../../../_lib/storage.js";

export async function onRequestGet(context) {
  try {
    const shareId = context.params.shareId;
    const type = context.params.type;
    const share = await loadJson(context.env.SHARES_BUCKET, `shares/${shareId}.json`);

    if (!share) {
      return new Response("Not found", { status: 404 });
    }

    const key = type === "detail" ? share.detailKey : share.productKey;
    const object = await context.env.SHARES_BUCKET.get(key);
    if (!object) {
      return new Response("Not found", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
    return new Response(object.body, { headers });
  } catch (error) {
    return new Response("Image error", { status: 500 });
  }
}
