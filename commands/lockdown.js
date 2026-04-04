const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lockdown')
        .setNameLocalizations({ 'en-US': 'lockdown', 'en-GB': 'lockdown' })
        .setDescription('Bloquea o desbloquea un canal para @everyone')
        .setDescriptionLocalizations({ 'en-US': 'Lock or unlock a channel for @everyone', 'en-GB': 'Lock or unlock a channel for @everyone' })
        .addStringOption(option =>
            option.setName('accion')
                .setNameLocalizations({ 'en-US': 'action', 'en-GB': 'action' })
                .setDescription('¿Bloquear o desbloquear?')
                .setDescriptionLocalizations({ 'en-US': 'Lock or unlock?', 'en-GB': 'Lock or unlock?' })
                .setRequired(true)
                .addChoices(
                    { name: '🔒 Bloquear', value: 'lock' },
                    { name: '🔓 Desbloquear', value: 'unlock' }
                ))
        .addChannelOption(option =>
            option.setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal a bloquear (por defecto: canal actual)')
                .setDescriptionLocalizations({ 'en-US': 'Channel to lock (default: current channel)', 'en-GB': 'Channel to lock (default: current channel)' })
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón del bloqueo')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the lockdown', 'en-GB': 'Reason for the lockdown' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        const accion = interaction.options.getString('accion');
        const canal = interaction.options.getChannel('canal') || interaction.channel;
        const razon = interaction.options.getString('razon') || 'Sin razón especificada';

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return await interaction.reply({ content: '❌ No tengo permisos para gestionar canales.', flags: 64 });
        }

        try {
            const everyoneRole = interaction.guild.roles.everyone;
            const isLocking = accion === 'lock';

            await canal.permissionOverwrites.edit(everyoneRole, {
                SendMessages: isLocking ? false : null,
                AddReactions: isLocking ? false : null
            });

            const embed = new EmbedBuilder()
                .setColor(isLocking ? '#E74C3C' : '#2ECC71')
                .setTitle(isLocking ? '🔒 Canal Bloqueado' : '🔓 Canal Desbloqueado')
                .setDescription(`${canal} ha sido ${isLocking ? 'bloqueado' : 'desbloqueado'} para @everyone.`)
                .addFields(
                    { name: '📋 Razón', value: razon, inline: false },
                    { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en lockdown:', error);
            if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: '❌ No pude modificar los permisos del canal.', flags: 64 }); } else { await interaction.reply({ content: '❌ No pude modificar los permisos del canal.', flags: 64 }); }
        }
    },
};
