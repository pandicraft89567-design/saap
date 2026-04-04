const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Client } = require('pg');
const path = require('path');

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const INFINITE_USER = '738425516155076629';

const PRECIO_DIAMANTE = 10000;
const PRECIO_ULTRA    = 500;

const IMG_DIAMANTE = path.join(__dirname, '..', 'attached_assets', 'file_000000007ba4720e8aa2e511258246ab_1774850433944.png');
const IMG_ULTRA    = path.join(__dirname, '..', 'attached_assets', 'file_00000000b660720e884274406d536a62_1774850433972.png');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('comprar')
        .setNameLocalizations({ 'en-US': 'buy', 'en-GB': 'buy' })
        .setDescription('Compra Solecoins especiales con tus monedas')
        .setDescriptionLocalizations({ 'en-US': 'Buy special Solecoins with your coins', 'en-GB': 'Buy special Solecoins with your coins' })
        .addStringOption(opt =>
            opt.setName('moneda')
                .setNameLocalizations({ 'en-US': 'coin', 'en-GB': 'coin' })
                .setDescription('¿Qué Solecoin quieres comprar?')
                .setDescriptionLocalizations({ 'en-US': 'Which Solecoin do you want to buy?', 'en-GB': 'Which Solecoin do you want to buy?' })
                .setRequired(true)
                .addChoices(
                    { name: `Solecoindimante — ${PRECIO_DIAMANTE} Solecoins comunes c/u`, value: 'diamante' },
                    { name: `SolecoinUltra — ${PRECIO_ULTRA} Solecoindimante c/u`, value: 'ultra' }
                )
        )
        .addIntegerOption(opt =>
            opt.setName('cantidad')
                .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
                .setDescription('Cantidad a comprar (mínimo 1)')
                .setDescriptionLocalizations({ 'en-US': 'Amount to buy (minimum 1)', 'en-GB': 'Amount to buy (minimum 1)' })
                .setMinValue(1)
                .setRequired(true)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const userId   = interaction.user.id;
        const moneda   = interaction.options.getString('moneda');
        const cantidad = interaction.options.getInteger('cantidad');
        const isInfinite = userId === INFINITE_USER;

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [userId]
            );

            const res = await db.query(
                'SELECT balance, solecoins_diamante FROM economy WHERE user_id = $1',
                [userId]
            );
            const row = res.rows[0];
            const balance   = parseInt(row.balance)            || 0;
            const diamantes = parseInt(row.solecoins_diamante) || 0;

            if (moneda === 'diamante') {
                const costo = PRECIO_DIAMANTE * cantidad;

                if (!isInfinite && balance < costo) {
                    return interaction.editReply({
                        content: `❌ Necesitas **${costo.toLocaleString()} ${SC}** para comprar **${cantidad} ${SCD}**.\nTu saldo: **${balance.toLocaleString()} ${SC}**.`
                    });
                }

                if (!isInfinite) {
                    await db.query(
                        'UPDATE economy SET balance = balance - $1, solecoins_diamante = solecoins_diamante + $2 WHERE user_id = $3',
                        [costo, cantidad, userId]
                    );
                }

                const attachment = new AttachmentBuilder(IMG_DIAMANTE, { name: 'diamante.png' });
                const embed = new EmbedBuilder()
                    .setTitle(`${SCD} ¡Compra Exitosa! — Solecoindimante`)
                    .setDescription(
                        isInfinite
                            ? `> ✨ Eres el usuario especial. Tienes ${SCD} **infinitos**.`
                            : `> Compraste **${cantidad} ${SCD} Solecoindimante** por **${costo.toLocaleString()} ${SC}**.\n> ¡Cada Solecoindimante equivale a **1 año de Premium**!\n> Canjéalo con el comando </canjear:0>.`
                    )
                    .setColor('#00BFFF')
                    .setThumbnail('attachment://diamante.png')
                    .addFields(
                        { name: `${SC} Solecoins usados`,      value: isInfinite ? '∞' : `**-${costo.toLocaleString()}**`, inline: true },
                        { name: `${SCD} Diamantes obtenidos`,  value: `**+${cantidad}**`,                                  inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Economía • Usa /canjear para obtener Premium' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });

            } else {
                const costo = PRECIO_ULTRA * cantidad;

                if (!isInfinite && diamantes < costo) {
                    return interaction.editReply({
                        content: `❌ Necesitas **${costo} ${SCD}** para comprar **${cantidad} ${SCU}**.\nTienes: **${diamantes} ${SCD}**.`
                    });
                }

                if (!isInfinite) {
                    await db.query(
                        'UPDATE economy SET solecoins_diamante = solecoins_diamante - $1, solecoins_ultra = solecoins_ultra + $2 WHERE user_id = $3',
                        [costo, cantidad, userId]
                    );
                }

                const attachment = new AttachmentBuilder(IMG_ULTRA, { name: 'ultra.png' });
                const embed = new EmbedBuilder()
                    .setTitle(`${SCU} ¡¡Compra Ultra!! — SolecoinUltra`)
                    .setDescription(
                        isInfinite
                            ? `> ✨ Eres el usuario especial. Tienes ${SCU} **infinitos**.`
                            : `> Compraste **${cantidad} ${SCU} SolecoinUltra** por **${costo} ${SCD}**.\n> ¡Cada SolecoinUltra te da **Premium PERMANENTE**!\n> Canjéalo con el comando </canjear:0>.`
                    )
                    .setColor('#FF2222')
                    .setThumbnail('attachment://ultra.png')
                    .addFields(
                        { name: `${SCD} Diamantes usados`,   value: isInfinite ? '∞' : `**-${costo}**`, inline: true },
                        { name: `${SCU} Ultras obtenidos`,   value: `**+${cantidad}**`,                  inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Economía • Usa /canjear para obtener Premium Permanente' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });
            }

        } finally {
            await db.end();
        }
    }
};
