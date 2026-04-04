const { Pool } = require('pg');
const { generateAIMessage } = require('./ai');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── TABLAS ────────────────────────────────────────────────────────────────────
pool.query(`
    CREATE TABLE IF NOT EXISTS automod_settings (
        guild_id       VARCHAR(255) PRIMARY KEY,
        enabled        BOOLEAN DEFAULT true,
        log_channel_id VARCHAR(255) DEFAULT NULL,
        discord_rule_id TEXT DEFAULT NULL
    )
`).catch(err => console.error('Error creando automod_settings:', err.message));

pool.query(`ALTER TABLE automod_settings ADD COLUMN IF NOT EXISTS log_channel_id VARCHAR(255) DEFAULT NULL`).catch(() => {});
pool.query(`ALTER TABLE automod_settings ADD COLUMN IF NOT EXISTS discord_rule_id TEXT DEFAULT NULL`).catch(() => {});

pool.query(`
    CREATE TABLE IF NOT EXISTS automod_infractions (
        guild_id         VARCHAR(255),
        user_id          VARCHAR(255),
        count            INTEGER DEFAULT 0,
        last_infraction  TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (guild_id, user_id)
    )
`).catch(err => console.error('Error creando automod_infractions:', err.message));

pool.query(`
    CREATE TABLE IF NOT EXISTS automod_rules (
        guild_id    VARCHAR(255),
        infractions INTEGER,
        action      VARCHAR(50),
        duration    INTEGER DEFAULT 0,
        PRIMARY KEY (guild_id, infractions)
    )
`).catch(err => console.error('Error creando automod_rules:', err.message));

// ── LISTA DE MALAS PALABRAS ────────────────────────────────────────────────────
const BAD_WORDS = [
    // ── ESPAÑOL ──
    'puta', 'puto', 'putas', 'putos', 'putita', 'putitas',
    'mierda', 'mierdas',
    'coño', 'cono', 'coños',
    'hostia', 'hostias',
    'gilipollas',
    'cabron', 'cabrón', 'cabrona', 'cabrones',
    'joder',
    'capullo', 'capullos',
    'imbecil', 'imbécil', 'imbeciles', 'imbéciles',
    'chingar', 'chingas', 'chingada', 'chingado', 'chinga', 'chinguen',
    'pendejo', 'pendeja', 'pendejos', 'pendejas',
    'culero', 'culera', 'culeros',
    'maricon', 'maricón', 'maricones',
    'pinche', 'pinches',
    'verga', 'vergon', 'vergas',
    'mamahuevo', 'mamagüevo',
    'hdp', 'hijodeputa', 'hijo de puta', 'hija de puta',
    'perra', 'perras',
    'zorra', 'zorras',
    'estupido', 'estúpido', 'estupida', 'estúpida', 'estupidos',
    'idiotas',
    'concha', 'conchas',
    'carajo', 'carajos',
    'cojones', 'cojon',
    'mamada', 'mamadas',
    'wey pendejo', 'buey pendejo',
    'culiao', 'culiado', 'culiada',
    'huevon', 'huevona', 'güevon', 'guevon',
    'marica', 'maricas',
    'gonorrea',
    'malparido', 'malparida',
    'hp', 'hpta',
    'mondá', 'monda',
    'nojoda',
    'mecago',
    'tu madre', 'tu puta madre', 'a tu madre', 'la puta madre', 'me cago en tu madre',
    'maldicion', 'maldición', 'maldiciones',
    'culo', 'culos',
    'idiota',
    'cagada', 'cagadas', 'cagar', 'caga', 'cagaste', 'me cago',
    'chupame', 'chúpame', 'chupate', 'chupala',
    'ojete', 'ojetes',
    'mamaguevo', 'comehuevo',
    'singao', 'singada',
    'recochina', 'recochinamente',
    'la chingada', 'vete a la chingada',
    'panocha', 'chocha',
    'culito', 'nalgas',
    'puta vida', 'que puta',
    'vete a la mierda', 'que se joda',
    'chinga tu madre',

    // ── ENGLISH ──
    'fuck', 'fucked', 'fucker', 'fucking', 'fucks', 'fuckhead',
    'shit', 'shits', 'shitty', 'bullshit',
    'bitch', 'bitches', 'bitching',
    'asshole', 'assholes',
    'bastard', 'bastards',
    'cunt', 'cunts',
    'dick', 'dicks', 'dickhead',
    'faggot', 'faggots', 'fag',
    'nigger', 'niggers', 'nigga', 'niggas',
    'whore', 'whores',
    'slut', 'sluts',
    'pussy', 'pussies',
    'cock', 'cocks',
    'motherfucker', 'motherfucking', 'mofo',
    'dumbass', 'jackass', 'dipshit', 'shithead',
    'wanker', 'wankers',
    'twat', 'twats',
    'prick', 'pricks',
    'goddamn', 'goddamnit',
    'retard', 'retarded',
    'wtf', 'stfu', 'kys',
    'son of a bitch', 'piece of shit',

    // ── FRANÇAIS ──
    'putain', 'pute', 'merde', 'connard', 'connarde',
    'salope', 'enculé', 'enculee', 'encule',
    'fils de pute', 'va te faire foutre',
    'bordel', 'salopard', 'batard', 'bâtard',
    'couille', 'couilles',
    'nique', 'niquer', 'niqué', 'nique ta mere',
    'pd', 'fdp',

    // ── PORTUGUÊS ──
    'porra', 'caralho', 'buceta', 'cú', 'cu',
    'merda', 'filho da puta', 'fdp',
    'viado', 'viadinho', 'puta merda',
    'foda', 'fodase', 'foda-se', 'se foda',
    'arrombado', 'arrombada',
    'cuzão', 'cuzao',
    'desgraça', 'desgraça',
    'bosta', 'bostas',
    'putaria', 'vadia', 'vagabunda',
    'puta que pariu',

    // ── DEUTSCH ──
    'scheiße', 'scheisse', 'scheiß', 'scheiss',
    'fick', 'ficken', 'gefickt',
    'wichser', 'wichse',
    'hurensohn', 'hure',
    'arschloch', 'arsch',
    'bastard', 'vollidiot', 'blödmann',
    'verdammt', 'scheisskopf',
    'fotze', 'schwanzlutscher',

    // ── ITALIANO ──
    'cazzo', 'cazzata', 'cazzate',
    'minchia', 'vaffanculo', 'fanculo',
    'stronzo', 'stronza', 'stronzate',
    'porco dio', 'porcodio',
    'merda', 'puttana', 'troia',
    'figlio di puttana', 'bastardo', 'bastarda',
    'incazzato', 'rompicoglioni',

    // ── РУССКИЙ (transliterado) ──
    'blyad', 'blyat', 'bliat',
    'khuy', 'khuy',
    'pizda', 'pizdet',
    'yebat', 'yob', 'ebat', 'eba',
    'suka', 'sukin syn',
    'mudak', 'muda',
    'govno', 'pizdec',
    'zalupa', 'chmо',

    // ── ARABIC (transliterado) ──
    'kuss', 'kos', 'kuss ummak',
    'ibn el sharmouta', 'sharmouta',
    'zebbi', 'zeb',
    'ayre', 'ayri',
    'manyak', 'kalb', 'khawal',

    // ── JAPANESE (transliterado) ──
    'kuso', 'chikushō', 'chikusho',
    'baka', 'kisama', 'kichiku',
    'chinpira', 'manko', 'chinko',
    'unko',

    // ── DUTCH ──
    'godverdomme', 'godver',
    'kanker', 'kankerlul', 'kankerhond',
    'lul', 'klootzak', 'kutwijf',
    'tering', 'hoer', 'slet',
    'neuken', 'eikel',

    // ── TURKISH ──
    'siktir', 'orospu', 'orospu cocugu',
    'amk', 'amina koyayim',
    'piç', 'pic', 'kahpe',
    'götveren', 'ibne',

    // ── POLISH ──
    'kurwa', 'kurwa mac', 'chuj',
    'pierdolić', 'pierdolic', 'pierdol',
    'jebać', 'jebac', 'szmata',
    'skurwysyn', 'skurwiel',
    'dupek', 'dupa',

    // ── SWEDISH ──
    'jävlar', 'javlar', 'fan',
    'helvete', 'hora',
    'fitta', 'kuk', 'knulla',
    'skit', 'skitstövel',

    // ── KOREAN (transliterado) ──
    'sibal', 'ssibbal',
    'bitch sibal',
    'michyeo', 'byeongsin',
    'gaesaekki',

    // ── CHINESE (transliterado) ──
    'tmd', 'tamade', 'ta ma de',
    'cao ni ma', 'caonima',
    'wocao', 'shabi', 'sha bi',
    'nima', 'niganma',
];

const BAD_WORDS_SET = new Set(BAD_WORDS.map(w => w.toLowerCase()));

function normalize(text) {
    return text
        .toLowerCase()
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[ñ]/g, 'n')
        .replace(/[ß]/g, 'ss')
        .replace(/0/g, 'o')
        .replace(/1/g, 'i')
        .replace(/3/g, 'e')
        .replace(/4/g, 'a')
        .replace(/5/g, 's')
        .replace(/[@]/g, 'a')
        .replace(/\$/g, 's')
        .replace(/[*!.]/g, '');
}

function detectBadWord(text) {
    const normalized = normalize(text);
    for (const word of BAD_WORDS) {
        const normalizedWord = normalize(word);
        const escaped = normalizedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<![a-z])${escaped}(?![a-z])`, 'i');
        if (regex.test(normalized)) return word;
    }
    return null;
}

// ── CONFIGURACIÓN BÁSICA ──────────────────────────────────────────────────────
async function isAutomodEnabled(guildId) {
    try {
        const res = await pool.query('SELECT enabled FROM automod_settings WHERE guild_id = $1', [guildId]);
        if (res.rows.length === 0) return true;
        return res.rows[0].enabled;
    } catch { return true; }
}

async function setAutomod(guildId, enabled) {
    await pool.query(
        'INSERT INTO automod_settings (guild_id, enabled) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET enabled = $2',
        [guildId, enabled]
    );
}

async function getAutomodConfig(guildId) {
    const res = await pool.query(
        'SELECT enabled, log_channel_id FROM automod_settings WHERE guild_id = $1',
        [guildId]
    );
    return res.rows[0] ?? { enabled: true, log_channel_id: null };
}

// ── CANAL DE LOGS ─────────────────────────────────────────────────────────────
async function setLogChannel(guildId, channelId) {
    await pool.query(
        'INSERT INTO automod_settings (guild_id, log_channel_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET log_channel_id = $2',
        [guildId, channelId]
    );
}

async function getLogChannel(guildId) {
    const res = await pool.query('SELECT log_channel_id FROM automod_settings WHERE guild_id = $1', [guildId]);
    return res.rows[0]?.log_channel_id ?? null;
}

// ── INFRACCIONES ──────────────────────────────────────────────────────────────
async function addInfraction(guildId, userId) {
    const res = await pool.query(`
        INSERT INTO automod_infractions (guild_id, user_id, count, last_infraction)
        VALUES ($1, $2, 1, NOW())
        ON CONFLICT (guild_id, user_id) DO UPDATE
        SET count = automod_infractions.count + 1, last_infraction = NOW()
        RETURNING count
    `, [guildId, userId]);
    return res.rows[0].count;
}

async function getInfractionCount(guildId, userId) {
    const res = await pool.query(
        'SELECT count FROM automod_infractions WHERE guild_id = $1 AND user_id = $2',
        [guildId, userId]
    );
    return res.rows[0]?.count ?? 0;
}

async function resetInfractions(guildId, userId) {
    await pool.query(
        'UPDATE automod_infractions SET count = 0, last_infraction = NOW() WHERE guild_id = $1 AND user_id = $2',
        [guildId, userId]
    );
}

// ── REGLAS DE ACCIÓN ──────────────────────────────────────────────────────────
async function setAutomodRule(guildId, infractions, action, duration) {
    await pool.query(`
        INSERT INTO automod_rules (guild_id, infractions, action, duration)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (guild_id, infractions) DO UPDATE SET action = $3, duration = $4
    `, [guildId, infractions, action, duration]);
}

async function getAutomodRules(guildId) {
    const res = await pool.query(
        'SELECT infractions, action, duration FROM automod_rules WHERE guild_id = $1 ORDER BY infractions ASC',
        [guildId]
    );
    return res.rows;
}

async function deleteAutomodRule(guildId, infractions) {
    const res = await pool.query(
        'DELETE FROM automod_rules WHERE guild_id = $1 AND infractions = $2 RETURNING *',
        [guildId, infractions]
    );
    return res.rowCount > 0;
}

// ── APLICAR ACCIÓN ────────────────────────────────────────────────────────────
async function applyAutomodAction(member, rule) {
    const { action, duration } = rule;
    try {
        switch (action) {
            case 'silenciar': {
                const ms = duration * 60 * 1000;
                await member.timeout(ms, 'AutoMod: límite de infracciones alcanzado');
                return duration >= 1440
                    ? `🔇 Silenciado ${Math.round(duration / 1440)} día(s)`
                    : duration >= 60
                        ? `🔇 Silenciado ${Math.round(duration / 60)} hora(s)`
                        : `🔇 Silenciado ${duration} minuto(s)`;
            }
            case 'expulsar':
                await member.kick('AutoMod: límite de infracciones alcanzado');
                return '👢 Expulsado del servidor';
            case 'banear':
                await member.ban({ reason: 'AutoMod: límite de infracciones alcanzado' });
                return '🔨 Baneado del servidor';
            default:
                return null;
        }
    } catch (err) {
        console.error('Error aplicando acción automod:', err.message);
        return null;
    }
}

// ── MENSAJE DE ADVERTENCIA ────────────────────────────────────────────────────
async function generateWarnMessage(username) {
    const prompt = `Eres Soledad, un bot de Discord con personalidad tsundere y firme. Un usuario llamado "${username}" usó lenguaje inapropiado en el chat y su mensaje fue eliminado. Escribe una advertencia corta en español (máximo 2 oraciones) con la personalidad tsundere de Soledad: firme, directa, con un toque de dramatismo. No menciones la mala palabra. Sin emojis al inicio.`;
    const ai = await generateAIMessage(prompt, 80);
    return ai || `${username}, ese tipo de lenguaje no está permitido aquí. ¡Tu mensaje fue eliminado!`;
}

// ── DISCORD RULE (legacy) ─────────────────────────────────────────────────────
async function getDiscordRuleId(guildId) {
    try {
        const res = await pool.query('SELECT discord_rule_id FROM automod_settings WHERE guild_id = $1', [guildId]);
        return res.rows[0]?.discord_rule_id ?? null;
    } catch { return null; }
}

async function setDiscordRuleId(guildId, ruleId) {
    await pool.query(
        'INSERT INTO automod_settings (guild_id, discord_rule_id) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET discord_rule_id = $2',
        [guildId, ruleId]
    );
}

module.exports = {
    detectBadWord,
    isAutomodEnabled, setAutomod, getAutomodConfig,
    setLogChannel, getLogChannel,
    addInfraction, getInfractionCount, resetInfractions,
    setAutomodRule, getAutomodRules, deleteAutomodRule,
    applyAutomodAction,
    generateWarnMessage,
    getDiscordRuleId, setDiscordRuleId,
};
