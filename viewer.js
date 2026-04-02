const tabs = document.querySelectorAll(".tab");
const orderList = document.getElementById("orderList");
const emptyState = document.getElementById("emptyState");
const bannerText = document.getElementById("bannerText");
const cardTemplate = document.getElementById("orderCardTemplate");

let currentTab = "all";
let shareData = null;

function getShareId() {
  const url = new URL(window.location.href);
  return url.searchParams.get("share");
}

function buildCard(data) {
  const fragment = cardTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".order-card");
  const title = fragment.querySelector(".order-name");
  const description = fragment.querySelector(".order-description");
  const time = fragment.querySelector(".order-time");
  const image = fragment.querySelector(".order-image");

  title.textContent = data.title || "未命名商品";
  description.textContent = data.description || "";
  time.textContent = data.time || "None";
  image.style.backgroundImage = data.productImageUrl ? `url("${data.productImageUrl}")` : "";

  card.addEventListener("click", () => {
    if (currentTab === "unused") {
      window.location.href = `/detail/${encodeURIComponent(data.shareId)}`;
    }
  });

  return fragment;
}

function updateCardState(card, tabType) {
  const statusElement = card.querySelector(".order-status");
  const mask = card.querySelector(".order-mask");

  if (tabType === "all") {
    statusElement.textContent = "已支付";
    statusElement.className = "order-status status-all";
    mask.classList.add("is-hidden");
    return;
  }

  if (tabType === "unused") {
    statusElement.textContent = "";
    statusElement.className = "order-status status-unused";
    mask.classList.remove("is-hidden");
    return;
  }

  statusElement.textContent = "";
  statusElement.className = `order-status status-${tabType}`;
  mask.classList.remove("is-hidden");
}

function filterOrders(tabType) {
  const cards = orderList.querySelectorAll(".order-card");
  let hasOrders = false;

  cards.forEach((card) => {
    card.style.display = "none";
    updateCardState(card, tabType);
  });

  if (tabType === "all" || tabType === "unused") {
    cards.forEach((card) => {
      card.style.display = "block";
      hasOrders = true;
    });
  }

  emptyState.classList.toggle("is-active", !hasOrders);
}

function setActiveTab(tabType) {
  currentTab = tabType;
  tabs.forEach((tab) => {
    tab.classList.toggle("is-active", tab.dataset.tab === tabType);
  });
  filterOrders(tabType);
}

async function loadShare() {
  const shareId = getShareId();
  if (!shareId) {
    bannerText.textContent = "缺少分享参数，无法加载内容。";
    emptyState.classList.add("is-active");
    return;
  }

  try {
    const response = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`);
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "加载失败");
    }

    shareData = result.share;
    orderList.innerHTML = "";
    orderList.appendChild(buildCard(shareData));
    bannerText.textContent = "点击“未使用”后，再点商品卡片可查看详情长图。";
    setActiveTab("all");
  } catch (error) {
    bannerText.textContent = `加载失败：${error.message}`;
    emptyState.classList.add("is-active");
  }
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    setActiveTab(tab.dataset.tab);
  });
});

loadShare();
