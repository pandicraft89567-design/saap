const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { isPremium, premiumDenied } = require('../utils/checkPremium');

const SC = '<:Solecoincomun:1488044566907981995>';
const PROTECTED_USER_ID = '832641595110719509';
const COOLDOWNS = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;
const COMISION = 0.05;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transferir')
        .setNameLocalizations({ 'en-US': 'transfer', 'en-GB': 'transfer' })
        .setDescription('💎 [PREMIUM] Transfiere Solecoins a otro usuario')
        .setDescriptionLocalizations({ 'en-US': '💎 [PREMIUM] Transfer Solecoins to another user', 'en-GB': '💎 [PREMIUM] Transfer Solecoins to another user' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que transferir')
                .setDescriptionLocalizations({ 'en-US': 'User to transfer to', 'en-GB': 'User to transfer to' })
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('cantidad')
                .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
                .setDescription('Cantidad de Solecoins a transferir (mín. 10)')
                .setDescriptionLocalizations({ 'en-US': 'Amount of Solecoins to transfer (min. 10)', 'en-GB': 'Amount of Solecoins to transfer (min. 10)' })
                .setMinValue(10)
                .setRequired(true)),

    async execute(interaction) {
        if (!await isPremium(interaction.user.id)) return premiumDenied(interaction);

        const target = interaction.options.getUser('usuario');
        const cantidad = interaction.options.getInteger('cantidad');

        if (target.id === interaction.user.id) {
            return await interaction.reply({ content: '❌ No puedes transferirte Solecoins a ti mismo.', flags: 64 });
        }

        if (target.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (target.bot) {
            return await interaction.reply({ content: '❌ No puedes transferirle Solecoins a un bot.', flags: 64 });
        }

        const cooldownKey = interaction.user.id;
        const lastTransfer = COOLDOWNS.get(cooldownKey);
        if (lastTransfer && Date.now() - lastTransfer < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastTransfer)) / 60000);
            return await interaction.reply({
                content: `⏳ Espera **${remaining} minuto${remaining !== 1 ? 's' : ''}** antes de transferir de nuevo.`,
                flags: 64
            });
        }

        await interaction.deferReply();

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [interaction.user.id]);
            await db.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [target.id]);

            const res = await db.query('SELECT balance FROM economy WHERE user_id = $1', [interaction.user.id]);
            const balanceEmisor = res.rows[0]?.balance || 0;

            const comisionCantidad = Math.ceil(cantidad * COMISION);
            const totalDescontado = cantidad + comisionCantidad;

            if (balanceEmisor < totalDescontado) {
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#E74C3C')
                        .setTitle('❌ Saldo Insuficiente')
                        .setDescription(`Necesitas **${totalDescontado} ${SC}** para esta transferencia (incluye ${comisionCantidad} de comisión).\nTu saldo actual: **${balanceEmisor} ${SC}**`)
                        .setTimestamp()]
                });
            }

            COOLDOWNS.set(cooldownKey, Date.now());

            await db.query('UPDATE economy SET balance = balance - $1 WHERE user_id = $2', [totalDescontado, interaction.user.id]);
            await db.query('UPDATE economy SET balance = balance + $1 WHERE user_id = $2', [cantidad, target.id]);

            const [resEmisor, resReceptor] = await Promise.all([
                db.query('SELECT balance FROM economy WHERE user_id = $1', [interaction.user.id]),
                db.query('SELECT balance FROM economy WHERE user_id = $1', [target.id])
            ]);

            const embed = new EmbedBuilder()
                .setColor('#00FFFF')
                .setTitle('<a:lux:1385222769566027836> Transferencia Completada')
                .addFields(
                    { name: '📤 Emisor', value: `${interaction.user.username}\n**-${totalDescontado} ${SC}**\nSaldo: ${resEmisor.rows[0]?.balance} ${SC}`, inline: true },
                    { name: '➡️', value: '\u200B', inline: true },
                    { name: '📥 Receptor', value: `${target.username}\n**+${cantidad} ${SC}**\nSaldo: ${resReceptor.rows[0]?.balance} ${SC}`, inline: true },
                    { name: '💼 Comisión (5%)', value: `${comisionCantidad} ${SC}`, inline: false }
                )
                .setFooter({ text: 'Soledad ❣ Premium • Transferencia segura' })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error('Error en transferir:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error en la transferencia.' });
        } finally {
            await db.end();
        }
    },
};
