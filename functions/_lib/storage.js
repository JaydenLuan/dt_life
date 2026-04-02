export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

export function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

export function withCors(response) {
  const headers = new Headers(response.headers);
  const cors = corsHeaders();
  Object.entries(cors).forEach(([key, value]) => headers.set(key, value));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

export function randomId() {
  return crypto.randomUUID();
}

export function contentTypeOf(file) {
  return file.type || "application/octet-stream";
}

export function extensionFromType(type) {
  if (type === "image/png") return ".png";
  if (type === "image/webp") return ".webp";
  if (type === "image/gif") return ".gif";
  return ".jpg";
}

export async function saveJson(bucket, key, data) {
  await bucket.put(key, JSON.stringify(data), {
    httpMetadata: {
      contentType: "application/json; charset=utf-8"
    }
  });
}

export async function loadJson(bucket, key) {
  const object = await bucket.get(key);
  if (!object) {
    return null;
  }
  return object.json();
}

export function isAuthorized(request, secret) {
  if (!secret) {
    return true;
  }
  const authHeader = request.headers.get("authorization") || "";
  return authHeader === `Bearer ${secret}`;
}

export function shouldDelete(createdAt, mode, retentionHours) {
  const createdMs = new Date(createdAt).getTime();
  if (Number.isNaN(createdMs)) {
    return true;
  }

  if (mode === "age") {
    return Date.now() - createdMs > retentionHours * 60 * 60 * 1000;
  }

  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });

  return formatter.format(new Date(createdMs)) !== formatter.format(new Date());
}
