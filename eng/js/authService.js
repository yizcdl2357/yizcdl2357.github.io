const AuthService = (() => {
  let currentUser = null;

  async function initialize() {
    const result = await ApiClient.get("/api/auth/me");
    currentUser = result.allowLocalFallback ? getLocalCurrentUser() : result.user || null;
    return currentUser;
  }

  async function register(username, password) {
    const result = await ApiClient.post("/api/auth/register", { username, password });
    return result.allowLocalFallback ? registerLocal(username, password) : result;
  }

  async function login(username, password) {
    const result = await ApiClient.post("/api/auth/login", { username, password });
    if (result.allowLocalFallback) return loginLocal(username, password);
    if (result.ok) currentUser = result.user;
    return result;
  }

  async function logout() {
    const result = await ApiClient.post("/api/auth/logout");
    if (result.allowLocalFallback) return logoutLocal();
    currentUser = null;
    return result;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function normalizeUsername(username) {
    return username.trim();
  }

  function hashPassword(password) {
    return btoa(unescape(encodeURIComponent(password)));
  }

  function findLocalUserByUsername(username) {
    const normalized = normalizeUsername(username);
    return Storage.getUsers().find((user) => user.username === normalized);
  }

  function registerLocal(username, password) {
    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername) return { ok: false, message: "请输入用户名" };
    if (!password) return { ok: false, message: "请输入密码" };
    if (findLocalUserByUsername(cleanUsername)) return { ok: false, message: "用户名已被使用" };

    const users = Storage.getUsers();
    const user = {
      id: `user-${Date.now()}`,
      username: cleanUsername,
      passwordHash: hashPassword(password),
      createdAt: new Date().toISOString()
    };

    users.push(user);
    Storage.saveUsers(users);
    return { ok: true, message: "注册成功，请登录", user };
  }

  function loginLocal(username, password) {
    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername) return { ok: false, message: "请输入用户名" };
    if (!password) return { ok: false, message: "请输入密码" };

    const user = findLocalUserByUsername(cleanUsername);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, message: "用户名或密码错误" };
    }

    Storage.setCurrentUserId(user.id);
    currentUser = user;
    return { ok: true, message: "登录成功", user };
  }

  function logoutLocal() {
    Storage.clearCurrentUserId();
    currentUser = null;
    return { ok: true, message: "已退出登录" };
  }

  function getLocalCurrentUser() {
    const id = Storage.getCurrentUserId();
    if (!id) return null;
    return Storage.getUsers().find((user) => user.id === id) || null;
  }

  return { initialize, register, login, logout, getCurrentUser };
})();
