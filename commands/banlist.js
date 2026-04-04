const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banlist')
        .setNameLocalizations({ 'en-US': 'banlist', 'en-GB': 'banlist' })
        .setDescription('Muestra la lista de usuarios baneados del servidor')
        .setDescriptionLocalizations({ 'en-US': 'Shows the list of banned users in the server', 'en-GB': 'Shows the list of banned users in the server' })
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return await interaction.reply({ content: '❌ No tengo permisos para ver la lista de banes.', flags: 64 });
        }

        await interaction.deferReply();

        try {
            const bans = await interaction.guild.bans.fetch();

            if (bans.size === 0) {
                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('📋 Lista de Baneados')
                    .setDescription('✅ No hay usuarios baneados en este servidor.')
                    .setTimestamp();

                return await interaction.editReply({ embeds: [embed] });
            }

            const MAX_SHOW = 20;
            const lista = bans.first(MAX_SHOW).map((ban, index) =>
                `\`${index + 1}.\` **${ban.user.tag}** — ${ban.reason || 'Sin razón'}`
            );

            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle(`<a:barrier:1385229854353526828> Lista de Baneados — ${interaction.guild.name}`)
                .setDescription(lista.join('\n'))
                .setFooter({ text: `Total: ${bans.size} baneado${bans.size !== 1 ? 's' : ''}${bans.size > MAX_SHOW ? ` (mostrando los primeros ${MAX_SHOW})` : ''}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en banlist:', error);
            await interaction.editReply({ content: '❌ No pude obtener la lista de baneados.' });
        }
    },
};
