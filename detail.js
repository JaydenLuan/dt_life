const detailTitle = document.getElementById("detailTitle");
const detailDescription = document.getElementById("detailDescription");
const detailImage = document.getElementById("detailImage");
const backLink = document.getElementById("backLink");

function getShareIdFromPath() {
  const url = new URL(window.location.href);
  return url.searchParams.get("share");
}

async function loadDetail() {
  const shareId = getShareIdFromPath();
  if (!shareId) {
    detailDescription.textContent = "缺少分享参数，无法加载详情。";
    return;
  }

  backLink.href = `/share/${encodeURIComponent(shareId)}`;

  try {
    const response = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "加载失败");
    }

    const share = result.share;
    detailTitle.textContent = share.title || "商品详情";
    detailDescription.textContent = share.description || "暂无详情说明";
    detailImage.src = share.detailImageUrl || "";
    detailImage.alt = share.title || "商品详情长图";
  } catch (error) {
    detailDescription.textContent = `加载失败：${error.message}`;
  }
}

loadDetail();
