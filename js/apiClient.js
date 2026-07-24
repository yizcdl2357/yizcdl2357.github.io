const ApiClient = (() => {
  const configuredBaseUrl = window.API_BASE_URL || window.APP_CONFIG?.API_BASE_URL || "";
  const baseUrl = configuredBaseUrl.replace(/\/$/, "");
  const offlineMessage = "后端服务暂时不可用，已切换到本地演示数据";

  async function request(path, options = {}) {
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
    return request(path, { method: "POST", body: JSON.stringify(body) });
  }

  function del(path) {
    return request(path, { method: "DELETE" });
  }

  return { get, post, del };
})();
