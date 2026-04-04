const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { fetchAnimeGif } = require('../utils/api');
const { generateAIMessage } = require('../utils/ai');

const PROTECTED_USER_ID = '832641595110719509';
const TIPOS = ['slap', 'bonk', 'kick'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('castigar')
        .setNameLocalizations({ 'en-US': 'punish', 'en-GB': 'punish' })
        .setDescription('Castiga a alguien con un GIF de anime')
        .setDescriptionLocalizations({ 'en-US': 'Punish someone with an anime GIF', 'en-GB': 'Punish someone with an anime GIF' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario a castigar')
                .setDescriptionLocalizations({ 'en-US': 'User to punish', 'en-GB': 'User to punish' })
                .setRequired(true))
        .addStringOption(option =>
            option.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de castigo')
                .setDescriptionLocalizations({ 'en-US': 'Type of punishment', 'en-GB': 'Type of punishment' })
                .setRequired(false)
                .addChoices(
                    { name: '👋 Bofetada (Slap)', value: 'slap' },
                    { name: '🔨 Bonk', value: 'bonk' },
                    { name: '👢 Patada (Kick)', value: 'kick' }
                )),

    async execute(interaction) {
        const target = interaction.options.getUser('usuario');
        const castigador = interaction.user;

        if (target.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (target.id === castigador.id) {
            return await interaction.reply({
                content: '🤔 ¿Castigarte a ti mismo? Eso es un poco masoquista...',
                flags: 64
            });
        }

        await interaction.deferReply();

        const tipo = interaction.options.getString('tipo') || TIPOS[Math.floor(Math.random() * TIPOS.length)];

        const prompt = `Eres Soledad, un bot de Discord tsundere. Describe en UNA oración cómica cómo "${castigador.username}" castiga a "${target.username}" con un ${tipo} de anime. Estilo dramático y gracioso. Sin emojis al inicio.`;

        const [gifUrl, aiText] = await Promise.all([
            fetchAnimeGif(tipo),
            generateAIMessage(prompt, 100)
        ]);

        const tipoEmoji = { slap: '👋', bonk: '🔨', kick: '👢' }[tipo];
        const fallback = `**${castigador.username}** le da un ${tipo} épico a **${target.username}**. ¡Que sirva de lección!`;
        const descripcion = aiText || fallback;

        const embed = new EmbedBuilder()
            .setColor('#FF6B35')
            .setTitle(`${tipoEmoji} ¡Castigo!`)
            .setDescription(descripcion)
            .setFooter({ text: `${castigador.username} castigó a ${target.username}` })
            .setTimestamp();

        if (gifUrl) embed.setImage(gifUrl);

        await interaction.editReply({ embeds: [embed] });
    },
};
