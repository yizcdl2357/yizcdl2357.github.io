const UI = (() => {
  const pageMap = {
    home: "homePage",
    login: "loginPage",
    register: "registerPage",
    upload: "uploadPage",
    corpus: "corpusPage",
    profile: "profilePage",
    collections: "collectionPage",
    detail: "paragraphDetailPage"
  };

  function $(id) {
    return document.getElementById(id);
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  function showPage(name) {
    document.querySelectorAll(".page").forEach((page) => page.classList.remove("active"));
    $(pageMap[name]).classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function showMessage(id, message, isSuccess = false) {
    const element = $(id);
    element.textContent = message;
    element.classList.toggle("success", isSuccess);
  }

  function renderAuthArea() {
    const currentUser = AuthService.getCurrentUser();
    const area = $("authArea");

    if (!currentUser) {
      area.innerHTML = `
        <button data-page="login" type="button">登录</button>
        <button data-page="register" type="button">注册</button>
      `;
      return;
    }

    area.innerHTML = `
      <button data-page="profile" type="button">${currentUser.username}</button>
      <button id="logoutButton" type="button">登出</button>
    `;
  }

  function renderTagOptions(containerId, name) {
    const container = $(containerId);
    container.innerHTML = TAGS.map((tag) => `
      <label>
        <input type="checkbox" name="${name}" value="${tag.id}">
        ${tag.name}
      </label>
    `).join("");
  }

  function getCheckedValues(name) {
    return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((item) => item.value);
  }

  function renderFeaturedThemes() {
    const themeCounts = ParagraphService.getRecentParagraphs()
      .reduce((counts, paragraph) => {
        counts[paragraph.themeName] = (counts[paragraph.themeName] || 0) + 1;
        return counts;
      }, {});

    const themes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    if (themes.length === 0) {
      $("featuredThemes").innerHTML = `<div class="empty">暂无主题。</div>`;
      return;
    }

    $("featuredThemes").innerHTML = themes.map(([themeName, count]) => `
      <article class="theme-card">
        <h3>${themeName}</h3>
        <p class="muted">${count} 条语段</p>
        <button class="secondary theme-search" data-theme="${themeName}" type="button">查看语段</button>
      </article>
    `).join("");
  }

  function renderParagraphList(containerId, paragraphs, emptyText) {
    const container = $(containerId);

    if (paragraphs.length === 0) {
      container.innerHTML = `<div class="empty">${emptyText}</div>`;
      return;
    }

    container.innerHTML = paragraphs.map((paragraph) => `
      <article class="paragraph-card paragraph-detail-link" data-paragraph-id="${paragraph.id}" role="button" tabindex="0">
        <div class="meta">
          <span>${paragraph.themeName}</span>
          <span>${formatDate(paragraph.createdAt)}</span>
          <span>上传者：${paragraph.authorName}</span>
          <span>收藏：${paragraph.collectionCount || 0}</span>
        </div>
        <h3>${paragraph.title}</h3>
        <p class="paragraph-content">${paragraph.content}</p>
        <div class="meta">
          ${paragraph.tagNames.map((name) => `<span class="tag">${name}</span>`).join("")}
        </div>
      </article>
    `).join("");
  }

  function renderParagraphDetail(paragraphId) {
    const paragraph = ParagraphService.getParagraphById(paragraphId);
    const container = $("paragraphDetail");

    if (!paragraph) {
      container.innerHTML = `<div class="empty">没有找到这个语段。</div>`;
      return false;
    }

    const currentUser = AuthService.getCurrentUser();
    const isCollected = currentUser
      ? CollectionService.isCollected(currentUser.id, paragraph.id)
      : false;

    container.innerHTML = `
      <article class="detail-card">
        <div class="meta">
          <span>${paragraph.themeName}</span>
          <span>${formatDate(paragraph.createdAt)}</span>
          <span>上传者：${paragraph.authorName}</span>
          <span>收藏：<strong id="detailCollectionCount">${paragraph.collectionCount || 0}</strong></span>
        </div>
        <h1>${paragraph.title}</h1>
        <div class="meta">
          ${paragraph.tagNames.map((name) => `<span class="tag">${name}</span>`).join("")}
        </div>
        <p class="detail-content">${paragraph.content}</p>
        <div class="detail-actions">
          <button class="primary" id="toggleCollectionButton" data-paragraph-id="${paragraph.id}" type="button">
            ${isCollected ? "取消收藏" : "收藏"}
          </button>
          <span class="count-pill">收藏数 ${paragraph.collectionCount || 0}</span>
        </div>
      </article>
    `;
    return true;
  }

  function renderHome() {
    const recent = ParagraphService.getRecentParagraphs(3);
    $("homeRecentList").innerHTML = recent.map((paragraph) => `
      <article class="compact-item paragraph-detail-link" data-paragraph-id="${paragraph.id}" role="button" tabindex="0">
        <strong>${paragraph.title}</strong>
        <p class="muted">${paragraph.themeName} · ${paragraph.tagNames.join("、") || "无标签"}</p>
      </article>
    `).join("");
    renderFeaturedThemes();
  }

  function renderCorpus(paragraphs = SearchService.getRecentParagraphs()) {
    $("resultSummary").textContent = paragraphs.length > 0
      ? `共找到 ${paragraphs.length} 条语段`
      : "没有匹配的语段";
    renderParagraphList("corpusList", paragraphs, "暂无匹配结果，可以换个关键词或主题试试。");
  }

  function renderProfile() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return false;

    $("profileUsername").textContent = currentUser.username;
    $("profileCreatedAt").textContent = `注册时间：${formatDate(currentUser.createdAt)}`;
    renderParagraphList(
      "profileList",
      ParagraphService.getParagraphsByUser(currentUser.id),
      "你还没有上传语段。"
    );
    return true;
  }

  function renderCollections() {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return false;

    renderParagraphList(
      "collectionList",
      CollectionService.getCollectionsByUser(currentUser.id),
      "你还没有收藏语段。"
    );
    return true;
  }

  function updateDetailCollectionState(paragraphId) {
    const currentUser = AuthService.getCurrentUser();
    const isCollected = currentUser
      ? CollectionService.isCollected(currentUser.id, paragraphId)
      : false;
    const count = CollectionService.getCollectionCount(paragraphId);
    const button = $("toggleCollectionButton");
    const countElement = $("detailCollectionCount");

    if (button) button.textContent = isCollected ? "取消收藏" : "收藏";
    if (countElement) countElement.textContent = count;
    document.querySelectorAll(".count-pill").forEach((item) => {
      item.textContent = `收藏数 ${count}`;
    });
  }

  function resetUploadForm() {
    $("uploadForm").reset();
  }

  return {
    $,
    showPage,
    showMessage,
    renderAuthArea,
    renderTagOptions,
    getCheckedValues,
    renderHome,
    renderCorpus,
    renderProfile,
    renderCollections,
    renderParagraphDetail,
    updateDetailCollectionState,
    resetUploadForm
  };
})();
