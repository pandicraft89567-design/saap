const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Client } = require('pg');
const path = require('path');

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const INFINITE_USER = '738425516155076629';

const IMG_DIAMANTE = path.join(__dirname, '..', 'attached_assets', 'file_000000007ba4720e8aa2e511258246ab_1774850433944.png');
const IMG_ULTRA    = path.join(__dirname, '..', 'attached_assets', 'file_00000000b660720e884274406d536a62_1774850433972.png');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('canjear')
        .setNameLocalizations({ 'en-US': 'redeem', 'en-GB': 'redeem' })
        .setDescription('Canjea Solecoins especiales por Premium')
        .setDescriptionLocalizations({ 'en-US': 'Redeem special Solecoins for Premium', 'en-GB': 'Redeem special Solecoins for Premium' })
        .addStringOption(opt =>
            opt.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('¿Qué quieres canjear?')
                .setDescriptionLocalizations({ 'en-US': 'What do you want to redeem?', 'en-GB': 'What do you want to redeem?' })
                .setRequired(true)
                .addChoices(
                    { name: 'Solecoindimante → 1 año de Premium', value: 'diamante' },
                    { name: 'SolecoinUltra → Premium PERMANENTE', value: 'ultra' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const tipo   = interaction.options.getString('tipo');
        const isInfinite = userId === INFINITE_USER;

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [userId]
            );

            const res = await db.query(
                'SELECT solecoins_diamante, solecoins_ultra, premium_until FROM economy WHERE user_id = $1',
                [userId]
            );
            const row      = res.rows[0];
            const diamantes = parseInt(row.solecoins_diamante) || 0;
            const ultras    = parseInt(row.solecoins_ultra)    || 0;

            if (tipo === 'diamante') {
                if (!isInfinite && diamantes < 1) {
                    return interaction.editReply({
                        content: `❌ No tienes ningún ${SCD} Solecoindimante para canjear.\nConsigue uno con </comprar:0> o girando la ruleta con </ruleta:0>.`
                    });
                }

                let newPremium;
                if (!isInfinite) {
                    const currentPremium = row.premium_until ? new Date(row.premium_until) : new Date();
                    const base = currentPremium > new Date() ? currentPremium : new Date();
                    newPremium = new Date(base);
                    newPremium.setFullYear(newPremium.getFullYear() + 1);

                    await db.query(
                        'UPDATE economy SET solecoins_diamante = solecoins_diamante - 1, premium_until = $1 WHERE user_id = $2',
                        [newPremium, userId]
                    );
                }

                const attachment = new AttachmentBuilder(IMG_DIAMANTE, { name: 'diamante.png' });
                const embed = new EmbedBuilder()
                    .setTitle(`${SCD} ¡Premium activado por 1 año!`)
                    .setDescription(
                        isInfinite
                            ? `> ✨ Eres el usuario especial. Tu Premium es **eterno** 👑`
                            : `> Canjeaste **1 ${SCD} Solecoindimante** por **1 año de Premium**.\n> Tu suscripción ahora vence el: \`${newPremium.toLocaleDateString('es-ES')}\`\n> ¡Gracias por tu apoyo! 💙`
                    )
                    .setColor('#00BFFF')
                    .setThumbnail('attachment://diamante.png')
                    .addFields(
                        { name: `${SCD} Diamantes canjeados`, value: isInfinite ? '∞' : '**-1**',                                   inline: true },
                        { name: '📅 Premium hasta',           value: isInfinite ? '**Siempre**' : `\`${newPremium?.toLocaleDateString('es-ES')}\``, inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Premium • ¡Disfruta tus beneficios VIP!' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });

            } else {
                if (!isInfinite && ultras < 1) {
                    return interaction.editReply({
                        content: `❌ No tienes ningún ${SCU} SolecoinUltra para canjear.\n¡Son extremadamente raros! Prueba en </ruleta:0> o cómpralo con </comprar:0>.`
                    });
                }

                if (!isInfinite) {
                    await db.query(
                        "UPDATE economy SET solecoins_ultra = solecoins_ultra - 1, premium_until = '9999-12-31 23:59:59' WHERE user_id = $1",
                        [userId]
                    );
                }

                const attachment = new AttachmentBuilder(IMG_ULTRA, { name: 'ultra.png' });
                const embed = new EmbedBuilder()
                    .setTitle(`${SCU} ¡¡PREMIUM PERMANENTE!! 🎊`)
                    .setDescription(
                        isInfinite
                            ? `> ✨ Eres el usuario especial. Tu Premium es **eterno** 👑`
                            : `> Canjeaste **1 ${SCU} SolecoinUltra** por **Premium PERMANENTE**.\n> ¡Nunca perderás tu acceso VIP! 👑\n> ¡Bienvenido a la élite de Soledad! 🌟`
                    )
                    .setColor('#FF2222')
                    .setThumbnail('attachment://ultra.png')
                    .addFields(
                        { name: `${SCU} Ultras canjeados`, value: isInfinite ? '∞' : '**-1**', inline: true },
                        { name: '👑 Premium',              value: '**PERMANENTE ♾️**',           inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Premium Permanente • ¡La élite te da la bienvenida!' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });
            }

        } finally {
            await db.end();
        }
    }
};
