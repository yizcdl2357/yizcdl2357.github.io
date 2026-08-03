const ModerationService = (() => ({
  next: () => ClientFacades.moderation.next(),
  update: (id, data) => ClientFacades.moderation.update(id, data),
  approve: (id, data) => ClientFacades.moderation.approve(id, data),
  reject: (id, version, reason) => ClientFacades.moderation.reject(id, version, reason)
}))();
