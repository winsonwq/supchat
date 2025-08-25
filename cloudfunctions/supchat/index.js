// index.js
exports.main = async (event, context) => {
  const { entry } = await import('./entry.mjs');
  return entry(event, context);
};