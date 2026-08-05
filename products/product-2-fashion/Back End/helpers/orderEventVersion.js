/**
 * Order Event Version — lightweight change-detection counter.
 *
 * An in-memory counter that increments whenever an order-related mutation
 * occurs (creation, status change, webhook update, refund, assignment, etc.).
 *
 * The admin panel polls GET /admin/orders/event-version every ~30 s.
 * If the version hasn't changed since the last poll, the panel skips
 * the expensive order-list / count queries entirely.
 *
 * Zero-cost: pure memory read / increment — no DB involved.
 * Resets to 0 on server restart (admin panel treats any change as "dirty").
 */

'use strict';

let _version = 0;

/**
 * Returns the current event version (pure memory read, ~0 ms).
 * @returns {number}
 */
exports.getOrderEventVersion = () => _version;

/**
 * Increment the counter.  Call this after any successful order-mutating
 * operation (order create, status update, webhook, refund, assignment, …).
 */
exports.bumpOrderEventVersion = () => {
  _version = _version >= Number.MAX_SAFE_INTEGER ? 1 : _version + 1;
};
