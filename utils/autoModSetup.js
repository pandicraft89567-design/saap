const {
    PermissionsBitField,
    AutoModerationRuleTriggerType,
    AutoModerationRuleEventType,
    AutoModerationActionType,
    AutoModerationRuleKeywordPresetType,
} = require('discord.js');

const CUSTOM_KEYWORDS = [
    'puta', 'puto', 'mierda', 'coño', 'cabron',
    'pendejo', 'maricon', 'gonorrea', 'malparido'
];

const BAD_LINKS = [
    'discord.gg/', 'bit.ly/', 'grabify', 'iplogger', '.ru', '.tk'
];

const COMBINED_FILTER = [...CUSTOM_KEYWORDS, ...BAD_LINKS];

const RULE_NAMES = {
    preset:  'Soledad AutoMod — Lenguaje',
    keyword: 'Soledad AutoMod — Filtro Global',
    mention: 'Soledad AutoMod — Anti Spam',
};

function getLogChannel(guild) {
    const names = ['logs', 'mod-logs', 'moderacion'];
    return guild.channels.cache.find(c =>
        c.isTextBased?.() && names.some(n => c.name.includes(n))
    ) || null;
}

function buildActions(guild) {
    const actions = [{ type: AutoModerationActionType.BlockMessage }];
    const logChannel = getLogChannel(guild);
    if (logChannel) {
        actions.push({
            type: AutoModerationActionType.SendAlertMessage,
            metadata: { channel: logChannel.id }
        });
    }
    return actions;
}

async function ensureAutoModRules(guild) {
    const me = guild.members.me;
    if (!me) return { ok: false, reason: 'no-me' };
    if (!me.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
        return { ok: false, reason: 'no-manage-guild' };
    }

    let existing;
    try {
        existing = await guild.autoModerationRules.fetch();
    } catch (e) {
        return { ok: false, reason: `fetch-failed: ${e.message}` };
    }

    const byName = new Map();
    for (const rule of existing.values()) byName.set(rule.name, rule);

    const actions = buildActions(guild);
    let created = 0;

    if (!byName.has(RULE_NAMES.preset)) {
        try {
            await guild.autoModerationRules.create({
                name: RULE_NAMES.preset,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.KeywordPreset,
                triggerMetadata: {
                    presets: [
                        AutoModerationRuleKeywordPresetType.Profanity,
                        AutoModerationRuleKeywordPresetType.SexualContent,
                        AutoModerationRuleKeywordPresetType.Slurs,
                    ],
                },
                actions,
                enabled: true,
            });
            created++;
        } catch (e) {
            console.warn(`[AutoMod] preset create failed in ${guild.name}: ${e.message}`);
        }
    }

    if (!byName.has(RULE_NAMES.keyword)) {
        try {
            await guild.autoModerationRules.create({
                name: RULE_NAMES.keyword,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.Keyword,
                triggerMetadata: { keywordFilter: COMBINED_FILTER },
                actions,
                enabled: true,
            });
            created++;
        } catch (e) {
            console.warn(`[AutoMod] keyword create failed in ${guild.name}: ${e.message}`);
        }
    }

    if (!byName.has(RULE_NAMES.mention)) {
        try {
            await guild.autoModerationRules.create({
                name: RULE_NAMES.mention,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.MentionSpam,
                triggerMetadata: { mentionTotalLimit: 5 },
                actions,
                enabled: true,
            });
            created++;
        } catch (e) {
            console.warn(`[AutoMod] mention create failed in ${guild.name}: ${e.message}`);
        }
    }

    return { ok: true, created, total: byName.size + created };
}

async function ensureAutoModRulesAllGuilds(client, { concurrency = 4 } = {}) {
    const guilds = [...client.guilds.cache.values()];
    let totalCreated = 0;
    let totalRules = 0;
    let okGuilds = 0;
    let skippedGuilds = 0;

    let index = 0;
    async function worker() {
        while (index < guilds.length) {
            const guild = guilds[index++];
            try {
                const res = await ensureAutoModRules(guild);
                if (res.ok) {
                    okGuilds++;
                    totalCreated += res.created;
                    totalRules += res.total;
                } else {
                    skippedGuilds++;
                }
            } catch (e) {
                skippedGuilds++;
                console.warn(`[AutoMod] guild ${guild.name} failed: ${e.message}`);
            }
        }
    }

    await Promise.all(Array.from({ length: Math.min(concurrency, guilds.length) }, worker));

    console.log(`🛡️ AutoMod sincronizado: ${okGuilds}/${guilds.length} servidores, ${totalCreated} reglas creadas, ~${totalRules} reglas activas en total.`);
    return { totalCreated, totalRules, okGuilds, skippedGuilds };
}

module.exports = {
    ensureAutoModRules,
    ensureAutoModRulesAllGuilds,
    RULE_NAMES,
};
