const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thread')
        .setNameLocalizations({ 'en-US': 'thread', 'en-GB': 'thread' })
        .setDescription('Gestión de hilos (threads)')
        .setDescriptionLocalizations({ 'en-US': 'Thread management', 'en-GB': 'Thread management' })
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setNameLocalizations({ 'en-US': 'create', 'en-GB': 'create' })
                .setDescription('Crea un nuevo hilo')
                .setDescriptionLocalizations({ 'en-US': 'Create a new thread', 'en-GB': 'Create a new thread' })
                .addStringOption(option => option.setName('nombre')
                    .setNameLocalizations({ 'en-US': 'name', 'en-GB': 'name' })
                    .setDescription('Nombre del hilo')
                    .setDescriptionLocalizations({ 'en-US': 'Thread name', 'en-GB': 'Thread name' })
                    .setRequired(true))
                .addChannelOption(option => option.setName('canal')
                    .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                    .setDescription('Canal donde crear el hilo')
                    .setDescriptionLocalizations({ 'en-US': 'Channel to create the thread in', 'en-GB': 'Channel to create the thread in' })
                    .addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('archive')
                .setNameLocalizations({ 'en-US': 'archive', 'en-GB': 'archive' })
                .setDescription('Archiva el hilo actual')
                .setDescriptionLocalizations({ 'en-US': 'Archive the current thread', 'en-GB': 'Archive the current thread' }))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageThreads),

    async execute(interaction) {
        const lang = await getLanguage(interaction.guildId);
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('nombre');
            const channel = interaction.options.getChannel('canal') || interaction.channel;

            if (!channel.threads) {
                return interaction.reply({ content: t('THREAD_NO_SUPPORT', lang), flags: 64 });
            }

            const thread = await channel.threads.create({
                name: name,
                autoArchiveDuration: 60,
                reason: `Hilo creado por ${interaction.user.tag}`,
            });

            const embed = new EmbedBuilder()
                .setTitle(t('THREAD_CREATED_TITLE', lang))
                .setDescription(t('THREAD_CREATED_DESC', lang, { thread: thread.toString() }))
                .setColor('#5865F2')
                .setFooter({ text: `Solicitado por ${interaction.user.tag}` });

            return interaction.reply({ embeds: [embed] });
        }

        if (subcommand === 'archive') {
            if (!interaction.channel.isThread()) {
                return interaction.reply({ content: t('THREAD_ARCHIVE_ONLY', lang), flags: 64 });
            }

            await interaction.channel.setArchived(true);
            return interaction.reply({ content: t('THREAD_ARCHIVED', lang), flags: 64 });
        }
    },
};
