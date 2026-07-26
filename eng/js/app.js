let userEditedTheme = false;
let themeDetectionTimer = null;
let autoSuggestedTheme = "";

async function goToPage(page) {
  if ((page === "upload" || page === "profile" || page === "collections") && !AuthService.getCurrentUser()) {
    UI.showPage("login");
    UI.showMessage("loginMessage", "请先登录");
    return;
  }

  if (page === "home") await UI.renderHome();
  if (page === "corpus") await UI.renderCorpus();
  if (page === "profile" && !await UI.renderProfile()) return;
  if (page === "collections" && !await UI.renderCollections()) return;

  UI.showPage(page);
}

function bindNavigation() {
  document.body.addEventListener("click", async (event) => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      await goToPage(pageButton.dataset.page);
      return;
    }

    const themeButton = event.target.closest(".theme-search");
    if (themeButton) {
      UI.$("searchTheme").value = themeButton.dataset.theme;
      await UI.renderCorpus(await SearchService.filterByTheme(themeButton.dataset.theme));
      UI.showPage("corpus");
      return;
    }

    if (event.target.id === "toggleCollectionButton") {
      await toggleCollection(event.target.dataset.paragraphId);
      return;
    }

    const deleteButton = event.target.closest(".delete-paragraph-button");
    if (deleteButton) {
      await deleteMyParagraph(deleteButton.dataset.paragraphId);
      return;
    }

    const detailButton = event.target.closest(".paragraph-detail-link");
    if (detailButton) {
      await openParagraphDetail(detailButton.dataset.paragraphId);
      return;
    }

    if (event.target.id === "logoutButton") {
      await AuthService.logout();
      UI.renderAuthArea();
      UI.showPage("login");
      UI.showMessage("loginMessage", "已退出登录", true);
    }
  });

  document.body.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const detailCard = event.target.closest(".paragraph-detail-link");
    if (!detailCard) return;

    event.preventDefault();
    await openParagraphDetail(detailCard.dataset.paragraphId);
  });
}

function bindForms() {
  UI.$("ocrImageInput").addEventListener("change", () => {
    const file = UI.$("ocrImageInput").files[0];
    const preview = UI.$("ocrPreview");

    if (!file) {
      preview.hidden = true;
      preview.removeAttribute("src");
      UI.showMessage("ocrMessage", "");
      return;
    }

    preview.src = URL.createObjectURL(file);
    preview.hidden = false;
    UI.showMessage("ocrMessage", "图片已选择，可以开始识别。", true);
  });

  UI.$("recognizeImageButton").addEventListener("click", recognizeImageText);

  UI.$("paragraphTheme").addEventListener("input", () => {
    userEditedTheme = UI.$("paragraphTheme").value.trim() !== autoSuggestedTheme;
    if (userEditedTheme) autoSuggestedTheme = "";
    UI.$("themeSuggestionMessage").textContent = "";
  });

  UI.$("paragraphContent").addEventListener("input", () => {
    window.clearTimeout(themeDetectionTimer);
    themeDetectionTimer = window.setTimeout(() => {
      applyThemeSuggestion(userEditedTheme);
    }, 500);
  });

  UI.$("registerForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await AuthService.register(
      UI.$("registerUsername").value,
      UI.$("registerPassword").value
    );

    UI.showMessage("registerMessage", result.message, result.ok);
    if (result.ok) {
      UI.$("registerForm").reset();
      UI.showPage("login");
      UI.showMessage("loginMessage", "注册成功，请登录", true);
    }
  });

  UI.$("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await AuthService.login(
      UI.$("loginUsername").value,
      UI.$("loginPassword").value
    );

    UI.showMessage("loginMessage", result.message, result.ok);
    if (result.ok) {
      UI.$("loginForm").reset();
      UI.renderAuthArea();
      await CollectionService.refreshMyCollections();
      await goToPage("home");
    }
  });

  UI.$("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await ParagraphService.createParagraph({
      content: UI.$("paragraphContent").value,
      theme: UI.$("paragraphTheme").value,
      tags: UI.getCheckedValues("uploadTags")
    });

    if (!result.ok && result.message === "请先登录") {
      await goToPage("login");
      UI.showMessage("loginMessage", result.message);
      return;
    }

    UI.showMessage("uploadMessage", result.message, result.ok);
    if (result.ok) {
      UI.resetUploadForm();
      userEditedTheme = false;
      autoSuggestedTheme = "";
      UI.$("themeSuggestionMessage").textContent = "";
      await UI.renderHome();
      await UI.renderCorpus();
      window.setTimeout(() => openParagraphDetail(result.paragraph.id), 500);
    }
  });

  UI.$("searchForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const result = await SearchService.search(
      UI.$("searchKeyword").value,
      UI.$("searchTheme").value,
      UI.getCheckedValues("searchTags")
    );
    await UI.renderCorpus(result);
  });
}

function applyThemeSuggestion(userEditedTheme) {
  if (userEditedTheme && UI.$("paragraphTheme").value.trim()) return;

  const result = ThemeService.detectTheme(UI.$("paragraphContent").value);
  const message = UI.$("themeSuggestionMessage");

  if (!result.ok) {
    if (!userEditedTheme || UI.$("paragraphTheme").value.trim() === autoSuggestedTheme) {
      UI.$("paragraphTheme").value = "";
      autoSuggestedTheme = "";
    }
    message.textContent = result.message;
    return;
  }

  UI.$("paragraphTheme").value = result.theme;
  autoSuggestedTheme = result.theme;
  userEditedTheme = false;
  message.textContent = result.message;
}

async function recognizeImageText() {
  const file = UI.$("ocrImageInput").files[0];
  const button = UI.$("recognizeImageButton");

  if (!file) {
    UI.showMessage("ocrMessage", "请先选择或拍摄图片");
    return;
  }

  if (!window.Tesseract && !(await loadTesseractScript())) {
    UI.showMessage("ocrMessage", "文字识别库加载失败，请检查网络后重试");
    return;
  }

  button.disabled = true;
  UI.showMessage("ocrMessage", "正在预处理图片，首次使用可能需要稍等...", true);

  try {
    const result = await recognizeWithMultipleAngles(file);
    const text = cleanOcrText(result.text);

    if (!text) {
      UI.showMessage("ocrMessage", "没有识别到文字，请换一张更清晰的图片");
      return;
    }

    UI.$("paragraphContent").value = text;
    applyThemeSuggestion(userEditedTheme);
    UI.showMessage("ocrMessage", "识别完成，文字已填入语段内容。", true);
  } catch (error) {
    UI.showMessage("ocrMessage", "识别失败，请换一张更清晰的图片或稍后重试");
  } finally {
    button.disabled = false;
  }
}

let tesseractLoadPromise;
function loadTesseractScript() {
  if (window.Tesseract) return Promise.resolve(true);
  if (tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
  return tesseractLoadPromise;
}

async function recognizeWithMultipleAngles(file) {
  const angles = [0, -35, -30, -25, -20, -15, 15, 20, 25, 30, 35];
  let bestResult = { text: "", confidence: -1 };

  for (let index = 0; index < angles.length; index += 1) {
    const angle = angles[index];
    UI.showMessage("ocrMessage", `正在识别文字：尝试角度 ${index + 1}/${angles.length}`, true);

    const image = await preprocessImage(file, angle);
    const result = await Tesseract.recognize(image, "eng", {
      tessedit_pageseg_mode: "7",
      tessedit_char_whitelist: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789,.!?;:'\"-() ",
      logger: (status) => {
        if (status.status === "recognizing text") {
          const progress = Math.round(status.progress * 100);
          UI.showMessage("ocrMessage", `正在识别文字：${index + 1}/${angles.length}，${progress}%`, true);
        }
      }
    });

    const text = cleanOcrText(result.data.text);
    const confidence = scoreOcrResult(text, result.data.confidence);
    if (confidence > bestResult.confidence) {
      bestResult = { text, confidence };
    }
  }

  return bestResult;
}

async function preprocessImage(file, angle) {
  const bitmap = await loadBitmap(file);
  const scale = Math.max(2, Math.min(4, 1600 / Math.max(bitmap.width, bitmap.height)));
  const radians = angle * Math.PI / 180;
  const width = Math.ceil(bitmap.width * scale);
  const height = Math.ceil(bitmap.height * scale);
  const rotatedWidth = Math.ceil(Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians)));
  const rotatedHeight = Math.ceil(Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians)));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = rotatedWidth;
  canvas.height = rotatedHeight;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(radians);
  context.drawImage(bitmap, -width / 2, -height / 2, width, height);

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const enhanced = gray < 180 ? Math.max(0, gray - 55) : Math.min(255, gray + 35);
    const value = enhanced < 185 ? 0 : 255;
    data[index] = value;
    data[index + 1] = value;
    data[index + 2] = value;
  }

  context.putImageData(imageData, 0, 0);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

async function loadBitmap(file) {
  if (window.createImageBitmap) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
}

function cleanOcrText(text) {
  return text
    .replace(/[|\\[\]{}~`_*<>]/g, "")
    .replace(/\s+([,.!?;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function scoreOcrResult(text, confidence) {
  const letters = (text.match(/[A-Za-z]/g) || []).length;
  const words = (text.match(/[A-Za-z]{2,}/g) || []).length;
  const punctuation = (text.match(/[,.!?]/g) || []).length;
  return confidence + letters * 2 + words * 8 + punctuation * 3;
}

async function openParagraphDetail(paragraphId) {
  if (await UI.renderParagraphDetail(paragraphId)) {
    UI.showPage("detail");
  }
}

async function toggleCollection(paragraphId) {
  const currentUser = AuthService.getCurrentUser();
  if (!currentUser) {
    UI.showPage("login");
    UI.showMessage("loginMessage", "请先登录");
    return;
  }

  await CollectionService.toggleCollection(currentUser.id, paragraphId);
  await UI.updateDetailCollectionState(paragraphId);
  await UI.renderHome();
  await UI.renderCorpus();
  if (AuthService.getCurrentUser()) {
    await UI.renderProfile();
    await UI.renderCollections();
  }
}

async function deleteMyParagraph(paragraphId) {
  const currentUser = AuthService.getCurrentUser();
  const paragraph = await ParagraphService.getParagraphById(paragraphId);
  if (!currentUser || !paragraph || paragraph.authorId !== currentUser.id) return;
  if (!window.confirm("确定删除该语段吗？")) return;

  await ParagraphService.deleteParagraph(paragraphId);
  await UI.renderProfile();
  await UI.renderHome();
  await UI.renderCorpus();
  await UI.renderCollections();
}

async function initializeApp() {
  Storage.initialize();
  const authPromise = AuthService.initialize();
  const homePromise = UI.renderHome();
  UI.renderTagOptions("uploadTags", "uploadTags");
  UI.renderTagOptions("searchTags", "searchTags");
  UI.renderAuthArea();
  bindNavigation();
  bindForms();
  await authPromise;
  if (AuthService.getCurrentUser()) await CollectionService.refreshMyCollections();
  UI.renderAuthArea();
  await homePromise;
}

document.addEventListener("DOMContentLoaded", () => {
  initializeApp().catch((error) => {
    console.error(error);
    UI.$("homeRecentList").innerHTML = `<div class="empty">后端服务暂时不可用，请稍后重试。</div>`;
  });
});
