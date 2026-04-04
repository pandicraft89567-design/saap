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
    // Limpiar TODAS las reglas antiguas de Soledad antes de crear nuevas
    const existing = await guild.autoModerationRules.fetch();
    for (const rule of existing.values()) {
        if (rule.name.includes('Soledad')) {
            await rule.delete('Limpieza previa a reinstalación de reglas').catch(() => {});
        }
    }

    const preset = await guild.autoModerationRules.create({
        name: 'Soledad ❣ — Filtro de lenguaje',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.KeywordPreset,
        triggerMetadata: {
            presets: [
                AutoModerationRuleKeywordPresetType.Profanity,
                AutoModerationRuleKeywordPresetType.SexualContent,
                AutoModerationRuleKeywordPresetType.Slurs,
            ],
        },
        actions: [{ type: AutoModerationActionType.BlockMessage }],
        enabled: true,
        reason: 'Discord AutoMod activado por Soledad ❣',
    });

    await guild.autoModerationRules.create({
        name: 'Soledad ❣ — Palabras personalizadas',
        eventType: AutoModerationRuleEventType.MessageSend,
        triggerType: AutoModerationRuleTriggerType.Keyword,
        triggerMetadata: { keywordFilter: CUSTOM_KEYWORDS },
        actions: [{ type: AutoModerationActionType.BlockMessage }],
        enabled: true,
        reason: 'Discord AutoMod personalizado activado por Soledad ❣',
    });

    return preset.id;
}

async function deleteRules(guild) {
    const rules = await guild.autoModerationRules.fetch();
    for (const rule of rules.values()) {
        if (
            rule.name === 'Soledad ❣ — Filtro de lenguaje' ||
            rule.name === 'Soledad ❣ — Palabras personalizadas'
        ) {
            await rule.delete('Discord AutoMod desactivado por Soledad ❣').catch(() => {});
        }
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('discordmod')
        .setNameLocalizations({ 'en-US': 'discordmod', 'en-GB': 'discordmod' })
        .setDescription('Activa o desactiva el AutoMod nativo de Discord en este servidor')
        .setDescriptionLocalizations({ 'en-US': "Enable or disable Discord's native AutoMod in this server", 'en-GB': "Enable or disable Discord's native AutoMod in this server" })
        .addStringOption(option =>
            option.setName('estado')
                .setNameLocalizations({ 'en-US': 'status', 'en-GB': 'status' })
                .setDescription('¿Activar o desactivar el AutoMod de Discord?')
                .setDescriptionLocalizations({ 'en-US': 'Enable or disable Discord AutoMod?', 'en-GB': 'Enable or disable Discord AutoMod?' })
                .setRequired(true)
                .addChoices(
                    { name: '✅ Activar', value: 'on' },
                    { name: '❌ Desactivar', value: 'off' }
                ))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ Solo los administradores pueden cambiar esta configuración.',
                flags: 64
            });
        }

        const enabled = interaction.options.getString('estado') === 'on';
        await interaction.deferReply();

        try {
            if (enabled) {
                const ruleId = await createRules(interaction.guild);
                await setDiscordRuleId(interaction.guildId, ruleId);

                const embed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('🔷 Discord AutoMod Activado')
                    .setDescription('Las reglas nativas de Discord AutoMod están **activas**.\nDiscord bloqueará los mensajes inapropiados directamente, antes de que lleguen al chat.')
                    .addFields(
                        { name: '⚙️ Estado', value: '🟢 Activo', inline: true },
                        { name: '👤 Modificado por', value: interaction.user.username, inline: true },
                        { name: '🔧 Reglas creadas', value: '• **Filtro de lenguaje** — Presets oficiales de Discord (groserías, contenido sexual, insultos)\n• **Palabras personalizadas** — Lista adicional en español', inline: false },
                        { name: '📋 Cómo funciona', value: 'A diferencia del filtro propio del bot, Discord AutoMod actúa a nivel de plataforma: el mensaje nunca llega al canal.', inline: false }
                    )
                    .setFooter({ text: 'Soledad ❣ • Discord AutoMod API' })
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            // Desactivar
            const ruleId = await getDiscordRuleId(interaction.guildId);
            await deleteRules(interaction.guild, ruleId);
            await setDiscordRuleId(interaction.guildId, null);

            const embed = new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('🔷 Discord AutoMod Desactivado')
                .setDescription('Las reglas de Discord AutoMod creadas por Soledad ❣ fueron **eliminadas** del servidor.')
                .addFields(
                    { name: '⚙️ Estado', value: '🔴 Inactivo', inline: true },
                    { name: '👤 Modificado por', value: interaction.user.username, inline: true }
                )
                .setFooter({ text: 'Soledad ❣ • Discord AutoMod API' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error configurando Discord AutoMod:', error);
            const esPermisos = error.code === 50013 || error.message?.includes('Missing Permissions');
            await interaction.editReply({
                content: esPermisos
                    ? '❌ Necesito el permiso **Gestionar servidor** para crear reglas de AutoMod. Asegúrate de dármelo.'
                    : `❌ Error al configurar Discord AutoMod: ${error.message}`,
            });
        }
    },
};
