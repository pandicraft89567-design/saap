const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 2 * 60 * 1000;

const TIPOS = {
    romantica: 'romántica y emotiva',
    amistad:   'cálida y sincera entre amigos',
    disculpa:  'de disculpa sincera y humilde',
    poema:     'en forma de poema con rima',
    motivacion:'motivacional y alentadora',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('carta')
        .setNameLocalizations({ 'en-US': 'letter', 'en-GB': 'letter' })
        .setDescription('💎 [PREMIUM] Genera una carta o mensaje especial con IA para alguien')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Generate a special AI letter or message for someone', 'en-GB': '💎 [PREMIUM] Generate a special AI letter or message for someone' })
        .addUserOption(opt =>
            opt.setName('para')
                .setNameLocalizations({ 'en-US': 'for', 'en-GB': 'for' })
                .setDescription('¿Para quién es la carta?')
                .setDescriptionLocalizations({ 'en-US': 'Who is the letter for?', 'en-GB': 'Who is the letter for?' })
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de carta')
                .setDescriptionLocalizations({ 'en-US': 'Letter type', 'en-GB': 'Letter type' })
                .setRequired(true)
                .addChoices(
                    { name: '💕 Romántica',     value: 'romantica' },
                    { name: '🤝 Amistad',       value: 'amistad' },
                    { name: '🙏 Disculpa',      value: 'disculpa' },
                    { name: '📜 Poema',         value: 'poema' },
                    { name: '🌟 Motivación',    value: 'motivacion' }
                ))
        .addStringOption(opt =>
            opt.setName('detalle')
                .setNameLocalizations({ 'en-US': 'detail', 'en-GB': 'detail' })
                .setDescription('Añade un detalle personal (ej: "nos conocimos en el verano")')
                .setDescriptionLocalizations({ 'en-US': 'Add a personal detail (e.g. "we met in summer")', 'en-GB': 'Add a personal detail (e.g. "we met in summer")' })
                .setRequired(false)
                .setMaxLength(200)),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining} segundos** antes de generar otra carta.`, flags: 64 });
        }

        const target  = interaction.options.getUser('para');
        const tipo    = interaction.options.getString('tipo');
        const detalle = interaction.options.getString('detalle') || '';

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const tipoLabel = { romantica:'💕 Romántica', amistad:'🤝 Amistad', disculpa:'🙏 Disculpa', poema:'📜 Poema', motivacion:'🌟 Motivación' }[tipo];

        const prompt = `Eres un escritor creativo y emotivo. Escribe una carta ${TIPOS[tipo]} de parte de "${interaction.user.globalName ?? interaction.user.username}" para "${target.globalName ?? target.username}".${detalle ? ` Contexto personal: "${detalle}".` : ''} La carta debe ser original, emotiva y de entre 100 y 180 palabras. Escríbela directamente sin título ni firma.`;

        try {
            const contenido = await generateAIMessage(prompt, 350);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar la carta. Intenta de nuevo.' });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF69B4')
                .setTitle(`${tipoLabel} — Carta especial`)
                .setDescription(`*${contenido}*`)
                .addFields(
                    { name: '✉️ De',    value: `${interaction.user}`, inline: true },
                    { name: '💌 Para',  value: `${target}`,           inline: true }
                )
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: 'Soledad ❣ Premium • Escrita con IA' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en carta:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar la carta.' });
        }
    },
};
