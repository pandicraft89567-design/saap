const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forum')
        .setNameLocalizations({ 'en-US': 'forum', 'en-GB': 'forum' })
        .setDescription('Gestión de foros y etiquetas')
        .setDescriptionLocalizations({ 'en-US': 'Forum and tag management', 'en-GB': 'Forum and tag management' })
        .addSubcommand(subcommand =>
            subcommand
                .setName('post')
                .setNameLocalizations({ 'en-US': 'post', 'en-GB': 'post' })
                .setDescription('Crea una publicación en un foro con etiquetas')
                .setDescriptionLocalizations({ 'en-US': 'Create a post in a forum with tags', 'en-GB': 'Create a post in a forum with tags' })
                .addChannelOption(option => option.setName('foro')
                    .setNameLocalizations({ 'en-US': 'forum', 'en-GB': 'forum' })
                    .setDescription('Canal de foro')
                    .setDescriptionLocalizations({ 'en-US': 'Forum channel', 'en-GB': 'Forum channel' })
                    .addChannelTypes(ChannelType.GuildForum).setRequired(true))
                .addStringOption(option => option.setName('titulo')
                    .setNameLocalizations({ 'en-US': 'title', 'en-GB': 'title' })
                    .setDescription('Título del post')
                    .setDescriptionLocalizations({ 'en-US': 'Post title', 'en-GB': 'Post title' })
                    .setRequired(true))
                .addStringOption(option => option.setName('contenido')
                    .setNameLocalizations({ 'en-US': 'content', 'en-GB': 'content' })
                    .setDescription('Contenido del post')
                    .setDescriptionLocalizations({ 'en-US': 'Post content', 'en-GB': 'Post content' })
                    .setRequired(true))
                .addStringOption(option => option.setName('etiquetas')
                    .setNameLocalizations({ 'en-US': 'tags', 'en-GB': 'tags' })
                    .setDescription('Nombres de etiquetas separadas por coma (opcional)')
                    .setDescriptionLocalizations({ 'en-US': 'Tag names separated by comma (optional)', 'en-GB': 'Tag names separated by comma (optional)' })))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'post') {
            const forum = interaction.options.getChannel('foro');
            const title = interaction.options.getString('titulo');
            const content = interaction.options.getString('contenido');
            const tagsInput = interaction.options.getString('etiquetas');

            const appliedTags = [];
            if (tagsInput) {
                const tagNames = tagsInput.split(',').map(s => s.trim().toLowerCase());
                const availableTags = forum.availableTags;
                
                for (const name of tagNames) {
                    const foundTag = availableTags.find(tag => tag.name.toLowerCase() === name);
                    if (foundTag) appliedTags.push(foundTag.id);
                }
            }

            try {
                const post = await forum.threads.create({
                    name: title,
                    message: { content: content },
                    appliedTags: appliedTags,
                });

                const embed = new EmbedBuilder()
                    .setTitle(t('FORUM_TITLE', lang))
                    .setDescription(t('FORUM_DESC', lang, { post: post.thread?.toString() || title }))
                    .setColor('#FEE75C')
                    .addFields({ name: t('FORUM_TAGS_FIELD', lang), value: appliedTags.length > 0 ? appliedTags.length.toString() : t('FORUM_NO_TAGS', lang) });

                return interaction.reply({ embeds: [embed] });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: t('FORUM_ERROR', lang), flags: 64 });
            }
        }
    },
};
