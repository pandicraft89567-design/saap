const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { isPremium, premiumDenied } = require('../utils/checkPremium');
const { generateAIMessage } = require('../utils/ai');

const SIGNOS = {
    aries:       { emoji: '♈', fechas: '21 mar – 19 abr', elemento: '🔥 Fuego' },
    tauro:       { emoji: '♉', fechas: '20 abr – 20 may', elemento: '🌍 Tierra' },
    geminis:     { emoji: '♊', fechas: '21 may – 20 jun', elemento: '💨 Aire' },
    cancer:      { emoji: '♋', fechas: '21 jun – 22 jul', elemento: '💧 Agua' },
    leo:         { emoji: '♌', fechas: '23 jul – 22 ago', elemento: '🔥 Fuego' },
    virgo:       { emoji: '♍', fechas: '23 ago – 22 sep', elemento: '🌍 Tierra' },
    libra:       { emoji: '♎', fechas: '23 sep – 22 oct', elemento: '💨 Aire' },
    escorpio:    { emoji: '♏', fechas: '23 oct – 21 nov', elemento: '💧 Agua' },
    sagitario:   { emoji: '♐', fechas: '22 nov – 21 dic', elemento: '🔥 Fuego' },
    capricornio: { emoji: '♑', fechas: '22 dic – 19 ene', elemento: '🌍 Tierra' },
    acuario:     { emoji: '♒', fechas: '20 ene – 18 feb', elemento: '💨 Aire' },
    piscis:      { emoji: '♓', fechas: '19 feb – 20 mar', elemento: '💧 Agua' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('horoscopo')
        .setNameLocalizations({ 'en-US': 'horoscope', 'en-GB': 'horoscope' })
        .setDescription('💎 [PREMIUM] Obtén tu horóscopo diario exclusivo generado con IA')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Get your exclusive daily AI-generated horoscope', 'en-GB': '💎 [PREMIUM] Get your exclusive daily AI-generated horoscope' })
        .addStringOption(opt =>
            opt.setName('signo')
                .setNameLocalizations({ 'en-US': 'sign', 'en-GB': 'sign' })
                .setDescription('Tu signo zodiacal')
                .setDescriptionLocalizations({ 'en-US': 'Your zodiac sign', 'en-GB': 'Your zodiac sign' })
                .setRequired(true)
                .addChoices(
                    { name: '♈ Aries',       value: 'aries' },
                    { name: '♉ Tauro',       value: 'tauro' },
                    { name: '♊ Géminis',     value: 'geminis' },
                    { name: '♋ Cáncer',      value: 'cancer' },
                    { name: '♌ Leo',         value: 'leo' },
                    { name: '♍ Virgo',       value: 'virgo' },
                    { name: '♎ Libra',       value: 'libra' },
                    { name: '♏ Escorpio',    value: 'escorpio' },
                    { name: '♐ Sagitario',   value: 'sagitario' },
                    { name: '♑ Capricornio', value: 'capricornio' },
                    { name: '♒ Acuario',     value: 'acuario' },
                    { name: '♓ Piscis',      value: 'piscis' }
                )),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const signo = interaction.options.getString('signo');
        const info  = SIGNOS[signo];

        await interaction.deferReply();

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query('ALTER TABLE economy ADD COLUMN IF NOT EXISTS last_horoscopo DATE');
            await db.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [interaction.user.id]);

            const res = await db.query('SELECT last_horoscopo FROM economy WHERE user_id = $1', [interaction.user.id]);
            const lastHoro = res.rows[0]?.last_horoscopo;
            const hoy = new Date().toISOString().split('T')[0];

            if (lastHoro && new Date(lastHoro).toISOString().split('T')[0] === hoy) {
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#9B59B6')
                        .setTitle('🔮 Ya consultaste tu horóscopo hoy')
                        .setDescription('Vuelve mañana para tu próxima lectura astral.\n*Las estrellas hablan una vez al día.*')
                        .setFooter({ text: 'Soledad ❣ Premium' })
                        .setTimestamp()]
                });
            }

            const fecha = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
            const prompt = `Eres un astrólogo experto y misterioso. Escribe el horóscopo de hoy (${fecha}) para ${signo.charAt(0).toUpperCase() + signo.slice(1)}. Incluye: una predicción general del día (2-3 oraciones), un consejo en el amor (1-2 oraciones), un consejo en el trabajo (1-2 oraciones), y un número de la suerte. Sé creativo, emotivo y específico. Máximo 200 palabras.`;

            const contenido = await generateAIMessage(prompt, 400);

            if (!contenido) {
                return await interaction.editReply({ content: '❌ No pude generar el horóscopo. Intenta de nuevo.' });
            }

            await db.query('UPDATE economy SET last_horoscopo = $1 WHERE user_id = $2', [hoy, interaction.user.id]);

            const embed = new EmbedBuilder()
                .setColor('#9B59B6')
                .setTitle(`${info.emoji} Horóscopo de ${signo.charAt(0).toUpperCase() + signo.slice(1)} — Hoy`)
                .setDescription(`*${contenido}*`)
                .addFields(
                    { name: '📅 Fechas',    value: info.fechas,    inline: true },
                    { name: '🌿 Elemento', value: info.elemento,   inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `Lectura para ${interaction.user.username} • Soledad ❣ Premium` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en horoscopo:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al generar el horóscopo.' });
        } finally {
            await db.end();
        }
    },
};
