const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    StringSelectMenuOptionBuilder,
} = require('discord.js');
const { setLanguage, getLanguage, preTranslateLanguage } = require('../utils/i18n');

const LANGUAGES = [
    { value: 'es', label: 'Español',   emoji: '🇪🇸', description: 'Idioma principal del bot' },
    { value: 'en', label: 'English',   emoji: '🇺🇸', description: 'English language' },
    { value: 'fr', label: 'Français',  emoji: '🇫🇷', description: 'Langue française' },
    { value: 'pt', label: 'Português', emoji: '🇧🇷', description: 'Língua portuguesa' },
    { value: 'de', label: 'Deutsch',   emoji: '🇩🇪', description: 'Deutsche Sprache' },
    { value: 'it', label: 'Italiano',  emoji: '🇮🇹', description: 'Lingua italiana' },
    { value: 'ja', label: '日本語',    emoji: '🇯🇵', description: '日本語' },
    { value: 'ko', label: '한국어',    emoji: '🇰🇷', description: '한국어' },
    { value: 'zh', label: '中文',      emoji: '🇨🇳', description: '中文（简体）' },
    { value: 'ru', label: 'Русский',   emoji: '🇷🇺', description: 'Русский язык' },
    { value: 'ar', label: 'العربية',   emoji: '🇸🇦', description: 'اللغة العربية' },
    { value: 'tr', label: 'Türkçe',    emoji: '🇹🇷', description: 'Türk dili' },
];

const CONFIRM_MSGS = {
    es: '¡Idioma cambiado a **Español**! 🇪🇸',
    en: 'Language changed to **English**! 🇺🇸',
    fr: 'Langue changée en **Français** ! 🇫🇷',
    pt: 'Idioma alterado para **Português**! 🇧🇷',
    de: 'Sprache auf **Deutsch** geändert! 🇩🇪',
    it: 'Lingua cambiata in **Italiano**! 🇮🇹',
    ja: '言語を**日本語**に変更しました！🇯🇵',
    ko: '언어가 **한국어**로 변경되었습니다! 🇰🇷',
    zh: '语言已更改为**中文**！🇨🇳',
    ru: 'Язык изменён на **Русский**! 🇷🇺',
    ar: 'تم تغيير اللغة إلى **العربية**! 🇸🇦',
    tr: 'Dil **Türkçe** olarak değiştirildi! 🇹🇷',
};

function buildMenu(currentLang) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('language_select')
        .setPlaceholder('🌐 Selecciona un idioma / Select a language')
        .addOptions(
            LANGUAGES.map(l =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(l.label)
                    .setValue(l.value)
                    .setDescription(l.description)
                    .setEmoji(l.emoji)
                    .setDefault(l.value === currentLang)
            )
        );

    return new ActionRowBuilder().addComponents(menu);
}

function buildEmbed(currentLang) {
    const current = LANGUAGES.find(l => l.value === currentLang);
    return new EmbedBuilder()
        .setTitle('🌐 Idioma del Bot / Bot Language')
        .setColor('#5865F2')
        .setDescription(
            '> Selecciona el idioma con el menú de abajo.\n' +
            '> Select the language using the menu below.\n\n' +
            `**Idioma actual / Current language:** ${current?.emoji || ''} **${current?.label || currentLang}**`
        )
        .addFields(
            { name: '🌍 Idiomas disponibles', value: LANGUAGES.map(l => `${l.emoji} ${l.label}`).join('  ·  '), inline: false }
        )
        .setFooter({ text: 'Soledad ❣ • Solo administradores / Admins only' })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('language')
        .setNameLocalizations({ 'en-US': 'language', 'en-GB': 'language' })
        .setDescription('Cambia el idioma del bot con un menú visual')
        .setDescriptionLocalizations({ 'en-US': 'Change the bot language with a visual menu', 'en-GB': 'Change the bot language with a visual menu' })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ Necesitas permisos de **Administrador** para usar este comando.\n❌ You need **Administrator** permissions to use this command.',
                flags: 64,
            });
        }

        // Reconocer la interacción de inmediato para evitar que expire (3 s)
        await interaction.deferReply({ flags: 64 });

        const currentLang = await getLanguage(interaction.guildId);

        await interaction.editReply({
            embeds: [buildEmbed(currentLang)],
            components: [buildMenu(currentLang)],
        });
    },

    // Maneja la selección del menú (llamado desde interactionCreate)
    async handleSelect(interaction) {
        if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return await interaction.reply({
                content: '❌ Solo los administradores pueden cambiar el idioma.',
                flags: 64,
            });
        }

        const lang = interaction.values[0];
        const langInfo = LANGUAGES.find(l => l.value === lang);

        await interaction.deferUpdate();

        const success = await setLanguage(interaction.guildId, lang);
        if (!success) {
            return await interaction.followUp({ content: '❌ Error al guardar el idioma.', flags: 64 });
        }

        if (lang !== 'es') {
            try { await preTranslateLanguage(lang); } catch (e) { console.error('Error pre-traduciendo:', e.message); }
        }

        const confirmEmbed = new EmbedBuilder()
            .setColor('#57F287')
            .setTitle('✅ ' + (CONFIRM_MSGS[lang] || `Idioma cambiado a **${langInfo?.label}**`))
            .setDescription(`${langInfo?.emoji || ''} El bot ahora responderá en **${langInfo?.label || lang}**.`)
            .setFooter({ text: 'Soledad ❣' })
            .setTimestamp();

        await interaction.editReply({
            embeds: [confirmEmbed],
            components: [buildMenu(lang)],
        });
    },
};
