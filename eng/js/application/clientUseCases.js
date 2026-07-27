window.ClientUseCases = (() => ({
  identity: {
    current: () => ApiGateway.get("/api/auth/me"),
    register: (username, password) => ApiGateway.post("/api/auth/register", { username, password }),
    login: (username, password) => ApiGateway.post("/api/auth/login", { username, password }),
    logout: () => ApiGateway.post("/api/auth/logout")
  },
  corpus: {
    create: (data) => ApiGateway.post("/api/paragraphs", ClientDomain.paragraphDraft(data)),
    get: (id) => ApiGateway.get(`/api/paragraphs/${encodeURIComponent(id)}`),
    listMine: () => ApiGateway.get("/api/me/paragraphs"),
    list: (query = "") => ApiGateway.get(`/api/paragraphs${query}`),
    delete: (id) => ApiGateway.del(`/api/paragraphs/${encodeURIComponent(id)}`)
  },
  moderation: {
    next: () => ApiGateway.get("/api/reviews/next"),
    update: (id, data) => ApiGateway.patch(`/api/reviews/${encodeURIComponent(id)}`, data),
    approve: (id, expectedVersion) => ApiGateway.post(`/api/reviews/${encodeURIComponent(id)}/approve`, { expectedVersion }),
    reject: (id, expectedVersion, reason) => ApiGateway.post(`/api/reviews/${encodeURIComponent(id)}/reject`, { expectedVersion, reason })
  },
  collection: {
    listMine: () => ApiGateway.get("/api/me/collections"),
    count: (id) => ApiGateway.get(`/api/paragraphs/${encodeURIComponent(id)}/collections`),
    collect: (id) => ApiGateway.post(`/api/paragraphs/${encodeURIComponent(id)}/collections`),
    uncollect: (id) => ApiGateway.del(`/api/paragraphs/${encodeURIComponent(id)}/collections`)
  }
}))();
