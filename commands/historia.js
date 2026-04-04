const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 3 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('historia')
        .setNameLocalizations({ 'en-US': 'story', 'en-GB': 'story' })
        .setDescription('💎 [PREMIUM] Genera una historia corta personalizada con IA')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Generate a personalized short story with AI', 'en-GB': '💎 [PREMIUM] Generate a personalized short story with AI' })
        .addStringOption(opt =>
            opt.setName('tema')
                .setNameLocalizations({ 'en-US': 'topic', 'en-GB': 'topic' })
                .setDescription('Tema o idea para la historia (ej: un dragón en la ciudad moderna)')
                .setDescriptionLocalizations({ 'en-US': 'Topic or idea for the story (e.g. a dragon in the modern city)', 'en-GB': 'Topic or idea for the story (e.g. a dragon in the modern city)' })
                .setRequired(true)
                .setMaxLength(150))
        .addStringOption(opt =>
            opt.setName('genero')
                .setNameLocalizations({ 'en-US': 'genre', 'en-GB': 'genre' })
                .setDescription('Género de la historia')
                .setDescriptionLocalizations({ 'en-US': 'Story genre', 'en-GB': 'Story genre' })
                .setRequired(false)
                .addChoices(
                    { name: '🌹 Romance',   value: 'romance' },
                    { name: '😱 Terror',    value: 'terror' },
                    { name: '🚀 Sci-Fi',    value: 'ciencia ficcion' },
                    { name: '🗡️ Fantasía',  value: 'fantasia' },
                    { name: '😂 Comedia',   value: 'comedia' },
                    { name: '🔍 Misterio',  value: 'misterio' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 60000);
            return await interaction.reply({ content: `⏳ Espera **${remaining} minuto(s)** antes de generar otra historia.`, flags: 64 });
        }

        const tema   = interaction.options.getString('tema');
        const genero = interaction.options.getString('genero') || 'aventura';

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const prompt = `Escribe una historia corta de ${genero} en español basada en este tema: "${tema}". El protagonista se llama ${interaction.user.globalName ?? interaction.user.username}. La historia debe ser entretenida, tener un inicio, conflicto y desenlace. Entre 150 y 250 palabras. Sin título.`;

        try {
            const contenido = await generateAIMessage(prompt, 500);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar la historia. Intenta de nuevo.' });
            }

            const generoEmoji = { romance: '🌹', terror: '😱', 'ciencia ficcion': '🚀', fantasia: '🗡️', comedia: '😂', misterio: '🔍', aventura: '⚔️' };

            const embed = new EmbedBuilder()
                .setColor('#F472B6')
                .setTitle(`${generoEmoji[genero] || '📖'} Historia de ${genero.charAt(0).toUpperCase() + genero.slice(1)}`)
                .setDescription(contenido)
                .setFooter({ text: `Historia de ${interaction.user.username} • Soledad ❣ Premium • Generada con IA` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en historia:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar la historia.' });
        }
    }
};
