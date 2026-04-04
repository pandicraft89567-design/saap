const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { isPremium, premiumDenied } = require('../utils/checkPremium');

const BONUS_ITEMS = [
    { nombre: '🃏 Carta Rara', valor: 500 },
    { nombre: '💎 Gema Especial', valor: 750 },
    { nombre: '🌟 Estrella Dorada', valor: 1000 },
    { nombre: '🎴 Carta Épica', valor: 1500 },
    { nombre: '👑 Corona Premium', valor: 2000 },
    { nombre: '🔮 Orbe Místico', valor: 600 },
    { nombre: '🎁 Caja Sorpresa', valor: 800 },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('daily-premium')
        .setNameLocalizations({ 'en-US': 'daily-premium', 'en-GB': 'daily-premium' })
        .setDescription('💎 [PREMIUM] Recoge tu recompensa diaria especial (3× más Solecoins)')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Claim your special daily reward (3× more Solecoins)', 'en-GB': '💎 [PREMIUM] Claim your special daily reward (3× more Solecoins)' }),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        await interaction.deferReply();

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [interaction.user.id]
            );

            const res = await db.query(
                'SELECT last_daily FROM economy WHERE user_id = $1',
                [interaction.user.id]
            );

            const lastDaily = res.rows[0]?.last_daily;
            const ahora = new Date();

            if (lastDaily) {
                const diff = ahora - new Date(lastDaily);
                const horasRestantes = 24 - diff / (1000 * 60 * 60);

                if (horasRestantes > 0) {
                    const horas = Math.floor(horasRestantes);
                    const minutos = Math.floor((horasRestantes - horas) * 60);

                    return await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#FF9500')
                            .setTitle('⏳ Ya recogiste tu daily premium')
                            .setDescription(`Vuelve en **${horas}h ${minutos}m** para tu próxima recompensa.`)
                            .setFooter({ text: 'Soledad ❣ Premium' })
                            .setTimestamp()]
                    });
                }
            }

            const baseReward = Math.floor(Math.random() * 200) + 300;
            const premiumMultiplier = 3;
            const totalSolecoins = baseReward * premiumMultiplier;

            const bonus = BONUS_ITEMS[Math.floor(Math.random() * BONUS_ITEMS.length)];
            const totalConBonus = totalSolecoins + bonus.valor;

            await db.query(
                'UPDATE economy SET balance = balance + $1, last_daily = $2 WHERE user_id = $3',
                [totalConBonus, ahora, interaction.user.id]
            );

            const res2 = await db.query(
                'SELECT balance FROM economy WHERE user_id = $1',
                [interaction.user.id]
            );
            const nuevoBalance = res2.rows[0]?.balance || totalConBonus;

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('<a:lux:1385222769566027836> Daily Premium Recogido')
                .setDescription(`¡Recompensa especial de **${interaction.user.username}**!`)
                .addFields(
                    { name: '💰 Solecoins Base', value: `${baseReward} × 3 = **${totalSolecoins} <:solecoin:1487120026963021884>**`, inline: false },
                    { name: `${bonus.nombre} Bonus`, value: `+**${bonus.valor} <:solecoin:1487120026963021884>**`, inline: false },
                    { name: '✨ Total Ganado', value: `**${totalConBonus} <:solecoin:1487120026963021884>**`, inline: true },
                    { name: '🏦 Saldo Total', value: `**${nuevoBalance} <:solecoin:1487120026963021884>**`, inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: '3× más que el daily normal • Soledad ❣ Premium' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en daily-premium:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error al reclamar tu daily premium.' });
        } finally {
            await db.end();
        }
    },
};
