(function (root) {
  "use strict";

  function extensionContextAlive(scope = root) {
    try {
      const runtime = scope.chrome && scope.chrome.runtime;
      return Boolean(runtime && runtime.id);
    } catch (error) {
      return false;
    }
  }

  function isExtensionContextInvalidatedError(error) {
    return /extension context invalidated/i.test(String(error?.message || error || ""));
  }

  const api = { extensionContextAlive, isExtensionContextInvalidatedError };
  root.XrcExtensionContext = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
