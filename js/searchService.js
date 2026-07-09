const SearchService = (() => {
  function getThemeName(paragraph) {
    if (paragraph.theme) return paragraph.theme;

    const legacyTheme = THEMES.find((theme) => theme.id === paragraph.themeId);
    return legacyTheme?.name || "";
  }

  function search(keyword, theme, tagIds) {
    const cleanKeyword = keyword.trim().toLowerCase();
    const cleanTheme = theme.trim().toLowerCase();
    const selectedTags = tagIds || [];

    const result = Storage.getParagraphs().filter((paragraph) => {
      const matchesKeyword = !cleanKeyword ||
        paragraph.title.toLowerCase().includes(cleanKeyword) ||
        paragraph.content.toLowerCase().includes(cleanKeyword);

      const matchesTheme = !cleanTheme || getThemeName(paragraph).toLowerCase().includes(cleanTheme);
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every((tagId) => paragraph.tags.includes(tagId));

      return matchesKeyword && matchesTheme && matchesTags;
    });

    return result
      .map((paragraph) => ParagraphService.getParagraphById(paragraph.id))
      .filter(Boolean)
      .sort(sortByCollectionCountThenNewest);
  }

  function filterByTheme(theme) {
    return search("", theme, []);
  }

  function filterByTags(tags) {
    return search("", "", tags);
  }

  function getRecentParagraphs() {
    return ParagraphService.getRecentParagraphs().sort(sortByCollectionCountThenNewest);
  }

  function sortByCollectionCount() {
    return getRecentParagraphs();
  }

  function sortByCollectionCountThenNewest(a, b) {
    if (b.collectionCount !== a.collectionCount) return b.collectionCount - a.collectionCount;
    return new Date(b.createdAt) - new Date(a.createdAt);
  }

  return { search, filterByTheme, filterByTags, getRecentParagraphs, sortByCollectionCount };
})();
