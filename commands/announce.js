const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('announce')
        .setNameLocalizations({ 'en-US': 'announce', 'en-GB': 'announce' })
        .setDescription('Envía un anuncio oficial como embed a un canal')
        .setDescriptionLocalizations({ 'en-US': 'Send an official announcement as an embed to a channel', 'en-GB': 'Send an official announcement as an embed to a channel' })
        .addChannelOption(option =>
            option.setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal donde enviar el anuncio')
                .setDescriptionLocalizations({ 'en-US': 'Channel to send the announcement to', 'en-GB': 'Channel to send the announcement to' })
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('titulo')
                .setNameLocalizations({ 'en-US': 'title', 'en-GB': 'title' })
                .setDescription('Título del anuncio')
                .setDescriptionLocalizations({ 'en-US': 'Announcement title', 'en-GB': 'Announcement title' })
                .setMaxLength(256)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('mensaje')
                .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
                .setDescription('Contenido del anuncio')
                .setDescriptionLocalizations({ 'en-US': 'Announcement content', 'en-GB': 'Announcement content' })
                .setMaxLength(2000)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setNameLocalizations({ 'en-US': 'color', 'en-GB': 'color' })
                .setDescription('Color del embed en hex (por defecto: #FFD700)')
                .setDescriptionLocalizations({ 'en-US': 'Embed color in hex (default: #FFD700)', 'en-GB': 'Embed color in hex (default: #FFD700)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('mencionar')
                .setNameLocalizations({ 'en-US': 'mention', 'en-GB': 'mention' })
                .setDescription('¿A quién mencionar? (ej: @everyone, @aqui, o deja vacío)')
                .setDescriptionLocalizations({ 'en-US': 'Who to mention? (e.g. @everyone, @here, or leave empty)', 'en-GB': 'Who to mention? (e.g. @everyone, @here, or leave empty)' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const canal = interaction.options.getChannel('canal');
        const titulo = interaction.options.getString('titulo');
        const mensaje = interaction.options.getString('mensaje');
        const colorInput = interaction.options.getString('color') || '#FFD700';
        const mencionar = interaction.options.getString('mencionar') || '';

        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.SendMessages)) {
            return await interaction.editReply({ content: '❌ No tengo permisos para enviar mensajes.' });
        }

        const colorRegex = /^#[0-9A-Fa-f]{6}$/;
        const color = colorRegex.test(colorInput) ? colorInput : '#FFD700';

        try {
            const embed = new EmbedBuilder()
                .setColor(color)
                .setTitle(`📢 ${titulo}`)
                .setDescription(mensaje)
                .setFooter({
                    text: `Anuncio de ${interaction.user.username} • ${interaction.guild.name}`,
                    iconURL: interaction.guild.iconURL() || interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            const contenido = mencionar
                .replace('@everyone', '@everyone')
                .replace('@aqui', '@here')
                .replace('@here', '@here');

            await canal.send({ content: contenido || undefined, embeds: [embed] });

            await interaction.editReply({ content: `✅ Anuncio enviado a ${canal}.` });

        } catch (error) {
            console.error('Error en announce:', error);
            await interaction.editReply({ content: `❌ No pude enviar el anuncio a ${canal}. Verifica mis permisos.` });
        }
    },
};
