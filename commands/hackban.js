const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const PROTECTED_USER_ID = '832641595110719509';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hackban')
        .setNameLocalizations({ 'en-US': 'hackban', 'en-GB': 'hackban' })
        .setDescription('Banea a un usuario por su ID aunque no esté en el servidor')
        .setDescriptionLocalizations({ 'en-US': 'Ban a user by their ID even if not in the server', 'en-GB': 'Ban a user by their ID even if not in the server' })
        .addStringOption(option =>
            option.setName('userid')
                .setNameLocalizations({ 'en-US': 'userid', 'en-GB': 'userid' })
                .setDescription('ID del usuario a banear')
                .setDescriptionLocalizations({ 'en-US': 'ID of the user to ban', 'en-GB': 'ID of the user to ban' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('razon')
                .setNameLocalizations({ 'en-US': 'reason', 'en-GB': 'reason' })
                .setDescription('Razón del baneo')
                .setDescriptionLocalizations({ 'en-US': 'Reason for the ban', 'en-GB': 'Reason for the ban' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('userid').trim();
        const reason = interaction.options.getString('razon') || 'Sin razón especificada';

        if (!/^\d{17,19}$/.test(userId)) {
            return await interaction.reply({ content: '❌ El ID no es válido. Debe ser un número de 17-19 dígitos.', flags: 64 });
        }

        if (userId === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (userId === interaction.user.id) {
            return await interaction.reply({ content: '❌ No puedes banearte a ti mismo.', flags: 64 });
        }

        if (userId === interaction.client.user.id) {
            return await interaction.reply({ content: '❌ No puedo banearme a mí misma.', flags: 64 });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: '❌ No tengo permisos para banear.', flags: 64 });
        }

        // Reconocer antes de la operación lenta (bans.fetch puede tardar en servers grandes)
        await interaction.deferReply();

        try {
            const bans = await interaction.guild.bans.fetch();
            if (bans.has(userId)) {
                return await interaction.editReply({ content: `❌ El usuario con ID \`${userId}\` ya está baneado.` });
            }

            await interaction.guild.members.ban(userId, {
                reason: `${reason} | HackBan por: ${interaction.user.username}`,
                deleteMessageSeconds: 0
            });

            let userTag = `ID: \`${userId}\``;
            try {
                const user = await interaction.client.users.fetch(userId);
                userTag = `**${user.tag}** (\`${userId}\`)`;
            } catch {}

            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('<a:tnt:1385229826008289330> HackBan Aplicado')
                .setDescription(`${userTag} ha sido baneado del servidor.`)
                .addFields(
                    { name: '📋 Razón', value: reason, inline: false },
                    { name: '🛡️ Moderador', value: interaction.user.username, inline: true }
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en hackban:', error);
            await interaction.editReply({ content: '❌ No pude banear al usuario. Verifica el ID.' });
        }
    },
};
