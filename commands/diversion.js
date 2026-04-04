const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchAnimeGif, fetchAnimeImage } = require('../utils/api');
const { getLanguage, t } = require('../utils/i18n');
const { generateAIMessage } = require('../utils/ai');
const config = require('../config');

const PROTECTED_USER_ID = '832641595110719509';

// ── Mensajes de pat ───────────────────────────────────────────────────────────
const PAT_MSGS = [
    '{user} le da una caricia suave a {target} 🤍',
    '{user} acaricia la cabeza de {target} con cariño 🌸',
    '{user} le hace un *pat pat* a {target} 💕',
    '{user} consuela a {target} con una caricia 🥹',
    '{user} le da palmaditas en la cabeza a {target} ✨',
];

// ── Mensajes de slap ──────────────────────────────────────────────────────────
const SLAP_MSGS = [
    '{user} le da una tremenda cachetada a {target} 💥',
    '{user} abofetea a {target} con todas sus fuerzas 😤',
    '{user} lanza una bofetada épica a {target} ✋',
    '{user} le manda un slap a {target} y retumba el eco 👋',
    '{user} no aguantó más y le dio su merecido a {target} 😠',
];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// ── Comprobaciones comunes de objetivo ───────────────────────────────────────
function checkTarget(interaction, target, accion) {
    const self = interaction.user;
    if (target.id === self.id)        return `🥺 No puedes hacerte ${accion} a ti mismo...`;
    if (target.id === PROTECTED_USER_ID)
        return '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...';
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('diversion')
        .setNameLocalizations({ 'en-US': 'fun', 'en-GB': 'fun' })
        .setDescription('Comandos de diversión con GIFs anime')
        .setDescriptionLocalizations({ 'en-US': 'Fun commands with anime GIFs', 'en-GB': 'Fun commands with anime GIFs' })

        // beso / kiss
        .addSubcommand(sub => sub
            .setName('beso')
            .setNameLocalizations({ 'en-US': 'kiss', 'en-GB': 'kiss' })
            .setDescription('Dale un beso virtual a alguien 💋')
            .setDescriptionLocalizations({ 'en-US': 'Give someone a virtual kiss 💋', 'en-GB': 'Give someone a virtual kiss 💋' })
            .addUserOption(opt => opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién quieres besar?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to kiss?', 'en-GB': 'Who do you want to kiss?' })
                .setRequired(true)))

        // abrazo / hug
        .addSubcommand(sub => sub
            .setName('abrazo')
            .setNameLocalizations({ 'en-US': 'hug', 'en-GB': 'hug' })
            .setDescription('Dale un abrazo virtual a alguien 🤗')
            .setDescriptionLocalizations({ 'en-US': 'Give someone a virtual hug 🤗', 'en-GB': 'Give someone a virtual hug 🤗' })
            .addUserOption(opt => opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién quieres abrazar?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to hug?', 'en-GB': 'Who do you want to hug?' })
                .setRequired(true)))

        // pat
        .addSubcommand(sub => sub
            .setName('pat')
            .setNameLocalizations({ 'en-US': 'pat', 'en-GB': 'pat' })
            .setDescription('Acaricia a alguien con un cute pat pat 🌸')
            .setDescriptionLocalizations({ 'en-US': 'Give someone a cute pat pat 🌸', 'en-GB': 'Give someone a cute pat pat 🌸' })
            .addUserOption(opt => opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién quieres acariciar?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to pat?', 'en-GB': 'Who do you want to pat?' })
                .setRequired(true)))

        // slap
        .addSubcommand(sub => sub
            .setName('slap')
            .setNameLocalizations({ 'en-US': 'slap', 'en-GB': 'slap' })
            .setDescription('Dale una bofetada a alguien 👋')
            .setDescriptionLocalizations({ 'en-US': 'Slap someone 👋', 'en-GB': 'Slap someone 👋' })
            .addUserOption(opt => opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién quieres abofetear?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to slap?', 'en-GB': 'Who do you want to slap?' })
                .setRequired(true)))

        // matar / kill
        .addSubcommand(sub => sub
            .setName('matar')
            .setNameLocalizations({ 'en-US': 'kill', 'en-GB': 'kill' })
            .setDescription('Elimina a alguien de manera dramática y anime ⚔️')
            .setDescriptionLocalizations({ 'en-US': 'Eliminate someone in a dramatic anime way ⚔️', 'en-GB': 'Eliminate someone in a dramatic anime way ⚔️' })
            .addUserOption(opt => opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién quieres eliminar?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to eliminate?', 'en-GB': 'Who do you want to eliminate?' })
                .setRequired(true)))

        // waifu
        .addSubcommand(sub => sub
            .setName('waifu')
            .setNameLocalizations({ 'en-US': 'waifu', 'en-GB': 'waifu' })
            .setDescription('Obtén una imagen o GIF de anime aleatoria 🌸')
            .setDescriptionLocalizations({ 'en-US': 'Get a random anime image or GIF 🌸', 'en-GB': 'Get a random anime image or GIF 🌸' })
            .addStringOption(opt => opt
                .setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de contenido')
                .setDescriptionLocalizations({ 'en-US': 'Content type', 'en-GB': 'Content type' })
                .setRequired(false)
                .addChoices(
                    { name: '🖼️ Waifu',      value: 'waifu'  },
                    { name: '🐱 Neko',        value: 'neko'   },
                    { name: '😊 Feliz',       value: 'happy'  },
                    { name: '😢 Llorando',    value: 'cry'    },
                    { name: '😄 Sonriendo',   value: 'smile'  },
                    { name: '💃 Bailando',    value: 'dance'  },
                    { name: '😉 Guiñando',    value: 'wink'   }
                ))),

    async execute(interaction) {
        const sub    = interaction.options.getSubcommand();
        const lang   = await getLanguage(interaction.guildId);
        const author = interaction.user;

        // ── BESO ────────────────────────────────────────────────────────────
        if (sub === 'beso') {
            const target = interaction.options.getUser('usuario');

            if (target.id === interaction.client.user.id)
                return interaction.reply({ content: `<:kokoro:1385223047207850024> Oye... me llamo **Soledad** y ya tengo novia, ¡así que no! 💜`, flags: 64 });

            const err = checkTarget(interaction, target, 'un beso');
            if (err) return interaction.reply({ content: err, flags: 64 });

            if (target.id === author.id)
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle(t('KISS_TITLE', lang)).setDescription(t('KISS_SELF', lang)).setColor(config.colors.anime).setTimestamp()] });

            await interaction.deferReply();
            const prompt = `Eres Soledad, un bot de Discord con personalidad tierna y anime. Describe en UNA oración corta y creativa en español que "${author.username}" le da un beso a "${target.username}". Hazlo tierno, dulce y estilo anime. Sin emojis al inicio.`;
            const [gifUrl, aiMessage] = await Promise.all([fetchAnimeGif('kiss'), generateAIMessage(prompt, 80)]);

            const embed = new EmbedBuilder()
                .setTitle(t('KISS_TITLE', lang))
                .setDescription(aiMessage || t('KISS_MSG', lang, { author: author.username, target: target.username }))
                .setColor(config.colors.anime)
                .setFooter({ text: t('KISS_FOOTER', lang), iconURL: author.displayAvatarURL() })
                .setTimestamp();
            if (gifUrl) embed.setImage(gifUrl);
            return interaction.editReply({ embeds: [embed] });
        }

        // ── ABRAZO ──────────────────────────────────────────────────────────
        if (sub === 'abrazo') {
            const target = interaction.options.getUser('usuario');

            if (target.id === interaction.client.user.id)
                return interaction.reply({ content: `<:kokoro:1385223047207850024> Soy **Soledad** y ya tengo novia, ¡no me abraces así! 💜`, flags: 64 });

            const err = checkTarget(interaction, target, 'un abrazo');
            if (err) return interaction.reply({ content: err, flags: 64 });

            if (target.id === author.id)
                return interaction.reply({ embeds: [new EmbedBuilder().setTitle(t('HUG_TITLE', lang)).setDescription(t('SELF_HUG', lang, { author: author.username })).setColor(config.colors.anime).setTimestamp()] });

            await interaction.deferReply();
            const prompt = `Eres Soledad, un bot de Discord con personalidad tierna y anime. Describe en UNA oración corta y creativa en español que "${author.username}" le da un abrazo a "${target.username}". Hazlo cálido, amoroso y estilo anime. Sin emojis al inicio.`;
            const [gifUrl, aiMessage] = await Promise.all([fetchAnimeGif('hug'), generateAIMessage(prompt, 80)]);

            const embed = new EmbedBuilder()
                .setTitle(t('HUG_TITLE', lang))
                .setDescription(aiMessage || t('HUG_MSG', lang, { author: author.username, target: target.username }))
                .setColor(config.colors.anime)
                .setFooter({ text: t('HUG_FOOTER', lang), iconURL: author.displayAvatarURL() })
                .setTimestamp();
            if (gifUrl) embed.setImage(gifUrl);
            return interaction.editReply({ embeds: [embed] });
        }

        // ── PAT ─────────────────────────────────────────────────────────────
        if (sub === 'pat') {
            const target = interaction.options.getUser('usuario');

            if (target.id === author.id)
                return interaction.reply({ content: '🥺 No puedes acariciarte a ti mismo... ¡pide a alguien que te haga el pat pat!', flags: 64 });
            if (target.id === interaction.client.user.id)
                return interaction.reply({ content: `<:kokoro:1385223047207850024> Soy **Soledad**... y ya tengo novia. *se aparta nerviosa* 💜`, flags: 64 });
            if (target.bot)
                return interaction.reply({ content: '🤖 Los bots no reciben pats, ¡dáselo a alguien de verdad!', flags: 64 });
            if (target.id === PROTECTED_USER_ID)
                return interaction.reply({ content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...', flags: 64 });

            await interaction.deferReply();
            const gifUrl = await fetchAnimeGif('pat') || await fetchAnimeGif('happy');
            const msg = pick(PAT_MSGS)
                .replace('{user}', `**${author.displayName}**`)
                .replace('{target}', `**${target.displayName}**`);

            const embed = new EmbedBuilder()
                .setColor('#FFB6C1')
                .setTitle('🌸 Pat Pat')
                .setDescription(msg)
                .setFooter({ text: `${author.username} → ${target.username}` })
                .setTimestamp();
            if (gifUrl) embed.setImage(gifUrl);
            return interaction.editReply({ embeds: [embed] });
        }

        // ── SLAP ────────────────────────────────────────────────────────────
        if (sub === 'slap') {
            const target = interaction.options.getUser('usuario');

            if (target.id === author.id)
                return interaction.reply({ content: '🤦 ¿Abofetearte a ti mismo? Eso tiene otro nombre...', flags: 64 });
            if (target.id === interaction.client.user.id)
                return interaction.reply({ content: `<:kokoro:1385223047207850024> ¡Oye! Soy **Soledad**, ¡no me pegues! 💜`, flags: 64 });
            if (target.id === PROTECTED_USER_ID)
                return interaction.reply({ content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...', flags: 64 });

            await interaction.deferReply();
            const prompt = `Eres Soledad, un bot de Discord con personalidad cómica y anime. Describe en UNA oración corta y divertida en español que "${author.username}" le da una bofetada a "${target.username}". Exagerado, cómico y estilo anime. Sin emojis al inicio.`;
            const [gifUrl, aiMessage] = await Promise.all([fetchAnimeGif('slap'), generateAIMessage(prompt, 80)]);

            const msg = aiMessage || pick(SLAP_MSGS)
                .replace('{user}', `**${author.displayName}**`)
                .replace('{target}', `**${target.displayName}**`);

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('👋 ¡Bofetada!')
                .setDescription(msg)
                .setFooter({ text: `${author.username} → ${target.username}` })
                .setTimestamp();
            if (gifUrl) embed.setImage(gifUrl);
            return interaction.editReply({ embeds: [embed] });
        }

        // ── MATAR ───────────────────────────────────────────────────────────
        if (sub === 'matar') {
            const target = interaction.options.getUser('usuario');

            if (target.id === author.id)
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ff9500').setTitle('⚠️ Autolesión Detectada').setDescription(t('KILL_SELF', lang)).setTimestamp()] });
            if (target.id === interaction.client.user.id)
                return interaction.reply({ content: `<:kokoro:1385223047207850024> ¿Matarme a **mí**? Me llamo **Soledad** y ya tengo novia, ¡ni lo sueñes! 💜`, flags: 64 });
            if (target.id === PROTECTED_USER_ID)
                return interaction.reply({ content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...', flags: 64 });
            if (target.bot)
                return interaction.reply({ embeds: [new EmbedBuilder().setColor('#ff0000').setTitle('🤖 Protección Anti-Bot').setDescription(t('KILL_BOT', lang)).setTimestamp()] });

            await interaction.deferReply();
            const prompt = `Eres Soledad, un bot de Discord con personalidad tsundere. Describe en UNA oración cómica y exagerada en español cómo "${author.username}" elimina a "${target.username}" de manera dramática. Estilo anime shonen, sin violencia real. Sin emojis al inicio.`;
            const [aiMessage, gifUrl] = await Promise.all([generateAIMessage(prompt, 100), fetchAnimeGif('kill')]);

            const fallbackKeys = ['KILL_MSG_1', 'KILL_MSG_2'];
            const fallback = t(pick(fallbackKeys), lang, { killer: author.username, victim: target.username });

            const embed = new EmbedBuilder()
                .setColor('#8b0000')
                .setTitle('<a:tnt:1385229826008289330> ' + t('KILL_TITLE', lang))
                .setDescription(aiMessage || fallback)
                .setFooter({ text: t('KILL_FOOTER', lang), iconURL: author.displayAvatarURL() })
                .setTimestamp();
            if (gifUrl) embed.setImage(gifUrl);
            else embed.setThumbnail(target.displayAvatarURL());
            return interaction.editReply({ embeds: [embed] });
        }

        // ── WAIFU ───────────────────────────────────────────────────────────
        if (sub === 'waifu') {
            await interaction.deferReply();
            const tipo = interaction.options.getString('tipo') || 'waifu';
            const gifTypes = ['happy', 'cry', 'smile', 'dance', 'wink'];

            const imageUrl = gifTypes.includes(tipo)
                ? await fetchAnimeGif(tipo)
                : await fetchAnimeImage(tipo);

            if (!imageUrl)
                return interaction.editReply({ content: '❌ No pude obtener la imagen. Intenta de nuevo.' });

            const labels = {
                waifu: '🖼️ Waifu', neko: '🐱 Neko', happy: '😊 Feliz',
                cry: '😢 Llorando', smile: '😄 Sonriendo', dance: '💃 Bailando', wink: '😉 Guiñando'
            };

            const embed = new EmbedBuilder()
                .setColor('#FF9FD7')
                .setTitle(`<a:lux:1385222769566027836> ${labels[tipo] || tipo}`)
                .setImage(imageUrl)
                .setFooter({ text: `Solicitado por ${author.username}` })
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }
    },
};
