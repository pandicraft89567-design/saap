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
    'puta', 'puto', 'mierda', 'coño', 'cabron', 'joder',
    'pendejo', 'culero', 'maricon', 'verga',
    'gonorrea', 'malparido', 'tu puta madre'
];

// 🔗 Links maliciosos
const BAD_LINKS = [
    'discord.gg/',
    'bit.ly/',
    'tinyurl.com',
    'grabify',
    'iplogger',
    '.ru',
    '.tk'
];

// 🔥 Filtro combinado (OBLIGATORIO por límite de Discord)
const COMBINED_FILTER = [...CUSTOM_KEYWORDS, ...BAD_LINKS];

// 🔎 Detectar canal de logs automáticamente
function getLogChannel(guild) {
    const preferred = ['logs', 'mod-logs', 'moderacion', 'registros'];

    const found = guild.channels.cache.find(c =>
        c.isTextBased() &&
        preferred.some(name => c.name.includes(name))
    );

    if (found) return found;

    return guild.channels.cache.find(c => c.isTextBased());
}

// 🧹 Crear reglas
async function createRules(guild) {

    const existing = await guild.autoModerationRules.fetch();

    // 🔥 Eliminar conflictos (MEJORADO)
    for (const rule of existing.values()) {

        if (
            rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset ||
            rule.triggerType === AutoModerationRuleTriggerType.Keyword ||
            rule.triggerType === AutoModerationRuleTriggerType.MentionSpam
        ) {
            await rule.delete().catch(() => {});
        }

        if (rule.name.includes('Soledad AutoMod')) {
            await rule.delete().catch(() => {});
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

    // ✅ 1. Regla preset (lenguaje)
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

    // ✅ 2. Palabras + links maliciosos (UNA SOLA REGLA)
    await guild.autoModerationRules.create({
        name: 'Soledad AutoMod — Filtro Global',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
            keywordFilter: COMBINED_FILTER,
        },
        actions,
        enabled: true,
    });

    // ✅ 3. Anti spam de menciones
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

// ❌ Eliminar reglas
async function deleteRules(guild) {
    const rules = await guild.autoModerationRules.fetch();

    for (const rule of rules.values()) {
        if (rule.name.includes('Soledad AutoMod')) {
            await rule.delete().catch(() => {});
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discordmod')
        .setDescription('Activa o desactiva AutoMod')
        .addStringOption(option =>
            option.setName('estado')
                .setDescription('on / off')
                .setRequired(true)
                .addChoices(
                    { name: '✅ Activar', value: 'on' },
                    { name: '❌ Desactivar', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                content: '❌ Solo administradores.',
                ephemeral: true
            });
        }

        const enabled = interaction.options.getString('estado') === 'on';
        await interaction.deferReply();

        try {

            if (enabled) {

                await createRules(interaction.guild);

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🛡️ AutoMod Activado')
                    .setDescription('Lenguaje, links maliciosos y spam bloqueados.')
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            await deleteRules(interaction.guild);

            const embed = new EmbedBuilder()
                .setColor('#ff4d4d')
                .setTitle('❌ AutoMod Desactivado')
                .setDescription('Reglas eliminadas.')
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {

            console.error(error);

            return interaction.editReply({
                content: `❌ Error: ${error.message}`
            });
        }
    },

    // 🔥 EVENTO AUTOMOD (LOGS REALES)
    async onAutoModExecution(execution) {

        const guild = execution.guild;
        const logChannel = getLogChannel(guild);

        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚫 AutoMod detectó un mensaje')
            .addFields(
                { name: 'Usuario', value: `<@${execution.userId}>`, inline: true },
                { name: 'Regla', value: execution.ruleName || 'Desconocida', inline: true },
                { name: 'Canal', value: `<#${execution.channelId}>`, inline: true }
            )
            .setTimestamp();

        logChannel.send({ embeds: [embed] }).catch(() => {});
    }
};
