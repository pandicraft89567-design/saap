const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    AutoModerationRuleTriggerType,
    AutoModerationRuleEventType,
    AutoModerationActionType,
    AutoModerationRuleKeywordPresetType,
} = require('discord.js');

const { getDiscordRuleId, setDiscordRuleId } = require('../utils/automod');

const CUSTOM_KEYWORDS = [
    'puta', 'puto', 'putas', 'mierda', 'coño', 'gilipollas', 'cabron', 'joder',
    'imbecil', 'chingada', 'chingado', 'pendejo', 'pendeja', 'culero', 'maricon',
    'pinche', 'verga', 'mamahuevo', 'hdp', 'hijo de puta', 'hija de puta',
    'perra', 'zorra', 'estupido', 'estupida', 'carajo', 'cojones', 'mamada',
    'culiao', 'huevon', 'marica', 'gonorrea', 'malparido', 'malparida',
    'tu madre', 'tu puta madre', 'la puta madre', 'maldicion',
    'culo', 'cagada', 'cagar', 'chupame', 'ojete', 'mamaguevo', 'comehuevo',
    'singao', 'panocha', 'chocha', 'vete a la mierda', 'chinga tu madre',
];

async function createRules(guild) {

    const existing = await guild.autoModerationRules.fetch();

    // 🔥 1. Limpiar reglas problemáticas
    for (const rule of existing.values()) {

        // ❗ SOLO puede existir 1 KeywordPreset → eliminar cualquiera existente
        if (rule.triggerType === AutoModerationRuleTriggerType.KeywordPreset) {
            await rule.delete('Reemplazando regla preset existente').catch(() => {});
        }

        // 🧹 Opcional: limpiar reglas viejas del bot
        if (rule.name.includes('Soledad')) {
            await rule.delete('Limpieza de reglas antiguas').catch(() => {});
        }
    }

    // ✅ 2. Crear regla de presets (la importante)
    const presetRule = await guild.autoModerationRules.create({
        name: 'Soledad AutoMod — Filtro de lenguaje',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.KeywordPreset,
        triggerMetadata: {
            presets: [
                AutoModerationRuleKeywordPresetType.Profanity,
                AutoModerationRuleKeywordPresetType.SexualContent,
                AutoModerationRuleKeywordPresetType.Slurs,
            ],
        },
        actions: [
            { type: AutoModerationActionType.BlockMessage },
            {
                type: AutoModerationActionType.SendAlertMessage,
                metadata: { channel: guild.systemChannelId || undefined }
            }
        ],
        enabled: true,
        reason: 'AutoMod activado (presets)',
    });

    // ✅ 3. Crear regla personalizada
    const customRule = await guild.autoModerationRules.create({
        name: 'Soledad AutoMod — Palabras personalizadas',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: {
            keywordFilter: CUSTOM_KEYWORDS,
        },
        actions: [
            { type: AutoModerationActionType.BlockMessage }
        ],
        enabled: true,
        reason: 'AutoMod personalizado',
    });

    // 💾 Guardar ambos IDs
    await setDiscordRuleId(guild.id, {
        preset: presetRule.id,
        custom: customRule.id
    });

    return { presetRule, customRule };
}

async function deleteRules(guild) {
    const rules = await guild.autoModerationRules.fetch();

    for (const rule of rules.values()) {
        if (
            rule.name.includes('Soledad AutoMod')
        ) {
            await rule.delete('AutoMod desactivado').catch(() => {});
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discordmod')
        .setDescription('Activa o desactiva el AutoMod nativo de Discord')
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
                    .setTitle('AutoMod Activado')
                    .setDescription('Protección activa con filtros de Discord + personalizados.')
                    .addFields(
                        { name: 'Estado', value: '🟢 Activo', inline: true },
                        { name: 'Usuario', value: interaction.user.username, inline: true }
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            // ❌ Desactivar
            await deleteRules(interaction.guild);
            await setDiscordRuleId(interaction.guildId, null);

            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('AutoMod Desactivado')
                .setDescription('Reglas eliminadas.')
                .setTimestamp();

            return interaction.editReply({ embeds: [embed] });

        } catch (error) {

            console.error(error);

            const esPermisos = error.code === 50013;

            return interaction.editReply({
                content: esPermisos
                    ? '❌ Falta permiso: Gestionar servidor.'
                    : `❌ Error: ${error.message}`,
            });
        }
    },
};
