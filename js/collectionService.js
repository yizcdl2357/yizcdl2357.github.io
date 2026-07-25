const CollectionService = (() => {
  const collectedParagraphIds = new Set();
  const collectionCounts = new Map();

  async function refreshMyCollections() {
    const result = await ClientFacades.collection.listMine();
    if (result.allowLocalFallback) return getCollectionsByUserLocal(AuthService.getCurrentUser()?.id);

    collectedParagraphIds.clear();
    if (result.ok) {
      result.paragraphs.forEach((paragraph) => {
        collectedParagraphIds.add(paragraph.id);
        collectionCounts.set(paragraph.id, paragraph.collectionCount || 0);
      });
    }
    return result.ok ? result.paragraphs : [];
  }

  async function getCollectionCount(paragraphId) {
    const result = await ClientFacades.collection.count(paragraphId);
    const count = result.allowLocalFallback
      ? getCollectionCountLocal(paragraphId)
      : result.ok ? result.collectionCount : 0;
    collectionCounts.set(paragraphId, count);
    return count;
  }

  function isCollected(userId, paragraphId) {
    return Boolean(userId) && (collectedParagraphIds.has(paragraphId) || isCollectedLocal(userId, paragraphId));
  }

  async function collectParagraph(userId, paragraphId) {
    if (!userId) return { ok: false, message: "请先登录" };
    const result = await ClientFacades.collection.collect(paragraphId);
    if (result.allowLocalFallback) return collectParagraphLocal(userId, paragraphId);
    if (result.ok) {
      collectedParagraphIds.add(paragraphId);
      collectionCounts.set(paragraphId, result.collectionCount || 0);
    }
    return result;
  }

  async function uncollectParagraph(userId, paragraphId) {
    if (!userId) return { ok: false, message: "请先登录" };
    const result = await ClientFacades.collection.uncollect(paragraphId);
    if (result.allowLocalFallback) return uncollectParagraphLocal(userId, paragraphId);
    if (result.ok) {
      collectedParagraphIds.delete(paragraphId);
      collectionCounts.set(paragraphId, result.collectionCount || 0);
    }
    return result;
  }

  async function toggleCollection(userId, paragraphId) {
    return isCollected(userId, paragraphId)
      ? uncollectParagraph(userId, paragraphId)
      : collectParagraph(userId, paragraphId);
  }

  async function getCollectionsByUser(userId) {
    if (!userId) return [];
    return refreshMyCollections();
  }

  function getCollectionCountLocal(paragraphId) {
    return Storage.getCollections().filter((collection) => collection.paragraphId === paragraphId).length;
  }

  function isCollectedLocal(userId, paragraphId) {
    if (!userId) return false;
    return Storage.getCollections().some((collection) => {
      return collection.userId === userId && collection.paragraphId === paragraphId;
    });
  }

  function collectParagraphLocal(userId, paragraphId) {
    if (!userId) return { ok: false, message: "请先登录" };
    if (isCollectedLocal(userId, paragraphId)) {
      return {
        ok: true,
        collected: true,
        collectionCount: getCollectionCountLocal(paragraphId),
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
    collectedParagraphIds.add(paragraphId);

    return {
      ok: true,
      collected: true,
      collectionCount: getCollectionCountLocal(paragraphId),
      message: "收藏成功"
    };
  }

  function uncollectParagraphLocal(userId, paragraphId) {
    if (!userId) return { ok: false, message: "请先登录" };

    const next = Storage.getCollections().filter((collection) => {
      return !(collection.userId === userId && collection.paragraphId === paragraphId);
    });
    Storage.saveCollections(next);
    collectedParagraphIds.delete(paragraphId);

    return {
      ok: true,
      collected: false,
      collectionCount: getCollectionCountLocal(paragraphId),
      message: "已取消收藏"
    };
  }

  function getCollectionsByUserLocal(userId) {
    if (!userId) return [];

    collectedParagraphIds.clear();
    const collectedIds = Storage.getCollections()
      .filter((collection) => collection.userId === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((collection) => collection.paragraphId);

    const paragraphs = collectedIds
      .map((paragraphId) => ParagraphService.getParagraphByIdLocal(paragraphId))
      .filter(Boolean)
      .map((paragraph) => ({
        ...paragraph,
        collectionCount: getCollectionCountLocal(paragraph.id)
      }));

    paragraphs.forEach((paragraph) => collectedParagraphIds.add(paragraph.id));
    return paragraphs;
  }

  function removeCollectionsByParagraph(paragraphId) {
    const next = Storage.getCollections().filter((collection) => collection.paragraphId !== paragraphId);
    Storage.saveCollections(next);
    collectedParagraphIds.delete(paragraphId);
  }

  return {
    collectParagraph,
    uncollectParagraph,
    toggleCollection,
    isCollected,
    getCollectionCount,
    getCollectionCountLocal,
    getCollectionsByUser,
    refreshMyCollections,
    removeCollectionsByParagraph
  };
})();
