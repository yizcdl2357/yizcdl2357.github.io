const ApiClient = (() => {
  const configuredBaseUrl = window.API_BASE_URL || window.APP_CONFIG?.API_BASE_URL || "";
  const baseUrl = configuredBaseUrl.replace(/\/$/, "");
  const readCache = new Map();
  const readTtlMs = 15000;
  const offlineMessage = "后端服务暂时不可用，已切换到本地演示数据";

  async function request(path, options = {}) {
    const method = (options.method || "GET").toUpperCase();
    const cacheable = method === "GET" && /^\/api\/paragraphs(?:$|\?)/.test(path) && !path.includes("/collections");
    const cacheKey = `${baseUrl}${path}`;
    if (cacheable) {
      const cached = readCache.get(cacheKey);
      if (cached?.promise) return cached.promise;
      if (cached && cached.expiresAt > Date.now()) return cached.value;
    }
    const requestPromise = requestUncached(path, options);
    if (cacheable) {
      readCache.set(cacheKey, { promise: requestPromise, expiresAt: Date.now() + readTtlMs });
      try {
        const value = await requestPromise;
        if (value?.ok === true) {
          readCache.set(cacheKey, { value, expiresAt: Date.now() + readTtlMs });
        } else {
          readCache.delete(cacheKey);
        }
        return value;
      } catch (error) {
        readCache.delete(cacheKey);
        throw error;
      }
    }
    return requestPromise;
  }

  async function requestUncached(path, options = {}) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        },
        ...options
      });
    } catch {
      return unavailable();
    }

    const data = await response.json().catch(() => ({ ok: false, message: "服务响应格式错误" }));
    if (response.status === 404 && path.startsWith("/api/") && !baseUrl) {
      return unavailable();
    }

    if (!response.ok && data.ok !== false) {
      return { ok: false, message: data.message || "请求失败" };
    }
    return data;
  }

  function unavailable() {
    return {
      ok: false,
      offline: true,
      allowLocalFallback: !baseUrl,
      message: baseUrl ? "云端服务暂时不可用，请稍后重试" : offlineMessage
    };
  }

  function get(path) {
    return request(path);
  }

  function post(path, body = {}) {
    return request(path, { method: "POST", body: JSON.stringify(body) }).finally(() => {
      if (path.startsWith("/api/paragraphs")) invalidateParagraphReads();
    });
  }

  function del(path) {
    return request(path, { method: "DELETE" }).finally(() => {
      if (path.startsWith("/api/paragraphs")) invalidateParagraphReads();
    });
  }

  function patch(path, body = {}) {
    return request(path, { method: "PATCH", body: JSON.stringify(body) }).finally(invalidateParagraphReads);
  }

  function invalidateParagraphReads() {
    for (const key of readCache.keys()) {
      if (key.includes("/api/paragraphs")) readCache.delete(key);
    }
  }

  return { get, post, patch, del, invalidateParagraphReads };
})();
