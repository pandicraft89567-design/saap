const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AuditLogEvent } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');

const TIPOS_AUDIT = {
    ban: { event: AuditLogEvent.MemberBanAdd, emoji: '🔨', label: 'Baneo' },
    unban: { event: AuditLogEvent.MemberBanRemove, emoji: '✅', label: 'Desbaneo' },
    kick: { event: AuditLogEvent.MemberKick, emoji: '👢', label: 'Expulsión' },
    timeout: { event: AuditLogEvent.MemberUpdate, emoji: '🔇', label: 'Timeout' },
    role: { event: AuditLogEvent.MemberRoleUpdate, emoji: '🎭', label: 'Cambio de Rol' },
    canal: { event: AuditLogEvent.ChannelCreate, emoji: '📢', label: 'Canal Creado' },
    mensaje: { event: AuditLogEvent.MessageDelete, emoji: '🗑️', label: 'Mensaje Eliminado' },
    todo: { event: null, emoji: '📋', label: 'Todo' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auditoria')
        .setNameLocalizations({ 'en-US': 'audit', 'en-GB': 'audit' })
        .setDescription('💎 [PREMIUM] Ver el registro de auditoría del servidor')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] View the server audit log', 'en-GB': '💎 [PREMIUM] View the server audit log' })
        .addStringOption(option =>
            option.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de acción a filtrar')
                .setDescriptionLocalizations({ 'en-US': 'Action type to filter', 'en-GB': 'Action type to filter' })
                .setRequired(false)
                .addChoices(
                    { name: '🔨 Baneos', value: 'ban' },
                    { name: '✅ Desbaneos', value: 'unban' },
                    { name: '👢 Expulsiones', value: 'kick' },
                    { name: '🎭 Cambios de Rol', value: 'role' },
                    { name: '📢 Canales Creados', value: 'canal' },
                    { name: '🗑️ Mensajes Eliminados', value: 'mensaje' },
                    { name: '📋 Todo', value: 'todo' }
                ))
        .addIntegerOption(option =>
            option.setName('limite')
                .setNameLocalizations({ 'en-US': 'limit', 'en-GB': 'limit' })
                .setDescription('Cuántas entradas mostrar (1-15, por defecto 10)')
                .setDescriptionLocalizations({ 'en-US': 'How many entries to show (1-15, default 10)', 'en-GB': 'How many entries to show (1-15, default 10)' })
                .setMinValue(1)
                .setMaxValue(15)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const tipo = interaction.options.getString('tipo') || 'todo';
        const limite = interaction.options.getInteger('limite') || 10;

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) {
            return await interaction.reply({ content: '❌ No tengo permisos para ver el log de auditoría.', flags: 64 });
        }

        await interaction.deferReply();

        try {
            const config = TIPOS_AUDIT[tipo];

            const fetchOptions = { limit: limite };
            if (config.event !== null) fetchOptions.type = config.event;

            const auditLogs = await interaction.guild.fetchAuditLogs(fetchOptions);

            if (!auditLogs.entries.size) {
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#95A5A6')
                        .setTitle(`${config.emoji} Auditoría — ${config.label}`)
                        .setDescription('No hay entradas de auditoría para este filtro.')
                        .setTimestamp()]
                });
            }

            const lineas = auditLogs.entries.map(entry => {
                const accion = TIPOS_AUDIT[tipo]?.label || entry.actionType;
                const objetivo = entry.target?.tag || entry.target?.name || entry.targetId || 'Desconocido';
                const ejecutor = entry.executor?.tag || 'Desconocido';
                const razon = entry.reason || 'Sin razón';
                const tiempo = `<t:${Math.floor(entry.createdTimestamp / 1000)}:R>`;

                return `**${objetivo}** — por ${ejecutor}\n> 📋 ${razon} • ${tiempo}`;
            });

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(`${config.emoji} Auditoría — ${config.label} • ${interaction.guild.name}`)
                .setDescription(lineas.join('\n\n'))
                .setFooter({ text: `${auditLogs.entries.size} entrada${auditLogs.entries.size !== 1 ? 's' : ''} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en auditoria:', error);
            await interaction.editReply({ content: '❌ No pude obtener el log de auditoría.' });
        }
    },
};
