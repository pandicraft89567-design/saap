const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
    isAutomodEnabled, setAutomod,
    setLogChannel, getLogChannel,
    getAutomodRules, setAutomodRule, deleteAutomodRule,
    getInfractionCount, resetInfractions,
} = require('../utils/automod');

const ACTION_LABELS = {
    silenciar: '🔇 Silenciar',
    expulsar:  '👢 Expulsar',
    banear:    '🔨 Banear',
};

function formatDuration(action, duration) {
    if (action !== 'silenciar') return '—';
    if (duration >= 1440) return `${Math.round(duration / 1440)} día(s)`;
    if (duration >= 60)   return `${Math.round(duration / 60)} hora(s)`;
    return `${duration} minuto(s)`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setNameLocalizations({ 'en-US': 'automod', 'en-GB': 'automod' })
        .setDescription('Configura el sistema de auto-moderación del servidor')
        .setDescriptionLocalizations({ 'en-US': 'Configure the server auto-moderation system', 'en-GB': 'Configure the server auto-moderation system' })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        // ── Subcomando: estado / status ─────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('estado')
            .setNameLocalizations({ 'en-US': 'status', 'en-GB': 'status' })
            .setDescription('Activa o desactiva el filtro de palabras')
            .setDescriptionLocalizations({ 'en-US': 'Enable or disable the word filter', 'en-GB': 'Enable or disable the word filter' })
            .addStringOption(opt => opt
                .setName('valor')
                .setNameLocalizations({ 'en-US': 'value', 'en-GB': 'value' })
                .setDescription('¿Activar o desactivar?')
                .setDescriptionLocalizations({ 'en-US': 'Enable or disable?', 'en-GB': 'Enable or disable?' })
                .setRequired(true)
                .addChoices(
                    { name: '✅ Activar',    value: 'on' },
                    { name: '❌ Desactivar', value: 'off' }
                )
            )
        )

        // ── Subcomando: canal / channel ─────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('canal')
            .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
            .setDescription('Elige el canal donde se registran las infracciones')
            .setDescriptionLocalizations({ 'en-US': 'Choose the channel where infractions are logged', 'en-GB': 'Choose the channel where infractions are logged' })
            .addChannelOption(opt => opt
                .setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal de logs de moderación')
                .setDescriptionLocalizations({ 'en-US': 'Moderation log channel', 'en-GB': 'Moderation log channel' })
                .setRequired(true)
            )
        )

        // ── Subcomando: regla / rule ────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('regla')
            .setNameLocalizations({ 'en-US': 'rule', 'en-GB': 'rule' })
            .setDescription('Define qué pasa cuando un usuario llega a X infracciones')
            .setDescriptionLocalizations({ 'en-US': 'Define what happens when a user reaches X infractions', 'en-GB': 'Define what happens when a user reaches X infractions' })
            .addIntegerOption(opt => opt
                .setName('infracciones')
                .setNameLocalizations({ 'en-US': 'infractions', 'en-GB': 'infractions' })
                .setDescription('Número de infracciones que activa esta regla (1–100)')
                .setDescriptionLocalizations({ 'en-US': 'Number of infractions that triggers this rule (1–100)', 'en-GB': 'Number of infractions that triggers this rule (1–100)' })
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
            )
            .addStringOption(opt => opt
                .setName('accion')
                .setNameLocalizations({ 'en-US': 'action', 'en-GB': 'action' })
                .setDescription('Qué hacer con el usuario al llegar a ese número')
                .setDescriptionLocalizations({ 'en-US': 'What to do with the user upon reaching that number', 'en-GB': 'What to do with the user upon reaching that number' })
                .setRequired(true)
                .addChoices(
                    { name: '🔇 Silenciar (timeout)', value: 'silenciar' },
                    { name: '👢 Expulsar',             value: 'expulsar'  },
                    { name: '🔨 Banear',               value: 'banear'    }
                )
            )
            .addIntegerOption(opt => opt
                .setName('duracion')
                .setNameLocalizations({ 'en-US': 'duration', 'en-GB': 'duration' })
                .setDescription('Duración del silencio en minutos (solo para Silenciar, ej: 60 = 1h, 1440 = 1 día)')
                .setDescriptionLocalizations({ 'en-US': 'Mute duration in minutes (only for Mute, e.g. 60 = 1h, 1440 = 1 day)', 'en-GB': 'Mute duration in minutes (only for Mute, e.g. 60 = 1h, 1440 = 1 day)' })
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(40320)
            )
        )

        // ── Subcomando: eliminar-regla / delete-rule ────────────────────────
        .addSubcommand(sub => sub
            .setName('eliminar-regla')
            .setNameLocalizations({ 'en-US': 'delete-rule', 'en-GB': 'delete-rule' })
            .setDescription('Elimina la regla configurada para un número de infracciones')
            .setDescriptionLocalizations({ 'en-US': 'Delete the rule configured for a number of infractions', 'en-GB': 'Delete the rule configured for a number of infractions' })
            .addIntegerOption(opt => opt
                .setName('infracciones')
                .setNameLocalizations({ 'en-US': 'infractions', 'en-GB': 'infractions' })
                .setDescription('Número de infracciones de la regla a eliminar')
                .setDescriptionLocalizations({ 'en-US': 'Number of infractions of the rule to delete', 'en-GB': 'Number of infractions of the rule to delete' })
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
            )
        )

        // ── Subcomando: ver / view ──────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('ver')
            .setNameLocalizations({ 'en-US': 'view', 'en-GB': 'view' })
            .setDescription('Muestra la configuración actual del automod')
            .setDescriptionLocalizations({ 'en-US': 'Show the current automod configuration', 'en-GB': 'Show the current automod configuration' })
        )

        // ── Subcomando: resetear / reset ────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('resetear')
            .setNameLocalizations({ 'en-US': 'reset', 'en-GB': 'reset' })
            .setDescription('Reinicia el contador de infracciones de un usuario')
            .setDescriptionLocalizations({ 'en-US': 'Reset the infraction counter for a user', 'en-GB': 'Reset the infraction counter for a user' })
            .addUserOption(opt => opt
                .setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que resetear las infracciones')
                .setDescriptionLocalizations({ 'en-US': 'User whose infractions to reset', 'en-GB': 'User whose infractions to reset' })
                .setRequired(true)
            )
        ),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ Solo los administradores pueden usar este comando.',
                flags: 64
            });
        }

        await interaction.deferReply({ flags: 64 });

        const sub = interaction.options.getSubcommand();

        try {
            // ── ESTADO ────────────────────────────────────────────────────────
            if (sub === 'estado') {
                const enabled = interaction.options.getString('valor') === 'on';
                await setAutomod(interaction.guildId, enabled);

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(enabled ? '#51cf66' : '#ff6b6b')
                        .setTitle(`🛡️ AutoMod ${enabled ? 'Activado' : 'Desactivado'}`)
                        .setDescription(enabled
                            ? '✅ El filtro de palabras está **activo**. Los mensajes inapropiados serán eliminados y se registrarán las infracciones.'
                            : '❌ El filtro de palabras está **desactivado**.')
                        .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                        .setTimestamp()]
                });
            }

            // ── CANAL ─────────────────────────────────────────────────────────
            if (sub === 'canal') {
                const channel = interaction.options.getChannel('canal');
                const perms   = channel.permissionsFor(interaction.guild.members.me);

                if (!perms?.has(['SendMessages', 'EmbedLinks'])) {
                    return await interaction.editReply({
                        content: `❌ No tengo permisos para enviar mensajes en ${channel}. Revisa los permisos del bot.`
                    });
                }

                await setLogChannel(interaction.guildId, channel.id);

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#C084FC')
                        .setTitle('📋 Canal de logs configurado')
                        .setDescription(`Las infracciones del automod se registrarán en ${channel}.`)
                        .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                        .setTimestamp()]
                });
            }

            // ── REGLA ─────────────────────────────────────────────────────────
            if (sub === 'regla') {
                const infractions = interaction.options.getInteger('infracciones');
                const action      = interaction.options.getString('accion');
                const duration    = interaction.options.getInteger('duracion') ?? 60;

                if (action === 'silenciar' && !interaction.options.getInteger('duracion')) {
                    // default 60 min if not provided
                }

                await setAutomodRule(interaction.guildId, infractions, action, duration);

                const durStr = formatDuration(action, duration);

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ffd43b')
                        .setTitle('⚙️ Regla guardada')
                        .setDescription(`Cuando un usuario llegue a **${infractions} infracción(es)** se aplicará: **${ACTION_LABELS[action]}**`)
                        .addFields(
                            { name: '⚠️ Infracciones', value: `${infractions}`,              inline: true },
                            { name: '🎯 Acción',        value: ACTION_LABELS[action],          inline: true },
                            { name: '⏱️ Duración',      value: durStr,                         inline: true }
                        )
                        .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                        .setTimestamp()]
                });
            }

            // ── ELIMINAR REGLA ────────────────────────────────────────────────
            if (sub === 'eliminar-regla') {
                const infractions = interaction.options.getInteger('infracciones');
                const deleted     = await deleteAutomodRule(interaction.guildId, infractions);

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(deleted ? '#51cf66' : '#ff6b6b')
                        .setTitle(deleted ? '🗑️ Regla eliminada' : '❌ Regla no encontrada')
                        .setDescription(deleted
                            ? `La regla para **${infractions} infracción(es)** fue eliminada.`
                            : `No existe ninguna regla configurada para **${infractions} infracción(es)**.`)
                        .setTimestamp()]
                });
            }

            // ── VER ───────────────────────────────────────────────────────────
            if (sub === 'ver') {
                const [enabled, logChannelId, rules] = await Promise.all([
                    isAutomodEnabled(interaction.guildId),
                    getLogChannel(interaction.guildId),
                    getAutomodRules(interaction.guildId),
                ]);

                const embed = new EmbedBuilder()
                    .setColor('#C084FC')
                    .setTitle('🛡️ Configuración del AutoMod')
                    .addFields(
                        { name: '⚙️ Estado',       value: enabled ? '🟢 Activo' : '🔴 Inactivo',                              inline: true },
                        { name: '📋 Canal de logs', value: logChannelId ? `<#${logChannelId}>` : '❌ No configurado',           inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                    .setTimestamp();

                if (rules.length > 0) {
                    const rulesText = rules.map(r =>
                        `**${r.infractions}** infracciones → ${ACTION_LABELS[r.action]} ${r.action === 'silenciar' ? `(${formatDuration(r.action, r.duration)})` : ''}`
                    ).join('\n');
                    embed.addFields({ name: '📏 Reglas activas', value: rulesText, inline: false });
                } else {
                    embed.addFields({ name: '📏 Reglas activas', value: 'Ninguna configurada. Usa `/automod regla` para añadir.', inline: false });
                }

                return await interaction.editReply({ embeds: [embed] });
            }

            // ── RESETEAR ──────────────────────────────────────────────────────
            if (sub === 'resetear') {
                const user  = interaction.options.getUser('usuario');
                const count = await getInfractionCount(interaction.guildId, user.id);
                await resetInfractions(interaction.guildId, user.id);

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('♻️ Infracciones reseteadas')
                        .setDescription(`Las infracciones de <@${user.id}> fueron reiniciadas.\nTenía **${count}** infracción(es) registrada(s).`)
                        .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                        .setTimestamp()]
                });
            }

        } catch (error) {
            console.error('Error en automod:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al guardar la configuración.' });
        }
    },
};
