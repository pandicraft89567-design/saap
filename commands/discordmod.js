const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    AutoModerationRuleTriggerType,
    AutoModerationRuleEventType,
    AutoModerationActionType,
    AutoModerationRuleKeywordPresetType,
} = require('discord.js');

// 🔹 Palabras personalizadas
const CUSTOM_KEYWORDS = [
    'puta', 'puto', 'mierda', 'coño', 'cabron',
    'pendejo', 'maricon', 'gonorrea', 'malparido'
];

// 🔗 Links maliciosos
const BAD_LINKS = [
    'discord.gg/',
    'bit.ly/',
    'grabify',
    'iplogger',
    '.ru',
    '.tk'
];

const COMBINED_FILTER = [...CUSTOM_KEYWORDS, ...BAD_LINKS];

// 🔎 Canal logs
function getLogChannel(guild) {
    const names = ['logs', 'mod-logs', 'moderacion'];

    return guild.channels.cache.find(c =>
        c.isTextBased() && names.some(n => c.name.includes(n))
    ) || guild.channels.cache.find(c => c.isTextBased());
}

// 🔥 Crear o actualizar reglas
async function createOrUpdateRules(guild) {

    const existing = await guild.autoModerationRules.fetch();

    let presetRule = null;
    let keywordRule = null;
    let mentionRule = null;

    // 🔎 Detectar existentes
    for (const rule of existing.values()) {

        if (rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset) {
            presetRule = rule;
        }

        if (rule.triggerType === AutoModerationRuleTriggerType.Keyword) {
            keywordRule = rule;
        }

        if (rule.triggerType === AutoModerationRuleTriggerType.MentionSpam) {
            mentionRule = rule;
        }
    }

    const logChannel = getLogChannel(guild);

    const actions = [
        { type: AutoModerationActionType.BlockMessage }
    ];

    if (logChannel) {
        actions.push({
            type: AutoModerationActionType.SendAlertMessage,
            metadata: { channel: logChannel.id }
        });
    }

    // =========================
    // ✅ PRESET (update/create)
    // =========================
    if (presetRule) {
        await presetRule.edit({
            name: 'Soledad AutoMod — Lenguaje',
            actions,
            triggerMetadata: {
                presets: [
                    AutoModerationRuleKeywordPresetType.Profanity,
                    AutoModerationRuleKeywordPresetType.SexualContent,
                    AutoModerationRuleKeywordPresetType.Slurs,
                ],
            },
            enabled: true
        });
    } else {
        await guild.autoModerationRules.create({
            name: 'Soledad AutoMod — Lenguaje',
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
    }

    // =========================
    // ✅ KEYWORD (update/create)
    // =========================
    if (keywordRule) {
        await keywordRule.edit({
            name: 'Soledad AutoMod — Filtro Global',
            actions,
            triggerMetadata: {
                keywordFilter: COMBINED_FILTER
            },
            enabled: true
        });
    } else {
        await guild.autoModerationRules.create({
            name: 'Soledad AutoMod — Filtro Global',
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.Keyword,
            triggerMetadata: {
                keywordFilter: COMBINED_FILTER
            },
            actions,
            enabled: true,
        });
    }

    // =========================
    // ✅ MENTION SPAM (update/create)
    // =========================
    if (mentionRule) {
        await mentionRule.edit({
            name: 'Soledad AutoMod — Anti Spam',
            actions,
            triggerMetadata: {
                mentionTotalLimit: 5
            },
            enabled: true
        });
    } else {
        await guild.autoModerationRules.create({
            name: 'Soledad AutoMod — Anti Spam',
            eventType: AutoModerationRuleEventType.MessageSend,
            triggerType: AutoModerationRuleTriggerType.MentionSpam,
            triggerMetadata: {
                mentionTotalLimit: 5
            },
            actions,
            enabled: true,
        });
    }
}

// ❌ Desactivar (solo deshabilita, NO borra)
async function disableRules(guild) {
    const rules = await guild.autoModerationRules.fetch();

    for (const rule of rules.values()) {
        if (rule.name.includes('Soledad AutoMod')) {
            await rule.edit({ enabled: false }).catch(() => {});
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discordmod')
        .setDescription('AutoMod avanzado')
        .addStringOption(option =>
            option.setName('estado')
                .setDescription('on / off')
                .setRequired(true)
                .addChoices(
                    { name: 'Activar', value: 'on' },
                    { name: 'Desactivar', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Solo administradores',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const enabled = interaction.options.getString('estado') === 'on';

        try {

            if (enabled) {
                await createOrUpdateRules(interaction.guild);

                return interaction.editReply({
                    content: '🛡️ AutoMod optimizado activado'
                });
            }

            await disableRules(interaction.guild);

            return interaction.editReply({
                content: '❌ AutoMod desactivado (sin borrar reglas)'
            });

        } catch (error) {

            console.error(error);

            return interaction.editReply({
                content: `❌ Error: ${error.message}`
            });
        }
    },

    async onAutoModExecution(execution) {

        const logChannel = getLogChannel(execution.guild);
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚫 AutoMod activado')
            .addFields(
                { name: 'Usuario', value: `<@${execution.userId}>`, inline: true },
                { name: 'Regla', value: execution.ruleName, inline: true },
                { name: 'Canal', value: `<#${execution.channelId}>`, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
