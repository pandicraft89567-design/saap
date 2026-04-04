const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── TABLAS ────────────────────────────────────────────────────────────────────
pool.query(`
    CREATE TABLE IF NOT EXISTS antiraid_config (
        guild_id        VARCHAR(255) PRIMARY KEY,
        enabled         BOOLEAN DEFAULT false,
        threshold       INTEGER DEFAULT 5,
        timewindow      INTEGER DEFAULT 10,
        action          VARCHAR(50) DEFAULT 'kick',
        log_channel_id  VARCHAR(255) DEFAULT NULL
    )
`).catch(err => console.error('Error creando antiraid_config:', err.message));

// ── CACHÉ EN MEMORIA (rastrea entradas recientes por servidor) ─────────────────
// guild_id → [timestamps de entrada]
const joinCache = new Map();

// ── FUNCIONES DE CONFIGURACIÓN ────────────────────────────────────────────────

async function getAntiRaidConfig(guildId) {
    const res = await pool.query(
        'SELECT * FROM antiraid_config WHERE guild_id = $1',
        [guildId]
    );
    return res.rows[0] || null;
}

async function setAntiRaidEnabled(guildId, enabled) {
    await pool.query(`
        INSERT INTO antiraid_config (guild_id, enabled)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE SET enabled = $2
    `, [guildId, enabled]);
}

async function setAntiRaidSettings(guildId, { threshold, timewindow, action, log_channel_id }) {
    await pool.query(`
        INSERT INTO antiraid_config (guild_id, threshold, timewindow, action, log_channel_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (guild_id) DO UPDATE SET
            threshold       = COALESCE($2, antiraid_config.threshold),
            timewindow      = COALESCE($3, antiraid_config.timewindow),
            action          = COALESCE($4, antiraid_config.action),
            log_channel_id  = COALESCE($5, antiraid_config.log_channel_id)
    `, [guildId, threshold, timewindow, action, log_channel_id]);
}

async function setAntiRaidLogChannel(guildId, channelId) {
    await pool.query(`
        INSERT INTO antiraid_config (guild_id, log_channel_id)
        VALUES ($1, $2)
        ON CONFLICT (guild_id) DO UPDATE SET log_channel_id = $2
    `, [guildId, channelId]);
}

// ── DETECCIÓN DE RAID ─────────────────────────────────────────────────────────

/**
 * Registra una nueva entrada y devuelve cuántas hubo en la ventana de tiempo.
 * @param {string} guildId
 * @param {number} timewindow - segundos
 * @returns {number} cantidad de entradas en la ventana
 */
function registerJoin(guildId, timewindow) {
    const now  = Date.now();
    const cutoff = now - timewindow * 1000;

    if (!joinCache.has(guildId)) joinCache.set(guildId, []);
    const joins = joinCache.get(guildId);

    // Filtrar timestamps viejos
    const recent = joins.filter(ts => ts > cutoff);
    recent.push(now);
    joinCache.set(guildId, recent);

    return recent.length;
}

function clearJoinCache(guildId) {
    joinCache.delete(guildId);
}

module.exports = {
    getAntiRaidConfig,
    setAntiRaidEnabled,
    setAntiRaidSettings,
    setAntiRaidLogChannel,
    registerJoin,
    clearJoinCache,
};
