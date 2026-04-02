import { list } from "@vercel/blob";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return json({ error: "缺少分享 id。" }, 400);
    }

    const result = await list({
      prefix: `shares/${id}.json`,
      limit: 1
    });

    const blob = result.blobs[0];
    if (!blob) {
      return json({ error: "未找到对应分享内容。" }, 404);
    }

    const response = await fetch(blob.url, {
      headers: {
        "Cache-Control": "no-cache"
      }
    });

    if (!response.ok) {
      return json({ error: "读取分享内容失败。" }, 500);
    }

    const share = await response.json();
    return json({ share });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "读取失败" }, 500);
  }
}
