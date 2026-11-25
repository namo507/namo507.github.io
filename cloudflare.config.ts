export default {
  worker: {
    name: "portfolio",
    compatibilityDate: "2026-11-17",
    workersDev: true,
    previewUrls: false,
    assets: {
      htmlHandling: "auto-trailing-slash",
      notFoundHandling: "404-page",
    },
    observability: {
      enabled: true,
      logs: { enabled: true },
      traces: { enabled: true },
    },
  },
};
