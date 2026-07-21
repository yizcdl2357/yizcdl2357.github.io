const SearchService = (() => {
  async function search(keyword, theme, tagIds) {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword.trim());
    if (theme) params.set("theme", theme.trim());
    if (tagIds && tagIds.length > 0) params.set("tags", tagIds.join(","));

    const query = params.toString();
    const result = await ApiClient.get(`/api/paragraphs${query ? `?${query}` : ""}`);
    if (result.offline) return searchLocal(keyword, theme, tagIds);
    return result.ok ? result.paragraphs : [];
  }

  function filterByTheme(theme) {
    return search("", theme, []);
  }

  function filterByTags(tags) {
    return search("", "", tags);
  }

  function getRecentParagraphs() {
    return search("", "", []);
  }

  function sortByCollectionCount() {
    return getRecentParagraphs();
  }

  function getThemeName(paragraph) {
    if (paragraph.theme) return paragraph.theme;

    const legacyTheme = THEMES.find((theme) => theme.id === paragraph.themeId);
    return legacyTheme?.name || "";
  }

  function searchLocal(keyword, theme, tagIds) {
    const cleanKeyword = keyword.trim().toLowerCase();
    const cleanTheme = theme.trim().toLowerCase();
    const selectedTags = tagIds || [];

    const result = Storage.getParagraphs().filter((paragraph) => {
      const matchesKeyword = !cleanKeyword ||
        paragraph.content.toLowerCase().includes(cleanKeyword);

      const matchesTheme = !cleanTheme || getThemeName(paragraph).toLowerCase().includes(cleanTheme);
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tagId) => (paragraph.tags || []).includes(tagId));

      return matchesKeyword && matchesTheme && matchesTags;
    });

    return result
      .map((paragraph) => ParagraphService.getParagraphByIdLocal(paragraph.id))
      .filter(Boolean)
      .sort(sortByCollectionCountThenNewest);
  }

  function sortByCollectionCountThenNewest(a, b) {
    if (b.collectionCount !== a.collectionCount) return b.collectionCount - a.collectionCount;
    return new Date(b.createdAt) - new Date(a.createdAt);
  }

  return { search, filterByTheme, filterByTags, getRecentParagraphs, sortByCollectionCount };
})();
