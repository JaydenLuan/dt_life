import {
  contentTypeOf,
  extensionFromType,
  json,
  randomId,
  saveJson,
  withCors
} from "../_lib/storage.js";

export async function onRequestOptions() {
  return withCors(new Response(null, { status: 204 }));
}

export async function onRequestPost(context) {
  try {
    const formData = await context.request.formData();
    const title = String(formData.get("title") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const time = String(formData.get("time") || "").trim() || "None";
    const productImage = formData.get("productImage");
    const detailImage = formData.get("detailImage");

    if (!title || !description || !(productImage instanceof File) || !(detailImage instanceof File)) {
      return withCors(json({ error: "请完整填写文字并上传两张图片。" }, 400));
    }

    const shareId = randomId();
    const productKey = `uploads/${shareId}/product${extensionFromType(contentTypeOf(productImage))}`;
    const detailKey = `uploads/${shareId}/detail${extensionFromType(contentTypeOf(detailImage))}`;

    await context.env.SHARES_BUCKET.put(productKey, await productImage.arrayBuffer(), {
      httpMetadata: {
        contentType: contentTypeOf(productImage)
      }
    });

    await context.env.SHARES_BUCKET.put(detailKey, await detailImage.arrayBuffer(), {
      httpMetadata: {
        contentType: contentTypeOf(detailImage)
      }
    });

    const sharePayload = {
      shareId,
      title,
      description,
      time,
      productKey,
      detailKey,
      createdAt: new Date().toISOString()
    };

    await saveJson(context.env.SHARES_BUCKET, `shares/${shareId}.json`, sharePayload);

    const origin = new URL(context.request.url).origin;
    return withCors(json({
      shareId,
      shareUrl: `${origin}/share/${shareId}`
    }));
  } catch (error) {
    return withCors(json({ error: error instanceof Error ? error.message : "生成失败" }, 500));
  }
}
