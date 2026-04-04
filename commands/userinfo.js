const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setNameLocalizations({ 'en-US': 'userinfo', 'en-GB': 'userinfo' })
        .setDescription('Muestra información detallada de un usuario')
        .setDescriptionLocalizations({ 'en-US': 'Show detailed information about a user', 'en-GB': 'Show detailed information about a user' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario del que quieres ver información')
                .setDescriptionLocalizations({ 'en-US': 'User you want to see information about', 'en-GB': 'User you want to see information about' })
                .setRequired(false)),

    async execute(interaction) {
        try {
            const lang = await getLanguage(interaction.guildId);
            const targetUser = interaction.options.getUser('usuario') || interaction.user;
            const member = interaction.guild.members.cache.get(targetUser.id);

            const embed = new EmbedBuilder()
                .setColor(member?.displayHexColor || '#0099ff')
                .setTitle(t('USER_INFO_TITLE', lang))
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
                .addFields(
                    { name: t('NAME', lang), value: targetUser.tag, inline: true },
                    { name: '🆔 ID', value: targetUser.id, inline: true },
                    { name: '🤖 Bot', value: targetUser.bot ? 'Sí' : 'No', inline: true }
                )
                .setFooter({ text: `Solicitado por ${interaction.user.username}` })
                .setTimestamp();

            if (member) {
                const roles = member.roles.cache
                    .filter(role => role.name !== '@everyone')
                    .map(role => role.toString())
                    .join(', ') || 'Ninguno';

                embed.addFields(
                    { name: '📅 ' + t('JOINED_AT', lang), value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:f> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: false },
                    { name: '🎭 Roles', value: roles, inline: false }
                );
            }

            embed.addFields(
                { name: '📅 Cuenta creada', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:f> (<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>)`, inline: false }
            );

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en comando userinfo:', error);
            const lang = await getLanguage(interaction.guildId);
            await interaction.reply({ content: t('IA_ERROR', lang), flags: 64 });
        }
    },
};