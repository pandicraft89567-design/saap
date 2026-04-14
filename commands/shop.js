const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const pool = require('../database/db'); // 👈 USA Pool GLOBAL
const path = require('path');

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const INFINITE_USER = '738425516155076629';

const PRICES = {
    premium_1d: { price: 1000, days: 1 },
    premium_7d: { price: 5000, days: 7 },
    premium_30d: { price: 15000, days: 30 },
    diamante: 10000,
    ultra: 500
};

const IMG = {
    diamante: path.join(__dirname, '..', 'attached_assets', 'diamante.png'),
    ultra: path.join(__dirname, '..', 'attached_assets', 'ultra.png')
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Tienda del bot')
        .addStringOption(opt =>
            opt.setName('item')
                .setDescription('Qué quieres comprar')
                .setRequired(true)
                .addChoices(
                    { name: 'Premium 1 día', value: 'premium_1d' },
                    { name: 'Premium 7 días', value: 'premium_7d' },
                    { name: 'Premium 30 días', value: 'premium_30d' },
                    { name: 'Solecoindimante', value: 'diamante' },
                    { name: 'SolecoinUltra', value: 'ultra' }
                )
        )
        .addIntegerOption(opt =>
            opt.setName('cantidad')
                .setDescription('Cantidad')
                .setMinValue(1)
        ),

    async execute(interaction) {
        await interaction.deferReply();

        const userId = interaction.user.id;
        const item = interaction.options.getString('item');
        const cantidad = interaction.options.getInteger('cantidad') ?? 1;
        const isInfinite = userId === INFINITE_USER;

        try {
            // 🔹 Obtener o crear usuario
            await pool.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [userId]
            );

            const { rows } = await pool.query(
                'SELECT * FROM economy WHERE user_id = $1',
                [userId]
            );

            if (!rows.length) {
                return interaction.editReply('❌ Error cargando usuario');
            }

            const user = rows[0];

            // 🔹 SWITCH LIMPIO
            switch (item) {

                case 'premium_1d':
                case 'premium_7d':
                case 'premium_30d':
                    return handlePremium(interaction, user, item, isInfinite);

                case 'diamante':
                    return handleDiamante(interaction, user, cantidad, isInfinite);

                case 'ultra':
                    return handleUltra(interaction, user, cantidad, isInfinite);

                default:
                    return interaction.editReply('❌ Item inválido');
            }

        } catch (error) {
            console.error('SHOP ERROR:', error);

            return interaction.editReply({
                content: '❌ Ocurrió un error interno'
            });
        }
    }
};


// ================= FUNCIONES =================

// 💎 PREMIUM
async function handlePremium(interaction, user, item, isInfinite) {
    const { price, days } = PRICES[item];

    if (!isInfinite && user.balance < price) {
        return interaction.editReply('❌ No tienes suficiente dinero');
    }

    let current = user.premium_until ? new Date(user.premium_until) : new Date();
    if (current < new Date()) current = new Date();

    const newDate = new Date(current.getTime() + days * 86400000);

    if (!isInfinite) {
        await pool.query(
            'UPDATE economy SET balance = balance - $1, premium_until = $2 WHERE user_id = $3',
            [price, newDate, user.user_id]
        );
    }

    const embed = new EmbedBuilder()
        .setTitle('💎 Premium comprado')
        .setDescription(`Has comprado ${days} día(s) de premium`)
        .addFields(
            { name: 'Precio', value: isInfinite ? '∞' : price.toString(), inline: true },
            { name: 'Expira', value: newDate.toLocaleDateString(), inline: true }
        )
        .setColor('Aqua');

    return interaction.editReply({ embeds: [embed] });
}


// 💎 DIAMANTE
async function handleDiamante(interaction, user, cantidad, isInfinite) {
    const costo = PRICES.diamante * cantidad;

    if (!isInfinite && user.balance < costo) {
        return interaction.editReply('❌ No tienes suficiente dinero');
    }

    if (!isInfinite) {
        await pool.query(
            'UPDATE economy SET balance = balance - $1, solecoins_diamante = solecoins_diamante + $2 WHERE user_id = $3',
            [costo, cantidad, user.user_id]
        );
    }

    const embed = new EmbedBuilder()
        .setTitle('💠 Compra exitosa')
        .setDescription(`Compraste ${cantidad} diamantes`)
        .setColor('Blue');

    return interaction.editReply({ embeds: [embed] });
}


// 🔥 ULTRA
async function handleUltra(interaction, user, cantidad, isInfinite) {
    const costo = PRICES.ultra * cantidad;

    if (!isInfinite && user.solecoins_diamante < costo) {
        return interaction.editReply('❌ No tienes suficientes diamantes');
    }

    if (!isInfinite) {
        await pool.query(
            'UPDATE economy SET solecoins_diamante = solecoins_diamante - $1, solecoins_ultra = solecoins_ultra + $2 WHERE user_id = $3',
            [costo, cantidad, user.user_id]
        );
    }

    const embed = new EmbedBuilder()
        .setTitle('🔥 Compra Ultra')
        .setDescription(`Compraste ${cantidad} Ultra`)
        .setColor('Red');

    return interaction.editReply({ embeds: [embed] });
}
