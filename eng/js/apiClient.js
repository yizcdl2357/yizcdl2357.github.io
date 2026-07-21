const ApiClient = (() => {
  const baseUrl = window.API_BASE_URL || "";
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
      return offline();
    }

    const data = await response.json().catch(() => offline());
    if (data.offline || (response.status === 404 && path.startsWith("/api/"))) {
      return offline();
    }

    if (!response.ok && data.ok !== false) {
      return { ok: false, message: data.message || "请求失败" };
    }
    return data;
  }

  function offline() {
    return { ok: false, offline: true, message: offlineMessage };
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
