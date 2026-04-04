const { Pool } = require('pg');
const { generateAIMessage } = require('./ai');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── TABLA ─────────────────────────────────────────────────────────────────────
pool.query(`
    CREATE TABLE IF NOT EXISTS traduccion_config (
        guild_id    VARCHAR(255),
        channel_id  VARCHAR(255),
        target_lang VARCHAR(10) DEFAULT 'es',
        enabled     BOOLEAN DEFAULT true,
        PRIMARY KEY (guild_id, channel_id)
    )
`).catch(err => console.error('Error creando traduccion_config:', err.message));

// ── CACHÉ en memoria para no consultar la BD en cada mensaje ─────────────────
// guild_id → Map(channel_id → { target_lang, enabled })
const configCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
let lastCacheRefresh = 0;

async function refreshCache() {
    const now = Date.now();
    if (now - lastCacheRefresh < CACHE_TTL) return;
    lastCacheRefresh = now;

    const res = await pool.query('SELECT * FROM traduccion_config WHERE enabled = true');
    configCache.clear();
    for (const row of res.rows) {
        if (!configCache.has(row.guild_id)) configCache.set(row.guild_id, new Map());
        configCache.get(row.guild_id).set(row.channel_id, { target_lang: row.target_lang, enabled: row.enabled });
    }
}

async function getChannelConfig(guildId, channelId) {
    await refreshCache();
    return configCache.get(guildId)?.get(channelId) || null;
}

async function getGuildChannels(guildId) {
    const res = await pool.query(
        'SELECT * FROM traduccion_config WHERE guild_id = $1',
        [guildId]
    );
    return res.rows;
}

async function addChannel(guildId, channelId, targetLang = 'es') {
    await pool.query(`
        INSERT INTO traduccion_config (guild_id, channel_id, target_lang, enabled)
        VALUES ($1, $2, $3, true)
        ON CONFLICT (guild_id, channel_id) DO UPDATE SET target_lang = $3, enabled = true
    `, [guildId, channelId, targetLang]);
    lastCacheRefresh = 0; // forzar refresh
}

async function removeChannel(guildId, channelId) {
    await pool.query(
        'DELETE FROM traduccion_config WHERE guild_id = $1 AND channel_id = $2',
        [guildId, channelId]
    );
    lastCacheRefresh = 0;
}

async function removeAllChannels(guildId) {
    await pool.query('DELETE FROM traduccion_config WHERE guild_id = $1', [guildId]);
    lastCacheRefresh = 0;
}

// ── TRADUCCIÓN ────────────────────────────────────────────────────────────────

const LANG_NAMES = {
    es: 'Español', en: 'Inglés', pt: 'Portugués', fr: 'Francés',
    de: 'Alemán',  it: 'Italiano', ja: 'Japonés', ko: 'Coreano',
    zh: 'Chino',   ru: 'Ruso',    ar: 'Árabe',   nl: 'Holandés',
};

async function translateMessage(text, targetLang) {
    const langName = LANG_NAMES[targetLang] || targetLang;
    const prompt = `Traduce el siguiente mensaje al ${langName}. Responde SOLO con la traducción, sin explicaciones, sin comillas, sin texto extra:\n\n${text}`;
    const translated = await generateAIMessage(prompt, 500);
    return translated?.trim() || null;
}

async function detectLanguage(text) {
    const prompt = `Detecta el idioma del siguiente texto y responde SOLO con el código ISO 639-1 de 2 letras (ej: es, en, pt, fr, de, it, ja, ko, zh, ru, ar). Sin explicaciones:\n\n${text}`;
    const detected = await generateAIMessage(prompt, 10);
    return detected?.trim().toLowerCase().slice(0, 5) || null;
}

module.exports = {
    getChannelConfig,
    getGuildChannels,
    addChannel,
    removeChannel,
    removeAllChannels,
    translateMessage,
    detectLanguage,
    LANG_NAMES,
};
