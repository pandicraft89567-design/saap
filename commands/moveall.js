const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('moveall')
        .setNameLocalizations({ 'en-US': 'moveall', 'en-GB': 'moveall' })
        .setDescription('Mueve a todos los miembros de un canal de voz a otro')
        .setDescriptionLocalizations({ 'en-US': 'Move all members from one voice channel to another', 'en-GB': 'Move all members from one voice channel to another' })
        .addChannelOption(option =>
            option.setName('origen')
                .setNameLocalizations({ 'en-US': 'source', 'en-GB': 'source' })
                .setDescription('Canal de voz de origen')
                .setDescriptionLocalizations({ 'en-US': 'Source voice channel', 'en-GB': 'Source voice channel' })
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('destino')
                .setNameLocalizations({ 'en-US': 'destination', 'en-GB': 'destination' })
                .setDescription('Canal de voz de destino')
                .setDescriptionLocalizations({ 'en-US': 'Destination voice channel', 'en-GB': 'Destination voice channel' })
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

    async execute(interaction) {
        const origen = interaction.options.getChannel('origen');
        const destino = interaction.options.getChannel('destino');

        if (origen.id === destino.id) {
            return await interaction.reply({ content: '❌ El canal de origen y destino no pueden ser el mismo.', flags: 64 });
        }

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return await interaction.reply({ content: '❌ No tengo permisos para mover miembros.', flags: 64 });
        }

        await interaction.deferReply();

        try {
            const miembros = origen.members;

            if (miembros.size === 0) {
                return await interaction.editReply({ content: `❌ No hay nadie en ${origen}.` });
            }

            let movidos = 0;
            for (const [, member] of miembros) {
                try {
                    await member.voice.setChannel(destino);
                    movidos++;
                } catch {
                    // Algunos miembros pueden no ser movibles
                }
            }

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle('🔀 Miembros Movidos')
                .addFields(
                    { name: '📤 Origen', value: origen.name, inline: true },
                    { name: '📥 Destino', value: destino.name, inline: true },
                    { name: '👥 Movidos', value: `${movidos} de ${miembros.size}`, inline: true }
                )
                .setFooter({ text: `Ejecutado por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en moveall:', error);
            await interaction.editReply({ content: '❌ No pude mover a los miembros.' });
        }
    },
};
