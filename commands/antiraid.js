const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
    getAntiRaidConfig,
    setAntiRaidEnabled,
    setAntiRaidSettings,
    setAntiRaidLogChannel,
} = require('../utils/antiraid');

const ACTION_LABELS = {
    kick:    '👢 Expulsar',
    ban:     '🔨 Banear',
    lockdown:'🔒 Bloquear servidor',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antiraid')
        .setNameLocalizations({ 'en-US': 'antiraid', 'en-GB': 'antiraid' })
        .setDescription('Sistema de protección contra raids masivos')
        .setDescriptionLocalizations({ 'en-US': 'Mass raid protection system', 'en-GB': 'Mass raid protection system' })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        // ── activar / enable ───────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('activar')
            .setNameLocalizations({ 'en-US': 'enable', 'en-GB': 'enable' })
            .setDescription('Activa la protección anti-raid con tu configuración')
            .setDescriptionLocalizations({ 'en-US': 'Enable anti-raid protection with your configuration', 'en-GB': 'Enable anti-raid protection with your configuration' }))

        // ── desactivar / disable ───────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('desactivar')
            .setNameLocalizations({ 'en-US': 'disable', 'en-GB': 'disable' })
            .setDescription('Desactiva la protección anti-raid')
            .setDescriptionLocalizations({ 'en-US': 'Disable anti-raid protection', 'en-GB': 'Disable anti-raid protection' }))

        // ── configurar / configure ─────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('configurar')
            .setNameLocalizations({ 'en-US': 'configure', 'en-GB': 'configure' })
            .setDescription('Ajusta los parámetros del anti-raid')
            .setDescriptionLocalizations({ 'en-US': 'Adjust anti-raid parameters', 'en-GB': 'Adjust anti-raid parameters' })
            .addIntegerOption(opt => opt
                .setName('umbral')
                .setNameLocalizations({ 'en-US': 'threshold', 'en-GB': 'threshold' })
                .setDescription('Cuántos usuarios deben entrar para activar la alerta (ej: 5)')
                .setDescriptionLocalizations({ 'en-US': 'How many users must join to trigger the alert (e.g. 5)', 'en-GB': 'How many users must join to trigger the alert (e.g. 5)' })
                .setRequired(false)
                .setMinValue(2)
                .setMaxValue(50))
            .addIntegerOption(opt => opt
                .setName('ventana')
                .setNameLocalizations({ 'en-US': 'window', 'en-GB': 'window' })
                .setDescription('En cuántos segundos se cuentan esas entradas (ej: 10)')
                .setDescriptionLocalizations({ 'en-US': 'In how many seconds those joins are counted (e.g. 10)', 'en-GB': 'In how many seconds those joins are counted (e.g. 10)' })
                .setRequired(false)
                .setMinValue(3)
                .setMaxValue(120))
            .addStringOption(opt => opt
                .setName('accion')
                .setNameLocalizations({ 'en-US': 'action', 'en-GB': 'action' })
                .setDescription('Qué hacer con los usuarios del raid')
                .setDescriptionLocalizations({ 'en-US': 'What to do with raid users', 'en-GB': 'What to do with raid users' })
                .setRequired(false)
                .addChoices(
                    { name: '👢 Expulsar',           value: 'kick'     },
                    { name: '🔨 Banear',              value: 'ban'      },
                    { name: '🔒 Bloquear servidor',   value: 'lockdown' }
                ))
            .addChannelOption(opt => opt
                .setName('canal_log')
                .setNameLocalizations({ 'en-US': 'log-channel', 'en-GB': 'log-channel' })
                .setDescription('Canal donde se envían las alertas de raid')
                .setDescriptionLocalizations({ 'en-US': 'Channel where raid alerts are sent', 'en-GB': 'Channel where raid alerts are sent' })
                .setRequired(false)))

        // ── estado / status ────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('estado')
            .setNameLocalizations({ 'en-US': 'status', 'en-GB': 'status' })
            .setDescription('Muestra la configuración actual del anti-raid')
            .setDescriptionLocalizations({ 'en-US': 'Show the current anti-raid configuration', 'en-GB': 'Show the current anti-raid configuration' })),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({ content: '❌ Solo los administradores pueden usar este comando.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            // ── ACTIVAR ────────────────────────────────────────────────────
            if (sub === 'activar') {
                await setAntiRaidEnabled(guildId, true);
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('🛡️ Anti-Raid Activado')
                        .setDescription('La protección contra raids está **activa**.\nUsa `/antiraid configurar` para ajustar los parámetros y `/antiraid estado` para ver la configuración.')
                        .setFooter({ text: 'Soledad ❣ • Anti-Raid' })
                        .setTimestamp()]
                });
            }

            // ── DESACTIVAR ─────────────────────────────────────────────────
            if (sub === 'desactivar') {
                await setAntiRaidEnabled(guildId, false);
                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff6b6b')
                        .setTitle('🛡️ Anti-Raid Desactivado')
                        .setDescription('La protección contra raids está **desactivada**.')
                        .setFooter({ text: 'Soledad ❣ • Anti-Raid' })
                        .setTimestamp()]
                });
            }

            // ── CONFIGURAR ─────────────────────────────────────────────────
            if (sub === 'configurar') {
                const threshold    = interaction.options.getInteger('umbral')    || null;
                const timewindow   = interaction.options.getInteger('ventana')   || null;
                const action       = interaction.options.getString('accion')     || null;
                const logChannel   = interaction.options.getChannel('canal_log') || null;

                await setAntiRaidSettings(guildId, {
                    threshold,
                    timewindow,
                    action,
                    log_channel_id: logChannel?.id || null,
                });

                const changes = [];
                if (threshold)  changes.push(`**Umbral:** ${threshold} usuarios`);
                if (timewindow) changes.push(`**Ventana:** ${timewindow} segundos`);
                if (action)     changes.push(`**Acción:** ${ACTION_LABELS[action]}`);
                if (logChannel) changes.push(`**Canal de alertas:** ${logChannel}`);

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ffd43b')
                        .setTitle('⚙️ Anti-Raid Configurado')
                        .setDescription(changes.length > 0
                            ? changes.join('\n')
                            : 'No se especificó ningún cambio.')
                        .setFooter({ text: 'Soledad ❣ • Anti-Raid' })
                        .setTimestamp()]
                });
            }

            // ── ESTADO ─────────────────────────────────────────────────────
            if (sub === 'estado') {
                const cfg = await getAntiRaidConfig(guildId);

                if (!cfg) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#8B98A5')
                            .setTitle('🛡️ Anti-Raid')
                            .setDescription('Aún no hay configuración para este servidor.\nUsa `/antiraid activar` para comenzar.')
                            .setTimestamp()]
                    });
                }

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(cfg.enabled ? '#51cf66' : '#ff6b6b')
                        .setTitle('🛡️ Estado del Anti-Raid')
                        .addFields(
                            { name: '⚙️ Estado',           value: cfg.enabled ? '🟢 Activo' : '🔴 Inactivo',                                 inline: true  },
                            { name: '👥 Umbral',            value: `${cfg.threshold} usuarios`,                                                 inline: true  },
                            { name: '⏱️ Ventana de tiempo', value: `${cfg.timewindow} segundos`,                                               inline: true  },
                            { name: '🎯 Acción',            value: ACTION_LABELS[cfg.action] || cfg.action,                                     inline: true  },
                            { name: '📋 Canal de alertas',  value: cfg.log_channel_id ? `<#${cfg.log_channel_id}>` : '❌ No configurado',       inline: true  }
                        )
                        .setFooter({ text: 'Soledad ❣ • Anti-Raid' })
                        .setTimestamp()]
                });
            }

        } catch (err) {
            console.error('Error en /antiraid:', err);
            await interaction.editReply({ content: '❌ Ocurrió un error al procesar el comando.' });
        }
    },
};
