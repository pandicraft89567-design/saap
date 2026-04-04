const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

const PROTECTED_USER_ID = '832641595110719509';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('megusta')
        .setNameLocalizations({ 'en-US': 'ilikeyou', 'en-GB': 'ilikeyou' })
        .setDescription('Expresa lo que sientes por alguien con un poema especial 💕')
        .setDescriptionLocalizations({ 'en-US': 'Express how you feel about someone with a special poem 💕', 'en-GB': 'Express how you feel about someone with a special poem 💕' })
        .addUserOption(option =>
            option.setName('persona')
                .setNameLocalizations({ 'en-US': 'person', 'en-GB': 'person' })
                .setDescription('¿A quién le quieres dedicar el poema?')
                .setDescriptionLocalizations({ 'en-US': 'Who do you want to dedicate the poem to?', 'en-GB': 'Who do you want to dedicate the poem to?' })
                .setRequired(true)),

    async execute(interaction) {
        const autor = interaction.user;
        const persona = interaction.options.getUser('persona');

        if (persona.id === autor.id) {
            return await interaction.reply({
                content: '💭 ¡Aprender a amarse uno mismo también es bonito! Pero elige a otra persona para dedicarle el poema.',
                flags: 64
            });
        }

        if (persona.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        await interaction.deferReply();

        const prompt = `Eres Soledad, un bot de Discord romántico y creativo. Escribe un poema corto y original en español (4 a 6 versos con rima) dedicado de "${autor.username}" a "${persona.username}". Que exprese admiración romántica de forma tierna y única. No uses clichés de flores ni estrellas.`;

        const aiPoem = await generateAIMessage(prompt, 200);

        const poemasFallback = [
            { titulo: '💫 Luz en la oscuridad', texto: `Cuando apareces, el mundo se detiene,\ny todo lo gris vuelve a tener color.\nNo sé cómo explicar lo que se siente,\npero sé que contigo late más mi corazón.` },
            { titulo: '🌹 Sin palabras', texto: `Hay personas que llegan sin avisar,\ny se quedan en el alma para siempre.\nTú eres de esas que hacen suspirar,\ny que el tiempo se siente diferente.` },
            { titulo: '🎵 Melodía del alma', texto: `Tu risa es la canción que más me gusta,\ntu voz es la melodía que me calma.\nEres la nota perfecta, la que ajusta\ncada rincón vacío de mi alma.` },
        ];

        const fallback = poemasFallback[Math.floor(Math.random() * poemasFallback.length)];

        const embed = new EmbedBuilder()
            .setTitle(aiPoem ? '<:kokoro:1385223047207850024> Poema Especial' : fallback.titulo)
            .setDescription(`*${aiPoem || fallback.texto}*`)
            .setColor('#FF69B4')
            .addFields({
                name: '💌 Dedicado a',
                value: `${persona} de parte de ${autor}`,
                inline: false
            })
            .setThumbnail(persona.displayAvatarURL({ dynamic: true }))
            .setFooter({
                text: `Un poema especial de ${autor.username}`,
                iconURL: autor.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    },
};
