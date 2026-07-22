const { pool } = require('../config/db');

async function logEvent(instanceId, eventType, detail = null) {
    try {
        await pool.query(
            'INSERT INTO instance_events (instance_id, event_type, detail) VALUES ($1, $2, $3)',
            [instanceId, eventType, detail ? JSON.stringify(detail) : null]
        );
    } catch (err) {
        console.error('[trialEvents]', err.message);
    }
}

module.exports = { logEvent };
