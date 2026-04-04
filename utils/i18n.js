const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const translationsPath = path.join(__dirname, '..', 'locales', 'translations.json');

function loadTranslations() {
    return JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
}

function saveTranslations(data) {
    fs.writeFileSync(translationsPath, JSON.stringify(data, null, 4), 'utf8');
}

async function getLanguage(guildId) {
    if (!guildId) return 'es';
    try {
        const res = await pool.query('SELECT language FROM guild_settings WHERE guild_id = $1', [guildId]);
        return res.rows[0]?.language || 'es';
    } catch (error) {
        return 'es';
    }
}

async function setLanguage(guildId, language) {
    try {
        await pool.query(
            'INSERT INTO guild_settings (guild_id, language) VALUES ($1, $2) ON CONFLICT (guild_id) DO UPDATE SET language = $2',
            [guildId, language]
        );
        return true;
    } catch (error) {
        console.error('Error setting language:', error);
        return false;
    }
}

// Protege placeholders y sintaxis de Discord antes de traducir
function protectDiscordSyntax(text) {
    const tokens = [];
    let protected_text = text;

    // Orden importa: proteger primero los más específicos
    const patterns = [
        /<a?:[a-zA-Z0-9_]+:\d+>/g,          // emojis custom <:name:id> <a:name:id>
        /<[@#&!]?\d+>/g,                      // menciones Discord <@id> <#id> <@&id>
        /https?:\/\/[^\s)\]>]+/g,             // URLs
        /```[\s\S]*?```/g,                    // bloques de código ```
        /`[^`\n]+`/g,                         // código inline `code`
        /\/[a-zA-Z][a-zA-Z0-9-]*/g,          // comandos /comando
        /\{[a-zA-Z_]+\}/g,                    // placeholders {var}
    ];

    for (const pattern of patterns) {
        protected_text = protected_text.replace(pattern, (match) => {
            tokens.push(match);
            return `__TOK${tokens.length - 1}__`;
        });
    }

    return { protected_text, tokens };
}

function restoreTokens(text, tokens) {
    return tokens.reduce((t, tok, i) => t.replace(new RegExp(`__TOK${i}__`, 'g'), tok), text);
}

// Protege placeholders {variable} antes de traducir y los restaura después (legacy)
function protectPlaceholders(text) {
    const placeholders = [];
    const protected_text = text.replace(/\{[a-zA-Z_]+\}/g, (match) => {
        placeholders.push(match);
        return `__VAR${placeholders.length - 1}__`;
    });
    return { protected_text, placeholders };
}

function restorePlaceholders(text, placeholders) {
    return placeholders.reduce((t, p, i) => t.replace(new RegExp(`__VAR${i}__`, 'g'), p), text);
}

// Traduce UN texto usando Google Translate
async function autoTranslate(text, targetLang) {
    if (targetLang === 'es') return text;
    if (!text || typeof text !== 'string' || text.trim() === '') return text;

    const { protected_text, tokens } = protectDiscordSyntax(text);

    // Si solo quedan tokens protegidos, no vale la pena traducir
    if (protected_text.replace(/__TOK\d+__/g, '').trim() === '') return text;

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=${targetLang}&dt=t&q=${encodeURIComponent(protected_text)}`;
        const response = await axios.get(url, { timeout: 8000 });
        let translated = response.data[0].map(chunk => chunk[0]).join('');
        return restoreTokens(translated, tokens);
    } catch (error) {
        console.error(`Error auto-traduciendo al ${targetLang}:`, error.message);
        return text;
    }
}

// Pre-traduce TODAS las claves faltantes en PARALELO (sin pausas entre requests)
async function preTranslateLanguage(targetLang) {
    if (targetLang === 'es') return;

    const translations = loadTranslations();
    const esStrings = translations['es'];

    if (!translations[targetLang]) translations[targetLang] = {};

    const keysToTranslate = Object.keys(esStrings).filter(
        key => key !== 'LANGUAGE_CHANGED' && !translations[targetLang][key]
    );

    if (keysToTranslate.length === 0) {
        console.log(`✅ Todas las traducciones para ${targetLang} ya existen.`);
        return;
    }

    console.log(`🌐 Auto-traduciendo ${keysToTranslate.length} cadenas al idioma: ${targetLang} (en paralelo)...`);

    const results = await Promise.all(
        keysToTranslate.map(key => autoTranslate(esStrings[key], targetLang))
    );

    keysToTranslate.forEach((key, i) => {
        translations[targetLang][key] = results[i];
    });

    saveTranslations(translations);
    console.log(`✅ Traducciones guardadas para: ${targetLang}`);
}

function t(key, lang = 'es', variables = {}) {
    const translations = loadTranslations();
    let text = translations[lang]?.[key] || translations['es']?.[key] || key;
    for (const [vKey, vValue] of Object.entries(variables)) {
        text = text.replace(new RegExp(`\\{${vKey}\\}`, 'g'), vValue);
    }
    return text;
}

// Traduce un embed completo
async function translateEmbed(embed, lang) {
    if (!embed || lang === 'es') return embed;

    const data = embed.data ? { ...embed.data } : { ...embed };

    if (data.title)            data.title       = await autoTranslate(data.title, lang);
    if (data.description)      data.description = await autoTranslate(data.description, lang);
    if (data.footer?.text)     data.footer      = { ...data.footer, text: await autoTranslate(data.footer.text, lang) };
    if (data.author?.name)     data.author      = { ...data.author, name: await autoTranslate(data.author.name, lang) };

    if (data.fields && Array.isArray(data.fields)) {
        data.fields = await Promise.all(data.fields.map(async field => ({
            ...field,
            name:  await autoTranslate(field.name, lang),
            value: await autoTranslate(field.value, lang),
        })));
    }

    return new EmbedBuilder(data);
}

// Traduce un payload completo de reply/editReply
async function translatePayload(payload, lang) {
    if (!payload || lang === 'es') return payload;

    const result = { ...payload };

    if (typeof result.content === 'string' && result.content) {
        result.content = await autoTranslate(result.content, lang);
    }

    if (Array.isArray(result.embeds) && result.embeds.length > 0) {
        result.embeds = await Promise.all(result.embeds.map(e => translateEmbed(e, lang)));
    }

    return result;
}

// Envuelve los métodos reply/editReply/followUp de una interacción para auto-traducir
function wrapInteraction(interaction, lang) {
    if (lang === 'es') return interaction;

    const wrap = (originalFn) => async (payload) => {
        try {
            if (typeof payload === 'string') {
                payload = await autoTranslate(payload, lang);
            } else if (payload && typeof payload === 'object') {
                payload = await translatePayload(payload, lang);
            }
        } catch (err) {
            console.error('[i18n wrap] Error traduciendo respuesta:', err.message);
        }
        return originalFn(payload);
    };

    interaction.reply     = wrap(interaction.reply.bind(interaction));
    interaction.editReply = wrap(interaction.editReply.bind(interaction));
    interaction.followUp  = wrap(interaction.followUp.bind(interaction));

    return interaction;
}

module.exports = { getLanguage, setLanguage, t, preTranslateLanguage, autoTranslate, wrapInteraction, translatePayload };
