import { put } from "@vercel/blob";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const time = String(body.time || "").trim() || "None";
    const productImageUrl = String(body.productImageUrl || "").trim();
    const detailImageUrl = String(body.detailImageUrl || "").trim();

    if (!title || !description || !productImageUrl || !detailImageUrl) {
      return json({ error: "请完整填写文字并上传两张图片。" }, 400);
    }

    const shareId = crypto.randomUUID();

    const sharePayload = {
      shareId,
      title,
      description,
      time,
      productImageUrl,
      detailImageUrl,
      createdAt: new Date().toISOString()
    };

    await put(`shares/${shareId}.json`, JSON.stringify(sharePayload, null, 2), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json"
    });

    const origin = new URL(request.url).origin;
    return json({
      shareId,
      shareUrl: `${origin}/share/${shareId}`
    });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "生成失败" }, 500);
  }
}
