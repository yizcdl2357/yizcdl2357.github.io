const CollectionService = (() => {
  function getCollectionCount(paragraphId) {
    return Storage.getCollections().filter((collection) => collection.paragraphId === paragraphId).length;
  }

  function isCollected(userId, paragraphId) {
    if (!userId) return false;
    return Storage.getCollections().some((collection) => {
      return collection.userId === userId && collection.paragraphId === paragraphId;
    });
  }

  function collectParagraph(userId, paragraphId) {
    if (!userId) return { ok: false, message: "请先登录" };
    if (isCollected(userId, paragraphId)) {
      return {
        ok: true,
        collected: true,
        collectionCount: getCollectionCount(paragraphId),
        message: "已收藏"
      };
    }

    const collections = Storage.getCollections();
    collections.push({
      id: `collection-${Date.now()}`,
      userId,
      paragraphId,
      createdAt: new Date().toISOString()
    });
    Storage.saveCollections(collections);

    return {
      ok: true,
      collected: true,
      collectionCount: getCollectionCount(paragraphId),
      message: "收藏成功"
    };
  }

  function uncollectParagraph(userId, paragraphId) {
    if (!userId) return { ok: false, message: "请先登录" };

    const next = Storage.getCollections().filter((collection) => {
      return !(collection.userId === userId && collection.paragraphId === paragraphId);
    });
    Storage.saveCollections(next);

    return {
      ok: true,
      collected: false,
      collectionCount: getCollectionCount(paragraphId),
      message: "已取消收藏"
    };
  }

  function toggleCollection(userId, paragraphId) {
    return isCollected(userId, paragraphId)
      ? uncollectParagraph(userId, paragraphId)
      : collectParagraph(userId, paragraphId);
  }

  function attachCollectionCounts(paragraphs) {
    return paragraphs.map((paragraph) => ({
      ...paragraph,
      collectionCount: getCollectionCount(paragraph.id)
    }));
  }

  function sortByCollectionCount(paragraphs) {
    return attachCollectionCounts(paragraphs).sort((a, b) => {
      if (b.collectionCount !== a.collectionCount) return b.collectionCount - a.collectionCount;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
  }

  function getCollectionsByUser(userId) {
    if (!userId) return [];

    const collectedIds = Storage.getCollections()
      .filter((collection) => collection.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((collection) => collection.paragraphId);

    const paragraphs = collectedIds
      .map((paragraphId) => ParagraphService.getParagraphById(paragraphId))
      .filter(Boolean);

    return attachCollectionCounts(paragraphs);
  }

  function removeCollectionsByParagraph(paragraphId) {
    const next = Storage.getCollections().filter((collection) => collection.paragraphId !== paragraphId);
    Storage.saveCollections(next);
  }

  return {
    collectParagraph,
    uncollectParagraph,
    toggleCollection,
    isCollected,
    getCollectionCount,
    getCollectionsByUser,
    removeCollectionsByParagraph,
    attachCollectionCounts,
    sortByCollectionCount
  };
})();
