const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

const PROTECTED_USER_ID = '832641595110719509';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setNameLocalizations({ 'en-US': 'kick', 'en-GB': 'kick' })
        .setDescription('Expulsa a un usuario del servidor')
        .setDescriptionLocalizations({ 'en-US': 'Kick a user from the server', 'en-GB': 'Kick a user from the server' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario a expulsar')
                .setDescriptionLocalizations({ 'en-US': 'User to kick', 'en-GB': 'User to kick' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón de la expulsión')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the kick', 'en-GB': 'Reason for the kick' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const targetUser = interaction.options.getUser('usuario');
        const reason = interaction.options.getString('razon') || t('NO_REASON', lang);

        if (targetUser.id === interaction.user.id) {
            return await interaction.reply({ content: '❌ No puedes expulsarte a ti mismo.', flags: 64 });
        }

        if (targetUser.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (targetUser.id === interaction.client.user.id) {
            return await interaction.reply({ content: '❌ No puedo expulsarme a mí misma.', flags: 64 });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return await interaction.reply({ content: '❌ No tengo permisos para expulsar miembros.', flags: 64 });
        }

        try {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!member) {
                return await interaction.reply({ content: '❌ El usuario no está en este servidor.', flags: 64 });
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return await interaction.reply({ content: '<a:barrier:1385229854353526828> No puedes expulsar a alguien con igual o mayor rango que tú.', flags: 64 });
            }

            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: '<a:barrier:1385229854353526828> No puedo expulsar a ese usuario por jerarquía de roles.', flags: 64 });
            }

            await member.kick(`${reason} | Moderador: ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor('#FF9500')
                .setTitle('👢 Usuario Expulsado')
                .setDescription(`**${targetUser.username}** ha sido expulsado del servidor.`)
                .addFields(
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en kick:', error);
            if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: '❌ No pude expulsar al usuario.', flags: 64 }); } else { await interaction.reply({ content: '❌ No pude expulsar al usuario.', flags: 64 }); }
        }
    },
};
