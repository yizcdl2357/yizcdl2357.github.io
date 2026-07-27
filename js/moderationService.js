const ModerationService = (() => ({
  next: () => ClientFacades.moderation.next(),
  update: (id, data) => ClientFacades.moderation.update(id, data),
  approve: (id, version) => ClientFacades.moderation.approve(id, version),
  reject: (id, version, reason) => ClientFacades.moderation.reject(id, version, reason)
}))();
