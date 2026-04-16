const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { Pool } = require('pg');
const { getLanguage } = require('../utils/i18n');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const INFINITE_USER = '738425516155076629';

const ITEMS = {
    premium_1d:  { label: `💎 Premium 24h`,        desc: `1,000 ${SC} Solecoins`,           price: 1000,  days: 1,   type: 'premium',  currency: 'sc',  color: '#00FFFF' },
    premium_7d:  { label: `💎 Premium 7 días`,      desc: `5,000 ${SC} Solecoins`,           price: 5000,  days: 7,   type: 'premium',  currency: 'sc',  color: '#00FFFF' },
    premium_30d: { label: `💎 Premium 30 días`,     desc: `15,000 ${SC} Solecoins`,          price: 15000, days: 30,  type: 'premium',  currency: 'sc',  color: '#00FFFF' },
    diamante_1:  { label: `${SCD} 1 Solecoindimante`,  desc: `10,000 ${SC} Solecoins`,      price: 10000, qty: 1,    type: 'diamante', currency: 'sc',  color: '#00BFFF' },
    diamante_5:  { label: `${SCD} 5 Solecoindimantes`, desc: `50,000 ${SC} Solecoins`,      price: 50000, qty: 5,    type: 'diamante', currency: 'sc',  color: '#00BFFF' },
    diamante_10: { label: `${SCD} 10 Solecoindimantes`,desc: `100,000 ${SC} Solecoins`,     price: 100000,qty: 10,   type: 'diamante', currency: 'sc',  color: '#00BFFF' },
    ultra_1:     { label: `${SCU} 1 SolecoinUltra`,    desc: `500 ${SCD} Solecoindimantes`, price: 500,   qty: 1,    type: 'ultra',    currency: 'scd', color: '#FF2222' },
    ultra_5:     { label: `${SCU} 5 SolecoinUltra`,    desc: `2,500 ${SCD} Solecoindimantes`,price:2500,  qty: 5,    type: 'ultra',    currency: 'scd', color: '#FF2222' },
    ultra_10:    { label: `${SCU} 10 SolecoinUltra`,   desc: `5,000 ${SCD} Solecoindimantes`,price:5000,  qty: 10,   type: 'ultra',    currency: 'scd', color: '#FF2222' },
};

function buildShopEmbed(balance, diamantes, ultras) {
    return new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle('🛒 Tienda de Soledad ❣')
        .setDescription(
            `Bienvenido/a a la tienda. Elige un artículo del menú para ver sus detalles y confirmar la compra.\n\n` +
            `**Tu saldo:**\n` +
            `${SC} **${balance.toLocaleString()}** Solecoins\n` +
            `${SCD} **${diamantes.toLocaleString()}** Solecoindimantes\n` +
            `${SCU} **${ultras.toLocaleString()}** SolecoinUltra`
        )
        .addFields(
            { name: '💎 Premium', value: `24h — 1,000 ${SC}\n7d — 5,000 ${SC}\n30d — 15,000 ${SC}`, inline: true },
            { name: `${SCD} Diamante`, value: `1 — 10,000 ${SC}\n5 — 50,000 ${SC}\n10 — 100,000 ${SC}`, inline: true },
            { name: `${SCU} Ultra`, value: `1 — 500 ${SCD}\n5 — 2,500 ${SCD}\n10 — 5,000 ${SCD}`, inline: true },
        )
        .setFooter({ text: 'Soledad ❣ • Tienda • También en whop.com/soledad-858d' })
        .setTimestamp();
}

function buildSelectMenu(sessionId) {
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`shop_select_${sessionId}`)
            .setPlaceholder('🛍️ Elige qué quieres comprar...')
            .addOptions([
                { label: 'Premium 24h',         description: `1,000 Solecoins — 1 día de Premium`,          value: 'premium_1d',  emoji: '💎' },
                { label: 'Premium 7 días',       description: `5,000 Solecoins — 7 días de Premium`,         value: 'premium_7d',  emoji: '💎' },
                { label: 'Premium 30 días',      description: `15,000 Solecoins — 30 días de Premium`,       value: 'premium_30d', emoji: '💎' },
                { label: '1 Solecoindimante',    description: `10,000 Solecoins — ¡equivale a 1 año Premium!`,value: 'diamante_1',  emoji: '🔷' },
                { label: '5 Solecoindimantes',   description: `50,000 Solecoins`,                            value: 'diamante_5',  emoji: '🔷' },
                { label: '10 Solecoindimantes',  description: `100,000 Solecoins`,                           value: 'diamante_10', emoji: '🔷' },
                { label: '1 SolecoinUltra',      description: `500 Solecoindimantes — Premium PERMANENTE`,   value: 'ultra_1',     emoji: '🔴' },
                { label: '5 SolecoinUltra',      description: `2,500 Solecoindimantes`,                      value: 'ultra_5',     emoji: '🔴' },
                { label: '10 SolecoinUltra',     description: `5,000 Solecoindimantes`,                      value: 'ultra_10',    emoji: '🔴' },
            ])
    );
}

function buildItemEmbed(itemKey, balance, diamantes, ultras, isInfinite) {
    const item = ITEMS[itemKey];
    const canAfford = isInfinite || (item.currency === 'sc' ? balance >= item.price : diamantes >= item.price);

    let description = '';
    if (item.type === 'premium') {
        description = `Comprar **${item.days} día(s) de Premium** te costará **${item.price.toLocaleString()} ${SC}**.\n\n`;
        description += canAfford
            ? `✅ Tienes suficiente saldo. ¿Cerramos el trato?`
            : `❌ No tienes suficientes Solecoins.\nNecesitas: **${item.price.toLocaleString()}** | Tienes: **${balance.toLocaleString()}**\n\n💳 También puedes comprar en [whop.com/soledad-858d](https://whop.com/soledad-858d)`;
    } else if (item.type === 'diamante') {
        description = `Comprar **${item.qty} Solecoindimante(s)** te costará **${item.price.toLocaleString()} ${SC}**.\n\n`;
        description += canAfford
            ? `✅ Tienes suficiente saldo. ¿Cerramos el trato?`
            : `❌ No tienes suficientes Solecoins.\nNecesitas: **${item.price.toLocaleString()}** | Tienes: **${balance.toLocaleString()}**`;
    } else {
        description = `Comprar **${item.qty} SolecoinUltra** te costará **${item.price.toLocaleString()} ${SCD}**.\n\n`;
        description += canAfford
            ? `✅ Tienes suficiente saldo. ¿Cerramos el trato?`
            : `❌ No tienes suficientes Solecoindimantes.\nNecesitas: **${item.price.toLocaleString()}** | Tienes: **${diamantes.toLocaleString()}**`;
    }

    return new EmbedBuilder()
        .setColor(canAfford ? item.color : '#ED4245')
        .setTitle(`🛒 ${item.label}`)
        .setDescription(description)
        .addFields(
            { name: '💰 Precio', value: `**${item.price.toLocaleString()}** ${item.currency === 'sc' ? SC : SCD}`, inline: true },
            { name: '💳 Tu saldo', value: item.currency === 'sc' ? `**${balance.toLocaleString()}** ${SC}` : `**${diamantes.toLocaleString()}** ${SCD}`, inline: true },
        )
        .setFooter({ text: 'Soledad ❣ • Tienda' })
        .setTimestamp();
}

function buildConfirmButtons(sessionId, itemKey, canAfford) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`shop_buy_${sessionId}_${itemKey}`)
            .setLabel('✅ Cerrar trato')
            .setStyle(ButtonStyle.Success)
            .setDisabled(!canAfford),
        new ButtonBuilder()
            .setCustomId(`shop_cancel_${sessionId}`)
            .setLabel('❌ Negar')
            .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
            .setCustomId(`shop_back_${sessionId}`)
            .setLabel('🏠 Volver al inicio')
            .setStyle(ButtonStyle.Secondary),
    );
}

async function getBalance(userId) {
    await pool.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);
    const res = await pool.query(
        'SELECT balance, solecoins_diamante, solecoins_ultra, premium_until FROM economy WHERE user_id = $1',
        [userId]
    );
    const row = res.rows[0];
    return {
        balance:   parseInt(row.balance)             || 0,
        diamantes: parseInt(row.solecoins_diamante)  || 0,
        ultras:    parseInt(row.solecoins_ultra)     || 0,
        premiumUntil: row.premium_until ? new Date(row.premium_until) : null,
    };
}

async function processPurchase(userId, itemKey, isInfinite) {
    const item = ITEMS[itemKey];
    const { balance, diamantes, premiumUntil } = await getBalance(userId);

    if (!isInfinite) {
        if (item.currency === 'sc' && balance < item.price) return { ok: false, reason: 'saldo insuficiente' };
        if (item.currency === 'scd' && diamantes < item.price) return { ok: false, reason: 'diamantes insuficientes' };
    }

    if (item.type === 'premium') {
        let base = (premiumUntil && premiumUntil > new Date()) ? premiumUntil : new Date();
        const newDate = new Date(base.getTime() + item.days * 86400000);
        if (!isInfinite) {
            await pool.query(
                'UPDATE economy SET balance = balance - $1, premium_until = $2 WHERE user_id = $3',
                [item.price, newDate, userId]
            );
        }
        return { ok: true, newDate };
    }

    if (item.type === 'diamante') {
        if (!isInfinite) {
            await pool.query(
                'UPDATE economy SET balance = balance - $1, solecoins_diamante = solecoins_diamante + $2 WHERE user_id = $3',
                [item.price, item.qty, userId]
            );
        }
        return { ok: true };
    }

    if (item.type === 'ultra') {
        if (!isInfinite) {
            await pool.query(
                'UPDATE economy SET solecoins_diamante = solecoins_diamante - $1, solecoins_ultra = solecoins_ultra + $2 WHERE user_id = $3',
                [item.price, item.qty, userId]
            );
        }
        return { ok: true };
    }

    return { ok: false, reason: 'item desconocido' };
}

function buildSuccessEmbed(itemKey, result, isInfinite) {
    const item = ITEMS[itemKey];
    let desc = '';

    if (item.type === 'premium') {
        desc = isInfinite
            ? `✨ Usuario especial — Premium infinito.`
            : `¡Compraste **${item.days} día(s) de Premium**!\nTu suscripción vence el: \`${result.newDate.toLocaleDateString()}\``;
    } else if (item.type === 'diamante') {
        desc = isInfinite
            ? `✨ Usuario especial — Diamantes infinitos.`
            : `¡Compraste **${item.qty} ${SCD} Solecoindimante(s)**!\nCada uno equivale a 1 año de Premium. Usa \`/canjear\`.`;
    } else {
        desc = isInfinite
            ? `✨ Usuario especial — Ultras infinitos.`
            : `¡Compraste **${item.qty} ${SCU} SolecoinUltra**!\nCada uno da Premium PERMANENTE. Usa \`/canjear\`.`;
    }

    return new EmbedBuilder()
        .setColor('#57F287')
        .setTitle('🎉 ¡Trato cerrado!')
        .setDescription(desc)
        .addFields(
            { name: '💰 Pagado', value: isInfinite ? '∞' : `**${item.price.toLocaleString()}** ${item.currency === 'sc' ? SC : SCD}`, inline: true },
            { name: '📦 Obtenido', value: item.label, inline: true },
        )
        .setFooter({ text: 'Soledad ❣ • Tienda — ¡Gracias por tu compra!' })
        .setTimestamp();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Abre la tienda de Soledad ❣'),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const userId = interaction.user.id;
        const isInfinite = userId === INFINITE_USER;
        const sessionId = `${userId}_${Date.now()}`;

        let bal = await getBalance(userId).catch(() => ({ balance: 0, diamantes: 0, ultras: 0 }));

        const shopEmbed = buildShopEmbed(bal.balance, bal.diamantes, bal.ultras);
        const selectRow = buildSelectMenu(sessionId);

        const msg = await interaction.editReply({ embeds: [shopEmbed], components: [selectRow] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === userId,
            time: 120000,
        });

        let selectedItem = null;

        collector.on('collect', async (btn) => {
            await btn.deferUpdate().catch(() => {});

            if (btn.customId.startsWith('shop_select_')) {
                selectedItem = btn.values[0];
                bal = await getBalance(userId).catch(() => bal);

                const canAfford = isInfinite || (
                    ITEMS[selectedItem].currency === 'sc'
                        ? bal.balance >= ITEMS[selectedItem].price
                        : bal.diamantes >= ITEMS[selectedItem].price
                );

                const itemEmbed = buildItemEmbed(selectedItem, bal.balance, bal.diamantes, bal.ultras, isInfinite);
                const buttons   = buildConfirmButtons(sessionId, selectedItem, canAfford);

                await interaction.editReply({ embeds: [itemEmbed], components: [buttons] });

            } else if (btn.customId.startsWith('shop_buy_')) {
                if (!selectedItem) return;
                collector.stop('done');

                const result = await processPurchase(userId, selectedItem, isInfinite);

                if (!result.ok) {
                    const errEmbed = new EmbedBuilder()
                        .setColor('#ED4245')
                        .setTitle('❌ Compra fallida')
                        .setDescription(`No se pudo completar la compra: **${result.reason}**.`)
                        .setFooter({ text: 'Soledad ❣ • Tienda' });
                    return interaction.editReply({ embeds: [errEmbed], components: [] });
                }

                const successEmbed = buildSuccessEmbed(selectedItem, result, isInfinite);
                await interaction.editReply({ embeds: [successEmbed], components: [] });

            } else if (btn.customId.startsWith('shop_cancel_')) {
                collector.stop('done');
                const cancelEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('❌ Trato negado')
                    .setDescription('Has cancelado la compra. Vuelve cuando quieras.')
                    .setFooter({ text: 'Soledad ❣ • Tienda' });
                await interaction.editReply({ embeds: [cancelEmbed], components: [] });

            } else if (btn.customId.startsWith('shop_back_')) {
                selectedItem = null;
                bal = await getBalance(userId).catch(() => bal);
                const shopEmbed2 = buildShopEmbed(bal.balance, bal.diamantes, bal.ultras);
                await interaction.editReply({ embeds: [shopEmbed2], components: [buildSelectMenu(sessionId)] });
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                const timeoutEmbed = new EmbedBuilder()
                    .setColor('#95A5A6')
                    .setTitle('⏰ Tienda cerrada')
                    .setDescription('Se agotó el tiempo. Usa `/shop` para abrir la tienda de nuevo.')
                    .setFooter({ text: 'Soledad ❣ • Tienda' });
                await interaction.editReply({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
            }
        });
    },
};
