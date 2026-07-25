const ParagraphService = (() => {
  async function createParagraph(data) {
    const result = await ClientFacades.corpus.create(data);
    return result.allowLocalFallback ? createParagraphLocal(data) : result;
  }

  async function getParagraphById(id) {
    const result = await ClientFacades.corpus.get(id);
    if (result.allowLocalFallback) return getParagraphByIdLocal(id);
    return result.ok ? result.paragraph : null;
  }

  async function getParagraphsByTheme(theme) {
    const result = await ClientFacades.corpus.list(`?theme=${encodeURIComponent(theme)}`);
    if (result.allowLocalFallback) return getParagraphsByThemeLocal(theme);
    return result.ok ? result.paragraphs : [];
  }

  async function getParagraphsByUser() {
    const result = await ClientFacades.corpus.listMine();
    if (result.allowLocalFallback) return getParagraphsByUserLocal(AuthService.getCurrentUser()?.id);
    return result.ok ? result.paragraphs : [];
  }

  async function getRecentParagraphs(limit) {
    const result = await ClientFacades.corpus.list();
    const paragraphs = result.allowLocalFallback
      ? getRecentParagraphsLocal()
      : result.ok ? result.paragraphs : [];
    return limit ? paragraphs.slice(0, limit) : paragraphs;
  }

  async function deleteParagraph(id) {
    const result = await ClientFacades.corpus.delete(id);
    return result.allowLocalFallback ? deleteParagraphLocal(id) : result;
  }

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
    return {
      ...paragraph,
      themeName: getThemeName(paragraph),
      tagNames: getTagNames(paragraph.tags || []),
      collectionCount: CollectionService.getCollectionCountLocal
        ? CollectionService.getCollectionCountLocal(paragraph.id)
        : paragraph.collectionCount || 0
    };
  }

  function sortNewest(paragraphs) {
    return [...paragraphs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  function createParagraphLocal(data) {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) return { ok: false, message: "请先登录" };
    if (!data.content.trim()) return { ok: false, message: "请输入语段内容" };
    if (!normalizeTheme(data.theme)) return { ok: false, message: "请填写作文主题" };
    if (data.content.trim().length < 5) return { ok: false, message: "语段内容过短" };

    const now = new Date().toISOString();
    const paragraph = {
      id: `paragraph-${Date.now()}`,
      content: data.content.trim(),
      authorId: currentUser.id,
      authorName: currentUser.username,
      theme: normalizeTheme(data.theme),
      tags: data.tags || [],
      createdAt: now,
      updatedAt: now
    };

    const paragraphs = Storage.getParagraphs();
    paragraphs.push(paragraph);
    Storage.saveParagraphs(paragraphs);
    return { ok: true, message: "上传成功", paragraph: enrich(paragraph) };
  }

  function getParagraphByIdLocal(id) {
    const paragraph = Storage.getParagraphs().find((item) => item.id === id);
    return paragraph ? enrich(paragraph) : null;
  }

  function getParagraphsByThemeLocal(theme) {
    const cleanTheme = normalizeTheme(theme).toLowerCase();
    return sortNewest(Storage.getParagraphs().filter((item) => {
      return getThemeName(item).toLowerCase().includes(cleanTheme);
    })).map(enrich);
  }

  function getParagraphsByUserLocal(userId) {
    return sortNewest(Storage.getParagraphs().filter((item) => item.authorId === userId)).map(enrich);
  }

  function getRecentParagraphsLocal() {
    return sortNewest(Storage.getParagraphs()).map(enrich);
  }

  function deleteParagraphLocal(id) {
    const paragraphs = Storage.getParagraphs();
    const next = paragraphs.filter((item) => item.id !== id);
    Storage.saveParagraphs(next);
    CollectionService.removeCollectionsByParagraph(id);
    return { ok: true, message: "删除成功" };
  }

  return {
    createParagraph,
    getParagraphById,
    getParagraphsByTheme,
    getParagraphsByUser,
    getRecentParagraphs,
    deleteParagraph,
    getParagraphByIdLocal,
    getRecentParagraphsLocal
  };
})();
