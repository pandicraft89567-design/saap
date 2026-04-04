const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roast')
        .setNameLocalizations({ 'en-US': 'roast', 'en-GB': 'roast' })
        .setDescription('💎 [PREMIUM] La IA hace un roast (broma pesada) a alguien del servidor 🔥')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] The AI roasts someone in the server 🔥', 'en-GB': '💎 [PREMIUM] The AI roasts someone in the server 🔥' })
        .addUserOption(opt =>
            opt.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('¿A quién quieres hacer el roast?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to roast?', 'en-GB': 'Who do you want to roast?' })
                .setRequired(true))
        .addStringOption(opt =>
            opt.setName('intensidad')
                .setNameLocalizations({ 'en-US': 'intensity', 'en-GB': 'intensity' })
                .setDescription('Nivel del roast')
                .setDescriptionLocalizations({ 'en-US': 'Roast level', 'en-GB': 'Roast level' })
                .setRequired(false)
                .addChoices(
                    { name: '😏 Suave',    value: 'suave y amistoso' },
                    { name: '🔥 Medio',    value: 'sarcástico y gracioso' },
                    { name: '💀 Brutal',   value: 'épico y brutal (pero sin insultos reales)' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de otro roast.`, flags: 64 });
        }

        const target     = interaction.options.getUser('usuario');
        const intensidad = interaction.options.getString('intensidad') || 'sarcástico y gracioso';

        if (target.id === interaction.client.user.id) {
            return await interaction.reply({ content: '😤 ¿Hacerme roast a mí? ¡Inténtalo y verás lo que pasa! 💢', flags: 64 });
        }

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const prompt = `Eres un comediante de roast. Haz un roast ${intensidad} para "${target.globalName ?? target.username}". Debe ser DIVERTIDO y creativo, sin insultos racistas, sexistas ni verdaderamente ofensivos. Usa humor sobre su nombre de usuario o cosas genéricas. Entre 3-5 frases contundentes. Idioma: español.`;

        try {
            const contenido = await generateAIMessage(prompt, 250);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar el roast. Intenta de nuevo.' });
            }

            const embed = new EmbedBuilder()
                .setColor('#FF4500')
                .setTitle(`🔥 Roast para ${target.displayName}`)
                .setDescription(contenido)
                .setThumbnail(target.displayAvatarURL({ dynamic: true }))
                .addFields({ name: '🎤 Roaster', value: `${interaction.user}`, inline: true })
                .setFooter({ text: 'Solo es un juego — Soledad ❣ Premium' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en roast:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar el roast.' });
        }
    }
};
