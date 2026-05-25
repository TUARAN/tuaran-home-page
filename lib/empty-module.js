// Stub used by next.config.js to replace Node-only modules in browser builds.
// pptxgenjs only touches these on server-side code paths it doesn't reach in
// our usage, so an empty default export is safe.
module.exports = {}
module.exports.default = module.exports
module.exports.promises = {}
