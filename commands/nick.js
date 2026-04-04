const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const PROTECTED_USER_ID = '832641595110719509';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nick')
        .setNameLocalizations({ 'en-US': 'nick', 'en-GB': 'nick' })
        .setDescription('Cambia o restablece el apodo de un usuario')
        .setDescriptionLocalizations({ 'en-US': 'Change or reset a user\'s nickname', 'en-GB': 'Change or reset a user\'s nickname' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que cambiar el apodo')
                .setDescriptionLocalizations({ 'en-US': 'User whose nickname to change', 'en-GB': 'User whose nickname to change' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('apodo')
                .setNameLocalizations({ 'en-US': 'nickname', 'en-GB': 'nickname' })
                .setDescription('Nuevo apodo (deja vacío para restablecer)')
                .setDescriptionLocalizations({ 'en-US': 'New nickname (leave empty to reset)', 'en-GB': 'New nickname (leave empty to reset)' })
                .setMaxLength(32)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('usuario');
        const nuevoApodo = interaction.options.getString('apodo') || null;

        if (targetUser.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return await interaction.reply({ content: '❌ No tengo permisos para cambiar apodos.', flags: 64 });
        }

        try {
            const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
            if (!member) {
                return await interaction.reply({ content: '❌ El usuario no está en este servidor.', flags: 64 });
            }

            if (member.roles.highest.position >= interaction.guild.members.me.roles.highest.position) {
                return await interaction.reply({ content: '<a:barrier:1385229854353526828> No puedo cambiar el apodo de alguien con igual o mayor rango que yo.', flags: 64 });
            }

            const apodoAnterior = member.nickname || member.user.username;
            await member.setNickname(nuevoApodo, `Cambiado por ${interaction.user.username}`);

            const embed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle('✏️ Apodo Actualizado')
                .addFields(
                    { name: '👤 Usuario', value: targetUser.username, inline: true },
                    { name: '📝 Antes', value: apodoAnterior, inline: true },
                    { name: '✨ Ahora', value: nuevoApodo || `*(restablecido a ${targetUser.username})*`, inline: true }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Cambiado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en nick:', error);
            if (interaction.replied || interaction.deferred) { await interaction.followUp({ content: '❌ No pude cambiar el apodo. Verifica los permisos.', flags: 64 }); } else { await interaction.reply({ content: '❌ No pude cambiar el apodo. Verifica los permisos.', flags: 64 }); }
        }
    },
};
