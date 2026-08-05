const { pool } = require('../config/db');
const storage = require('./storage');

/**
 * Collect every media URL stored on a product row (thumbnail + gallery).
 */
function collectProductMediaUrls(product) {
  const urls = [];
  if (product?.thumbnail) urls.push(String(product.thumbnail));

  let images = product?.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = {}; }
  }
  if (images && typeof images === 'object') {
    for (const list of [images.admin, images.shop]) {
      if (Array.isArray(list)) {
        for (const u of list) {
          if (u) urls.push(String(u));
        }
      }
    }
  }
  return [...new Set(urls.map((u) => u.trim()).filter(Boolean))];
}

/**
 * Match media_assets by exact URL or by /uploads/... suffix (relative vs absolute).
 */
async function findMediaRowsByUrl(url) {
  if (!url) return [];
  const trimmed = String(url).trim();
  const uploadsIdx = trimmed.indexOf('/uploads/');
  const suffix = uploadsIdx >= 0 ? trimmed.slice(uploadsIdx) : null;

  if (suffix) {
    const { rows } = await pool.query(
      `SELECT id, url, storage_key FROM media_assets
       WHERE url = $1 OR url LIKE $2 OR url = $3`,
      [trimmed, `%${suffix}`, suffix]
    );
    return rows;
  }

  const { rows } = await pool.query(
    'SELECT id, url, storage_key FROM media_assets WHERE url = $1',
    [trimmed]
  );
  return rows;
}

/**
 * Delete media_assets rows + storage objects for the given URLs (best-effort).
 * External (Unsplash etc.) URLs are ignored when no media_assets row exists.
 */
async function deleteMediaByUrls(urls) {
  const list = [...new Set((urls || []).map((u) => String(u || '').trim()).filter(Boolean))];
  let deleted = 0;
  for (const url of list) {
    const rows = await findMediaRowsByUrl(url);
    for (const row of rows) {
      await storage.deleteKey(row.storage_key);
      await pool.query('DELETE FROM media_assets WHERE id = $1', [row.id]);
      deleted += 1;
    }
  }
  return deleted;
}

/**
 * After a product update, remove files that are no longer referenced.
 */
async function cleanupOrphanedProductMedia(beforeProduct, afterProduct) {
  const before = new Set(collectProductMediaUrls(beforeProduct));
  const after = new Set(collectProductMediaUrls(afterProduct));
  const removed = [...before].filter((u) => !after.has(u));
  if (!removed.length) return 0;
  return deleteMediaByUrls(removed);
}

/**
 * When a product is deleted, drop every tracked upload for it.
 */
async function cleanupAllProductMedia(product) {
  return deleteMediaByUrls(collectProductMediaUrls(product));
}

/**
 * Attach owner_id on media rows that match the URLs we just saved.
 */
async function linkMediaToProduct(productId, urls) {
  const list = [...new Set((urls || []).map((u) => String(u || '').trim()).filter(Boolean))];
  for (const url of list) {
    const rows = await findMediaRowsByUrl(url);
    for (const row of rows) {
      await pool.query(
        `UPDATE media_assets
         SET owner_type = 'product', owner_id = $1
         WHERE id = $2`,
        [productId, row.id]
      );
    }
  }
}

module.exports = {
  collectProductMediaUrls,
  findMediaRowsByUrl,
  deleteMediaByUrls,
  cleanupOrphanedProductMedia,
  cleanupAllProductMedia,
  linkMediaToProduct,
};
