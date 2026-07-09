const Storage = (() => {
  const keys = {
    users: "englishCorpus.users",
    paragraphs: "englishCorpus.paragraphs",
    collections: "englishCorpus.collections",
    currentUserId: "englishCorpus.currentUserId"
  };

  function read(key, fallback) {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function initialize() {
    if (!localStorage.getItem(keys.users)) {
      write(keys.users, []);
    }

    if (!localStorage.getItem(keys.paragraphs)) {
      write(keys.paragraphs, SAMPLE_PARAGRAPHS);
    }

    if (!localStorage.getItem(keys.collections)) {
      write(keys.collections, []);
    }
  }

  return {
    initialize,
    getUsers: () => read(keys.users, []),
    saveUsers: (users) => write(keys.users, users),
    getParagraphs: () => read(keys.paragraphs, []),
    saveParagraphs: (paragraphs) => write(keys.paragraphs, paragraphs),
    getCollections: () => read(keys.collections, []),
    saveCollections: (collections) => write(keys.collections, collections),
    getCurrentUserId: () => localStorage.getItem(keys.currentUserId),
    setCurrentUserId: (id) => localStorage.setItem(keys.currentUserId, id),
    clearCurrentUserId: () => localStorage.removeItem(keys.currentUserId)
  };
})();
