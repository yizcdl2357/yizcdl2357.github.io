function goToPage(page) {
  if ((page === "upload" || page === "profile" || page === "collections") && !AuthService.getCurrentUser()) {
    UI.showPage("login");
    UI.showMessage("loginMessage", "请先登录");
    return;
  }

  if (page === "home") UI.renderHome();
  if (page === "corpus") UI.renderCorpus();
  if (page === "profile" && !UI.renderProfile()) return;
  if (page === "collections" && !UI.renderCollections()) return;

  UI.showPage(page);
}

function bindNavigation() {
  document.body.addEventListener("click", (event) => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton) {
      goToPage(pageButton.dataset.page);
      return;
    }

    const themeButton = event.target.closest(".theme-search");
    if (themeButton) {
      UI.$("searchTheme").value = themeButton.dataset.theme;
      UI.renderCorpus(SearchService.filterByTheme(themeButton.dataset.theme));
      UI.showPage("corpus");
      return;
    }

    const detailButton = event.target.closest(".paragraph-detail-link");
    if (detailButton) {
      openParagraphDetail(detailButton.dataset.paragraphId);
      return;
    }

    if (event.target.id === "toggleCollectionButton") {
      toggleCollection(event.target.dataset.paragraphId);
      return;
    }

    if (event.target.id === "logoutButton") {
      AuthService.logout();
      UI.renderAuthArea();
      UI.showPage("login");
      UI.showMessage("loginMessage", "已退出登录", true);
    }
  });

  document.body.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;

    const detailCard = event.target.closest(".paragraph-detail-link");
    if (!detailCard) return;

    event.preventDefault();
    openParagraphDetail(detailCard.dataset.paragraphId);
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

  UI.$("registerForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const result = AuthService.register(
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

  UI.$("loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const result = AuthService.login(
      UI.$("loginUsername").value,
      UI.$("loginPassword").value
    );

    UI.showMessage("loginMessage", result.message, result.ok);
    if (result.ok) {
      UI.$("loginForm").reset();
      UI.renderAuthArea();
      goToPage("home");
    }
  });

  UI.$("uploadForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const result = ParagraphService.createParagraph({
      title: UI.$("paragraphTitle").value,
      content: UI.$("paragraphContent").value,
      theme: UI.$("paragraphTheme").value,
      tags: UI.getCheckedValues("uploadTags")
    });

    if (!result.ok && result.message === "请先登录") {
      goToPage("login");
      UI.showMessage("loginMessage", result.message);
      return;
    }

    UI.showMessage("uploadMessage", result.message, result.ok);
    if (result.ok) {
      UI.resetUploadForm();
      UI.renderHome();
      UI.renderCorpus();
      setTimeout(() => openParagraphDetail(result.paragraph.id), 500);
    }
  });

  UI.$("searchForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const result = SearchService.search(
      UI.$("searchKeyword").value,
      UI.$("searchTheme").value,
      UI.getCheckedValues("searchTags")
    );
    UI.renderCorpus(result);
  });
}

async function recognizeImageText() {
  const file = UI.$("ocrImageInput").files[0];
  const button = UI.$("recognizeImageButton");

  if (!file) {
    UI.showMessage("ocrMessage", "请先选择或拍摄图片");
    return;
  }

  if (!window.Tesseract) {
    UI.showMessage("ocrMessage", "文字识别库加载失败，请检查网络后重试");
    return;
  }

  button.disabled = true;
  UI.showMessage("ocrMessage", "正在识别文字，首次使用可能需要稍等...", true);

  try {
    const result = await Tesseract.recognize(file, "eng", {
      logger: (status) => {
        if (status.status === "recognizing text") {
          const progress = Math.round(status.progress * 100);
          UI.showMessage("ocrMessage", `正在识别文字：${progress}%`, true);
        }
      }
    });
    const text = result.data.text.replace(/\n{3,}/g, "\n\n").trim();

    if (!text) {
      UI.showMessage("ocrMessage", "没有识别到文字，请换一张更清晰的图片");
      return;
    }

    UI.$("paragraphContent").value = text;
    UI.showMessage("ocrMessage", "识别完成，文字已填入语段内容。", true);
  } catch (error) {
    UI.showMessage("ocrMessage", "识别失败，请换一张更清晰的图片或稍后重试");
  } finally {
    button.disabled = false;
  }
}

function openParagraphDetail(paragraphId) {
  if (UI.renderParagraphDetail(paragraphId)) {
    UI.showPage("detail");
  }
}

function toggleCollection(paragraphId) {
  const currentUser = AuthService.getCurrentUser();
  if (!currentUser) {
    UI.showPage("login");
    UI.showMessage("loginMessage", "请先登录");
    return;
  }

  CollectionService.toggleCollection(currentUser.id, paragraphId);
  UI.updateDetailCollectionState(paragraphId);
  UI.renderHome();
  UI.renderCorpus();
  if (AuthService.getCurrentUser()) {
    UI.renderProfile();
    UI.renderCollections();
  }
}

function initializeApp() {
  Storage.initialize();
  UI.renderTagOptions("uploadTags", "uploadTags");
  UI.renderTagOptions("searchTags", "searchTags");
  UI.renderAuthArea();
  UI.renderHome();
  UI.renderCorpus();
  bindNavigation();
  bindForms();
}

document.addEventListener("DOMContentLoaded", initializeApp);
