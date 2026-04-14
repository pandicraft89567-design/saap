const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { Client } = require('pg');
const { getLanguage, t } = require('../utils/i18n');
const path = require('path');

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const INFINITE_USER  = '738425516155076629';
const PRECIO_DIAMANTE = 10000;
const PRECIO_ULTRA    = 500;

const IMG_DIAMANTE = path.join(__dirname, '..', 'attached_assets', 'file_000000007ba4720e8aa2e511258246ab_1774850433944.png');
const IMG_ULTRA    = path.join(__dirname, '..', 'attached_assets', 'file_00000000b660720e884274406d536a62_1774850433972.png');

const PRICES    = { premium_1d: 1000,  premium_7d: 5000,  premium_30d: 15000 };
const DURATIONS = { premium_1d: 1,     premium_7d: 7,     premium_30d: 30    };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setNameLocalizations({ 'en-US': 'shop', 'en-GB': 'shop' })
        .setDescription('Tienda: compra Premium o Solecoins especiales')
        .setDescriptionLocalizations({ 'en-US': 'Shop: buy Premium or special Solecoins', 'en-GB': 'Shop: buy Premium or special Solecoins' })
        .addStringOption(opt => opt
            .setName('item')
            .setNameLocalizations({ 'en-US': 'item', 'en-GB': 'item' })
            .setDescription('¿Qué quieres comprar?')
            .setDescriptionLocalizations({ 'en-US': 'What do you want to buy?', 'en-GB': 'What do you want to buy?' })
            .setRequired(true)
            .addChoices(
                { name: `Premium 24h  — 1,000 ${' '}Solecoins`,          value: 'premium_1d'  },
                { name: `Premium 7d   — 5,000 ${' '}Solecoins`,          value: 'premium_7d'  },
                { name: `Premium 30d  — 15,000 Solecoins`,                value: 'premium_30d' },
                { name: `Solecoindimante — 10,000 Solecoins c/u`,         value: 'diamante'    },
                { name: `SolecoinUltra   — 500 Solecoindimante c/u`,      value: 'ultra'       },
            )
        )
        .addIntegerOption(opt => opt
            .setName('cantidad')
            .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
            .setDescription('Cantidad (solo para Diamante y Ultra, mínimo 1)')
            .setDescriptionLocalizations({ 'en-US': 'Amount (only for Diamante and Ultra, minimum 1)', 'en-GB': 'Amount (only for Diamante and Ultra, minimum 1)' })
            .setMinValue(1)
            .setRequired(false)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const lang      = await getLanguage(interaction.guildId);
        const userId    = interaction.user.id;
        const item      = interaction.options.getString('item');
        const cantidad  = interaction.options.getInteger('cantidad') ?? 1;
        const isInfinite = userId === INFINITE_USER;

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [userId]
            );

            const res = await db.query(
                'SELECT balance, solecoins_diamante, premium_until FROM economy WHERE user_id = $1',
                [userId]
            );
            const row       = res.rows[0];
            const balance   = parseInt(row.balance)            || 0;
            const diamantes = parseInt(row.solecoins_diamante) || 0;

            // ── PREMIUM ──────────────────────────────────────────────────────
            if (['premium_1d', 'premium_7d', 'premium_30d'].includes(item)) {
                const price = PRICES[item];
                const days  = DURATIONS[item];

                if (!isInfinite && balance < price) {
                    const whopNote = `\n\n💎 ¿No tienes suficientes Solecoins? También puedes suscribirte en [**whop.com/soledad-858d**](https://whop.com/soledad-858d).`;
                    return interaction.editReply({
                        content: t('SHOP_INSUFFICIENT', lang, { price, balance }) + whopNote
                    });
                }

                let currentPremium = row.premium_until ? new Date(row.premium_until) : new Date();
                if (currentPremium < new Date()) currentPremium = new Date();
                const newPremiumDate = new Date(currentPremium.getTime() + days * 86400000);

                if (!isInfinite) {
                    await db.query(
                        'UPDATE economy SET balance = balance - $1, premium_until = $2 WHERE user_id = $3',
                        [price, newPremiumDate, userId]
                    );
                }

                const titles = {
                    es: '💎 ¡Compra Premium Exitosa!', en: '💎 Premium Purchase Successful!',
                    fr: '💎 Achat Premium Réussi !',   pt: '💎 Compra Premium Realizada!',
                    de: '💎 Premium-Kauf Erfolgreich!', it: '💎 Acquisto Premium Riuscito!',
                    ja: '💎 プレミアム購入成功！',       ko: '💎 프리미엄 구매 성공!',
                    zh: '💎 高级购买成功！',             ru: '💎 Покупка Премиума Успешна!',
                    ar: '💎 تم الشراء بنجاح!',         tr: '💎 Premium Satın Alma Başarılı!'
                };
                const descs = {
                    es: `Has comprado **${days} día(s)** de Premium usando ${SC} Solecoins.\nTu suscripción ahora vence el: \`${newPremiumDate.toLocaleDateString()}\``,
                    en: `You bought **${days} day(s)** of Premium using ${SC} Solecoins.\nYour subscription now expires on: \`${newPremiumDate.toLocaleDateString()}\``,
                };

                const embed = new EmbedBuilder()
                    .setTitle(titles[lang] || titles.es)
                    .setDescription(descs[lang] || descs.es)
                    .setColor('#00FFFF')
                    .addFields(
                        { name: `${SC} Solecoins pagados`, value: isInfinite ? '∞' : `**-${price.toLocaleString()}**`, inline: true },
                        { name: '📅 Días añadidos',         value: `**${days}**`,                                       inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • También disponible en whop.com/soledad-858d' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed] });
            }

            // ── SOLECOINDIMANTE ───────────────────────────────────────────────
            if (item === 'diamante') {
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
                            : `> Compraste **${cantidad} ${SCD} Solecoindimante** por **${costo.toLocaleString()} ${SC}**.\n> ¡Cada Solecoindimante equivale a **1 año de Premium**!\n> Canjéalo con </canjear:0>.`
                    )
                    .setColor('#00BFFF')
                    .setThumbnail('attachment://diamante.png')
                    .addFields(
                        { name: `${SC} Solecoins usados`,     value: isInfinite ? '∞' : `**-${costo.toLocaleString()}**`, inline: true },
                        { name: `${SCD} Diamantes obtenidos`, value: `**+${cantidad}**`,                                  inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Economía • Usa /canjear para obtener Premium' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });
            }

            // ── SOLECOINULTRA ─────────────────────────────────────────────────
            if (item === 'ultra') {
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
                            : `> Compraste **${cantidad} ${SCU} SolecoinUltra** por **${costo} ${SCD}**.\n> ¡Cada SolecoinUltra te da **Premium PERMANENTE**!\n> Canjéalo con </canjear:0>.`
                    )
                    .setColor('#FF2222')
                    .setThumbnail('attachment://ultra.png')
                    .addFields(
                        { name: `${SCD} Diamantes usados`, value: isInfinite ? '∞' : `**-${costo}**`, inline: true },
                        { name: `${SCU} Ultras obtenidos`, value: `**+${cantidad}**`,                  inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Economía • Usa /canjear para Premium Permanente' })
                    .setTimestamp();

                return interaction.editReply({ embeds: [embed], files: [attachment] });
            }

        } finally {
            await db.end();
        }
    },
};
