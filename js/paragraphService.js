const ParagraphService = (() => {
  function normalizeTheme(theme) {
    return (theme || "").trim();
  }

  function getThemeName(paragraph) {
    if (paragraph.theme) return paragraph.theme;

    const legacyTheme = THEMES.find((theme) => theme.id === paragraph.themeId);
    return legacyTheme?.name || "未分类";
  }

  function getTagNames(tagIds) {
    return tagIds.map((id) => TAGS.find((tag) => tag.id === id)?.name || id);
  }

  function enrich(paragraph) {
    const collectionCount = typeof CollectionService === "undefined"
      ? paragraph.collectionCount || 0
      : CollectionService.getCollectionCount(paragraph.id);

    return {
      ...paragraph,
      themeName: getThemeName(paragraph),
      tagNames: getTagNames(paragraph.tags || []),
      collectionCount
    };
  }

  function sortNewest(paragraphs) {
    return [...paragraphs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function createParagraph(data) {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return { ok: false, message: "请先登录" };
    if (!data.title.trim()) return { ok: false, message: "请输入标题" };
    if (!data.content.trim()) return { ok: false, message: "请输入语段内容" };
    if (!normalizeTheme(data.theme)) return { ok: false, message: "请填写作文主题" };
    if (data.content.trim().length < 5) return { ok: false, message: "语段内容过短" };

    const now = new Date().toISOString();
    const paragraph = {
      id: `paragraph-${Date.now()}`,
      title: data.title.trim(),
      content: data.content.trim(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      theme: normalizeTheme(data.theme),
      tags: data.tags,
      createdAt: now,
      updatedAt: now
    };

    const paragraphs = Storage.getParagraphs();
    paragraphs.push(paragraph);
    Storage.saveParagraphs(paragraphs);
    return { ok: true, message: "上传成功", paragraph: enrich(paragraph) };
  }

  function getParagraphById(id) {
    const paragraph = Storage.getParagraphs().find((item) => item.id === id);
    return paragraph ? enrich(paragraph) : null;
  }

  function getParagraphsByTheme(theme) {
    const cleanTheme = normalizeTheme(theme).toLowerCase();
    return sortNewest(Storage.getParagraphs().filter((item) => {
      return getThemeName(item).toLowerCase().includes(cleanTheme);
    })).map(enrich);
  }

  function getParagraphsByUser(userId) {
    return sortNewest(Storage.getParagraphs().filter((item) => item.authorId === userId)).map(enrich);
  }

  function getRecentParagraphs(limit) {
    const paragraphs = sortNewest(Storage.getParagraphs()).map(enrich);
    return limit ? paragraphs.slice(0, limit) : paragraphs;
  }

  function updateParagraph(updatedParagraph) {
    const paragraphs = Storage.getParagraphs();
    const index = paragraphs.findIndex((item) => item.id === updatedParagraph.id);
    if (index === -1) return { ok: false, message: "语段不存在" };

    paragraphs[index] = { ...paragraphs[index], ...updatedParagraph, updatedAt: new Date().toISOString() };
    Storage.saveParagraphs(paragraphs);
    return { ok: true, message: "更新成功", paragraph: enrich(paragraphs[index]) };
  }

  function deleteParagraph(id) {
    const paragraphs = Storage.getParagraphs();
    const next = paragraphs.filter((item) => item.id !== id);
    Storage.saveParagraphs(next);
    return { ok: true, message: "删除成功" };
  }

  return {
    createParagraph,
    getParagraphById,
    getParagraphsByTheme,
    getParagraphsByUser,
    getRecentParagraphs,
    updateParagraph,
    deleteParagraph
  };
})();
