window.ClientDomain = (() => {
  function normalizeTheme(theme) {
    return String(theme || "").trim();
  }

  function paragraphDraft(data) {
    return {
      content: String(data.content || "").trim(),
      theme: normalizeTheme(data.theme),
      tags: [...new Set(data.tags || [])]
    };
  }

  return { normalizeTheme, paragraphDraft };
})();
