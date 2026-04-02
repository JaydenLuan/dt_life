const form = document.getElementById("generatorForm");
const titleInput = document.getElementById("titleInput");
const descriptionInput = document.getElementById("descriptionInput");
const timeInput = document.getElementById("timeInput");
const productImageInput = document.getElementById("productImageInput");
const detailImageInput = document.getElementById("detailImageInput");
const productPreview = document.getElementById("productPreview");
const detailPreview = document.getElementById("detailPreview");
const submitButton = document.getElementById("submitButton");
const statusText = document.getElementById("statusText");
const resultCard = document.getElementById("resultCard");
const shareLinkInput = document.getElementById("shareLinkInput");
const copyButton = document.getElementById("copyButton");

function previewFile(input, target) {
  const [file] = input.files || [];
  if (!file) {
    target.style.backgroundImage = "";
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    target.style.backgroundImage = `url("${reader.result}")`;
  };
  reader.readAsDataURL(file);
}

productImageInput.addEventListener("change", () => {
  previewFile(productImageInput, productPreview);
});

detailImageInput.addEventListener("change", () => {
  previewFile(detailImageInput, detailPreview);
});

copyButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(shareLinkInput.value);
    copyButton.textContent = "已复制";
    window.setTimeout(() => {
      copyButton.textContent = "复制链接";
    }, 1600);
  } catch (error) {
    statusText.textContent = "复制失败，请手动长按或复制输入框内容。";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const productImage = productImageInput.files && productImageInput.files[0];
  const detailImage = detailImageInput.files && detailImageInput.files[0];

  if (!productImage || !detailImage) {
    statusText.textContent = "请先选择商品图片和商品详情长图。";
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "生成中...";
  statusText.textContent = "正在直传图片并生成分享链接...";

  try {
    const formData = new FormData();
    formData.append("title", titleInput.value.trim());
    formData.append("description", descriptionInput.value.trim());
    formData.append("time", timeInput.value.trim());
    formData.append("productImage", productImage);
    formData.append("detailImage", detailImage);

    const response = await fetch("/api/create-share", {
      method: "POST",
      body: formData
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "生成失败");
    }

    shareLinkInput.value = result.shareUrl;
    resultCard.hidden = false;
    statusText.textContent = "链接已生成，可以直接分享。";
  } catch (error) {
    statusText.textContent = `生成失败：${error.message}`;
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "生成分享链接";
  }
});
