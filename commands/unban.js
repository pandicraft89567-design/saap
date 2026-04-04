const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setNameLocalizations({ 'en-US': 'unban', 'en-GB': 'unban' })
        .setDescription('Desbanea a un usuario por su ID')
        .setDescriptionLocalizations({ 'en-US': 'Unban a user by their ID', 'en-GB': 'Unban a user by their ID' })
        .addStringOption(option =>
            option.setName('userid')
                .setNameLocalizations({ 'en-US': 'userid', 'en-GB': 'userid' })
                .setDescription('ID del usuario a desbanear')
                .setDescriptionLocalizations({ 'en-US': 'ID of the user to unban', 'en-GB': 'ID of the user to unban' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón del desbaneo')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the unban', 'en-GB': 'Reason for the unban' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('userid').trim();
        const reason = interaction.options.getString('razon') || 'Sin razón especificada';

        if (!/^\d{17,19}$/.test(userId)) {
            return await interaction.reply({ content: '❌ El ID de usuario no es válido. Debe ser un número de 17-19 dígitos.', flags: 64 });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: '❌ No tengo permisos para desbanear usuarios.', flags: 64 });
        }

        // Reconocer antes de bans.fetch() que puede tardar en servers grandes
        await interaction.deferReply();

        try {
            const bans = await interaction.guild.bans.fetch();
            const bannedUser = bans.get(userId);

            if (!bannedUser) {
                return await interaction.editReply({ content: `❌ El usuario con ID \`${userId}\` no está baneado en este servidor.` });
            }

            await interaction.guild.members.unban(userId, `${reason} | Moderador: ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor('#2ECC71')
                .setTitle('✅ Usuario Desbaneado')
                .setDescription(`**${bannedUser.user.tag}** ha sido desbaneado del servidor.`)
                .addFields(
                    { name: '🆔 ID', value: userId, inline: true },
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                )
                .setThumbnail(bannedUser.user.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en unban:', error);
            await interaction.editReply({ content: '❌ No pude desbanear al usuario. Verifica el ID.' });
        }
    },
};
