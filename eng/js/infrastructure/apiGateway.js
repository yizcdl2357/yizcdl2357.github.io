window.ApiGateway = (() => ({
  get: (path) => ApiClient.get(path),
  post: (path, body) => ApiClient.post(path, body),
  del: (path) => ApiClient.del(path)
}))();
