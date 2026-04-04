const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const COOLDOWNS = new Map();
const COOLDOWN_MS = 2 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('receta')
        .setNameLocalizations({ 'en-US': 'recipe', 'en-GB': 'recipe' })
        .setDescription('💎 [PREMIUM] La IA genera una receta de cocina con los ingredientes que tengas')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] The AI generates a cooking recipe with your ingredients', 'en-GB': '💎 [PREMIUM] The AI generates a cooking recipe with your ingredients' })
        .addStringOption(opt =>
            opt.setName('ingredientes')
                .setNameLocalizations({ 'en-US': 'ingredients', 'en-GB': 'ingredients' })
                .setDescription('Ingredientes que tienes disponibles (ej: pollo, arroz, ajo, tomate)')
                .setDescriptionLocalizations({ 'en-US': 'Ingredients you have available (e.g. chicken, rice, garlic, tomato)', 'en-GB': 'Ingredients you have available (e.g. chicken, rice, garlic, tomato)' })
                .setRequired(true)
                .setMaxLength(200))
        .addStringOption(opt =>
            opt.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Tipo de comida')
                .setDescriptionLocalizations({ 'en-US': 'Meal type', 'en-GB': 'Meal type' })
                .setRequired(false)
                .addChoices(
                    { name: '🍳 Desayuno',    value: 'desayuno' },
                    { name: '🍽️ Almuerzo',    value: 'almuerzo' },
                    { name: '🌙 Cena',         value: 'cena' },
                    { name: '🍰 Postre',       value: 'postre' },
                    { name: '🥗 Snack rápido', value: 'snack rapido' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const lastUse = COOLDOWNS.get(interaction.user.id);
        if (lastUse && Date.now() - lastUse < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastUse)) / 1000);
            return await interaction.reply({ content: `⏳ Espera **${remaining}s** antes de pedir otra receta.`, flags: 64 });
        }

        const ingredientes = interaction.options.getString('ingredientes');
        const tipo         = interaction.options.getString('tipo') || 'cualquier comida';

        await interaction.deferReply();
        COOLDOWNS.set(interaction.user.id, Date.now());

        const prompt = `Eres un chef profesional. Crea una receta creativa para un ${tipo} usando estos ingredientes: ${ingredientes}. Puedes sugerir añadir 1-2 ingredientes básicos si es necesario. Formato: Nombre del plato, Tiempo de preparación, Porciones, Ingredientes lista corta y Pasos numerados (máximo 5 pasos breves). Total máximo 250 palabras. En español.`;

        try {
            const contenido = await generateAIMessage(prompt, 500);

            if (!contenido) {
                COOLDOWNS.delete(interaction.user.id);
                return await interaction.editReply({ content: '❌ No pude generar la receta. Intenta de nuevo.' });
            }

            const tipoEmoji = {
                'desayuno': '🍳', 'almuerzo': '🍽️', 'cena': '🌙',
                'postre': '🍰', 'snack rapido': '🥗', 'cualquier comida': '👨‍🍳'
            };

            const embed = new EmbedBuilder()
                .setColor('#FB923C')
                .setTitle(`${tipoEmoji[tipo] || '👨‍🍳'} Receta para ${tipo}`)
                .setDescription(contenido)
                .addFields({ name: '🥘 Ingredientes usados', value: ingredientes, inline: false })
                .setFooter({ text: `Cocinado para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en receta:', error);
            COOLDOWNS.delete(interaction.user.id);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar la receta.' });
        }
    }
};
