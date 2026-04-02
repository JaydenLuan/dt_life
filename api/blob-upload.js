import { handleUpload } from "@vercel/blob/client";

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
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ source: "share-generator" }),
          pathname
        };
      },
      onUploadCompleted: async () => {
        return;
      }
    });

    return response;
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "上传令牌生成失败" }, 500);
  }
}
