const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const {
    getGuildChannels,
    addChannel,
    removeChannel,
    removeAllChannels,
    LANG_NAMES,
} = require('../utils/traduccionAuto');

const LANG_CHOICES = Object.entries(LANG_NAMES).map(([value, name]) => ({ name, value }));

module.exports = {
    data: new SlashCommandBuilder()
        .setName('traduccion')
        .setNameLocalizations({ 'en-US': 'translation', 'en-GB': 'translation' })
        .setDescription('Sistema de traducción automática de mensajes')
        .setDescriptionLocalizations({ 'en-US': 'Automatic message translation system', 'en-GB': 'Automatic message translation system' })
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

        // ── activar ─────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('activar')
            .setNameLocalizations({ 'en-US': 'enable', 'en-GB': 'enable' })
            .setDescription('Activa la traducción automática en un canal')
            .setDescriptionLocalizations({ 'en-US': 'Enable automatic translation in a channel', 'en-GB': 'Enable automatic translation in a channel' })
            .addChannelOption(opt => opt
                .setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal donde se traducirán los mensajes')
                .setDescriptionLocalizations({ 'en-US': 'Channel where messages will be translated', 'en-GB': 'Channel where messages will be translated' })
                .setRequired(true))
            .addStringOption(opt => opt
                .setName('idioma')
                .setNameLocalizations({ 'en-US': 'language', 'en-GB': 'language' })
                .setDescription('Idioma al que se traducirá (por defecto: Español)')
                .setDescriptionLocalizations({ 'en-US': 'Language to translate to (default: Spanish)', 'en-GB': 'Language to translate to (default: Spanish)' })
                .setRequired(false)
                .addChoices(...LANG_CHOICES)))

        // ── desactivar ──────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('desactivar')
            .setNameLocalizations({ 'en-US': 'disable', 'en-GB': 'disable' })
            .setDescription('Desactiva la traducción en un canal o en todos')
            .setDescriptionLocalizations({ 'en-US': 'Disable translation in a channel or all channels', 'en-GB': 'Disable translation in a channel or all channels' })
            .addChannelOption(opt => opt
                .setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal a desactivar (déjalo vacío para desactivar en todos)')
                .setDescriptionLocalizations({ 'en-US': 'Channel to disable (leave empty to disable in all)', 'en-GB': 'Channel to disable (leave empty to disable in all)' })
                .setRequired(false)))

        // ── estado ──────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('estado')
            .setNameLocalizations({ 'en-US': 'status', 'en-GB': 'status' })
            .setDescription('Muestra los canales con traducción activa')
            .setDescriptionLocalizations({ 'en-US': 'Shows channels with active translation', 'en-GB': 'Shows channels with active translation' })),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: '❌ Necesitas el permiso de **Gestionar canales** para usar este comando.', flags: 64 });
        }

        await interaction.deferReply({ flags: 64 });
        const sub     = interaction.options.getSubcommand();
        const guildId = interaction.guildId;

        try {
            // ── ACTIVAR ────────────────────────────────────────────────────
            if (sub === 'activar') {
                const channel    = interaction.options.getChannel('canal');
                const targetLang = interaction.options.getString('idioma') || 'es';
                const langName   = LANG_NAMES[targetLang] || targetLang;

                await addChannel(guildId, channel.id, targetLang);

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('🌐 Traducción Automática Activada')
                        .setDescription(`Los mensajes en ${channel} serán traducidos automáticamente al **${langName}**.\n\n💡 Los mensajes que ya estén en ese idioma serán ignorados.`)
                        .setFooter({ text: 'Soledad ❣ • Traducción Automática' })
                        .setTimestamp()]
                });
            }

            // ── DESACTIVAR ─────────────────────────────────────────────────
            if (sub === 'desactivar') {
                const channel = interaction.options.getChannel('canal');

                if (channel) {
                    await removeChannel(guildId, channel.id);
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#ff6b6b')
                            .setTitle('🌐 Traducción Desactivada')
                            .setDescription(`La traducción automática fue desactivada en ${channel}.`)
                            .setFooter({ text: 'Soledad ❣ • Traducción Automática' })
                            .setTimestamp()]
                    });
                } else {
                    await removeAllChannels(guildId);
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#ff6b6b')
                            .setTitle('🌐 Traducción Desactivada')
                            .setDescription('La traducción automática fue desactivada en **todos los canales** de este servidor.')
                            .setFooter({ text: 'Soledad ❣ • Traducción Automática' })
                            .setTimestamp()]
                    });
                }
            }

            // ── ESTADO ─────────────────────────────────────────────────────
            if (sub === 'estado') {
                const canales = await getGuildChannels(guildId);

                if (canales.length === 0) {
                    return interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#8B98A5')
                            .setTitle('🌐 Traducción Automática')
                            .setDescription('No hay canales configurados en este servidor.\nUsa `/traduccion activar` para empezar.')
                            .setTimestamp()]
                    });
                }

                const lista = canales.map(c => {
                    const langName = LANG_NAMES[c.target_lang] || c.target_lang;
                    const status   = c.enabled ? '🟢' : '🔴';
                    return `${status} <#${c.channel_id}> → **${langName}**`;
                }).join('\n');

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#1D9BF0')
                        .setTitle('🌐 Canales con Traducción Automática')
                        .setDescription(lista)
                        .setFooter({ text: 'Soledad ❣ • Traducción Automática' })
                        .setTimestamp()]
                });
            }

        } catch (err) {
            console.error('Error en /traduccion:', err);
            await interaction.editReply({ content: '❌ Ocurrió un error al procesar el comando.' });
        }
    },
};
