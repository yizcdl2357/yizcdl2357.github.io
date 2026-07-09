const AuthService = (() => {
  function normalizeUsername(username) {
    return username.trim();
  }

  function hashPassword(password) {
    return btoa(unescape(encodeURIComponent(password)));
  }

  function findByUsername(username) {
    const normalized = normalizeUsername(username);
    return Storage.getUsers().find((user) => user.username === normalized);
  }

  function register(username, password) {
    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername) return { ok: false, message: "请输入用户名" };
    if (!password) return { ok: false, message: "请输入密码" };
    if (findByUsername(cleanUsername)) return { ok: false, message: "用户名已被使用" };

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

  function login(username, password) {
    const cleanUsername = normalizeUsername(username);

    if (!cleanUsername) return { ok: false, message: "请输入用户名" };
    if (!password) return { ok: false, message: "请输入密码" };

    const user = findByUsername(cleanUsername);
    if (!user || user.passwordHash !== hashPassword(password)) {
      return { ok: false, message: "用户名或密码错误" };
    }

    Storage.setCurrentUserId(user.id);
    return { ok: true, message: "登录成功", user };
  }

  function logout() {
    Storage.clearCurrentUserId();
    return { ok: true, message: "已退出登录" };
  }

  function getCurrentUser() {
    const id = Storage.getCurrentUserId();
    if (!id) return null;
    return Storage.getUsers().find((user) => user.id === id) || null;
  }

  return { register, login, logout, getCurrentUser };
})();
