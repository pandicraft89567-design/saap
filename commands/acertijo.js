const {
    SlashCommandBuilder, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    ComponentType
} = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

const CATEGORIES = {
    logica:     'Lógica',
    naturaleza: 'Naturaleza',
    numeros:    'Números',
    objetos:    'Objetos',
    historia:   'Historia',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('acertijo')
        .setNameLocalizations({ 'en-US': 'riddle', 'en-GB': 'riddle' })
        .setDescription('Soledad te lanza un acertijo. ¿Puedes resolverlo?')
        .setDescriptionLocalizations({ 'en-US': 'Soledad throws you a riddle. Can you solve it?', 'en-GB': 'Soledad throws you a riddle. Can you solve it?' })
        .addStringOption(opt => opt
            .setName('categoria')
            .setNameLocalizations({ 'en-US': 'category', 'en-GB': 'category' })
            .setDescription('Categoría del acertijo (opcional)')
            .setDescriptionLocalizations({ 'en-US': 'Riddle category (optional)', 'en-GB': 'Riddle category (optional)' })
            .setRequired(false)
            .addChoices(
                { name: '🧠 Lógica',     value: 'logica'     },
                { name: '🌿 Naturaleza', value: 'naturaleza' },
                { name: '🔢 Números',    value: 'numeros'    },
                { name: '📦 Objetos',    value: 'objetos'    },
                { name: '📜 Historia',   value: 'historia'   }
            )
        )
        .addStringOption(opt => opt
            .setName('dificultad')
            .setNameLocalizations({ 'en-US': 'difficulty', 'en-GB': 'difficulty' })
            .setDescription('Nivel de dificultad')
            .setDescriptionLocalizations({ 'en-US': 'Difficulty level', 'en-GB': 'Difficulty level' })
            .setRequired(false)
            .addChoices(
                { name: '🟢 Fácil',   value: 'facil'  },
                { name: '🟡 Medio',   value: 'medio'  },
                { name: '🔴 Difícil', value: 'dificil'}
            )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const categoria  = interaction.options.getString('categoria')  ?? 'logica';
        const dificultad = interaction.options.getString('dificultad') ?? 'medio';

        const catLabel  = CATEGORIES[categoria] ?? 'Lógica';
        const difLabel  = { facil: 'Fácil 🟢', medio: 'Medio 🟡', dificil: 'Difícil 🔴' }[dificultad];

        // Pedir acertijo a la IA en formato JSON
        const prompt = `Crea un acertijo de categoría "${catLabel}" con dificultad "${difLabel}" en español.
Responde SOLO con un JSON válido con este formato exacto (sin markdown, sin explicaciones extra):
{"pregunta":"...","pista":"...","respuesta":"..."}
La pista debe ser una frase que ayude sin revelar la respuesta directamente.`;

        let pregunta, pista, respuesta;
        try {
            const raw = await generateAIMessage(prompt, 250);
            const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
            pregunta  = json.pregunta;
            pista     = json.pista;
            respuesta = json.respuesta;
        } catch {
            return await interaction.editReply({
                content: '❌ No pude generar el acertijo. Inténtalo de nuevo.'
            });
        }

        // Embed principal
        const embed = () => new EmbedBuilder()
            .setColor('#C084FC')
            .setTitle('🧩 Acertijo de Soledad')
            .setDescription(`> *${pregunta}*`)
            .addFields(
                { name: '📚 Categoría',   value: catLabel, inline: true },
                { name: '⚡ Dificultad',  value: difLabel, inline: true }
            )
            .setFooter({ text: 'Tienes 2 minutos • Soledad ❣' })
            .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('acertijo_pista')
                .setLabel('💡 Ver pista')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('acertijo_respuesta')
                .setLabel('✅ Revelar respuesta')
                .setStyle(ButtonStyle.Primary)
        );

        const msg = await interaction.editReply({ embeds: [embed()], components: [row] });

        // Colector de botones (2 minutos)
        const collector = msg.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 2 * 60 * 1000,
        });

        let pistaUsada = false;

        collector.on('collect', async btn => {
            if (btn.customId === 'acertijo_pista') {
                pistaUsada = true;
                await btn.reply({
                    content: `💡 **Pista:** ${pista}`,
                    flags: 64
                });

            } else if (btn.customId === 'acertijo_respuesta') {
                collector.stop('revealed');

                const revealed = new EmbedBuilder()
                    .setColor('#51cf66')
                    .setTitle('✅ Respuesta revelada')
                    .setDescription(`> *${pregunta}*`)
                    .addFields(
                        { name: '🎯 Respuesta',  value: `**${respuesta}**`,             inline: false },
                        { name: '💡 Pista usada', value: pistaUsada ? 'Sí' : 'No',      inline: true  },
                        { name: '👤 Reveló',      value: btn.user.toString(),            inline: true  }
                    )
                    .setFooter({ text: 'Soledad ❣ • Acertijo resuelto' })
                    .setTimestamp();

                const disabledRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('acertijo_pista')
                        .setLabel('💡 Ver pista')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('acertijo_respuesta')
                        .setLabel('✅ Revelado')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                );

                await btn.update({ embeds: [revealed], components: [disabledRow] });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'revealed') return;
            // Tiempo agotado sin revelar
            const expired = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('acertijo_pista')
                    .setLabel('💡 Ver pista')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('acertijo_respuesta')
                    .setLabel('⏰ Tiempo agotado')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(true)
            );
            await interaction.editReply({ components: [expired] }).catch(() => {});
        });
    },
};
