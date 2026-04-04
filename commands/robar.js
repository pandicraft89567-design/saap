const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');

const SC = '<:Solecoincomun:1488044566907981995>';
const PROTECTED_USER_ID = '832641595110719509';
const COOLDOWNS = new Map();
const COOLDOWN_MS = 30 * 60 * 1000;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('robar')
        .setNameLocalizations({ 'en-US': 'steal', 'en-GB': 'steal' })
        .setDescription('Intenta robar Solecoins a otro usuario (30 min de cooldown)')
        .setDescriptionLocalizations({ 'en-US': 'Try to steal Solecoins from another user (30 min cooldown)', 'en-GB': 'Try to steal Solecoins from another user (30 min cooldown)' })
        .addUserOption(option =>
            option.setName('usuario')
                .setNameLocalizations({ 'en-US': 'user', 'en-GB': 'user' })
                .setDescription('Usuario al que intentar robar')
                .setDescriptionLocalizations({ 'en-US': 'User to try to steal from', 'en-GB': 'User to try to steal from' })
                .setRequired(true)),

    async execute(interaction) {
        const target = interaction.options.getUser('usuario');
        const thief = interaction.user;

        if (target.id === PROTECTED_USER_ID) {
            return await interaction.reply({
                content: '<:kokoro:1385223047207850024> No, ella es mi novia así que no puedes hacer eso...',
                flags: 64
            });
        }

        if (target.id === thief.id) {
            return await interaction.reply({ content: '🤨 No puedes robarte a ti mismo.', flags: 64 });
        }

        if (target.bot) {
            return await interaction.reply({ content: '🤖 Los bots no tienen Solecoins que robar.', flags: 64 });
        }

        const cooldownKey = thief.id;
        const lastRob = COOLDOWNS.get(cooldownKey);
        if (lastRob && Date.now() - lastRob < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (Date.now() - lastRob)) / 60000);
            return await interaction.reply({
                content: `⏳ Ya robaste recientemente. Espera **${remaining} minuto${remaining !== 1 ? 's' : ''}** más.`,
                flags: 64
            });
        }

        await interaction.deferReply();

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [thief.id]);
            await db.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [target.id]);

            const res = await db.query('SELECT balance FROM economy WHERE user_id = $1', [target.id]);
            const targetBalance = res.rows[0]?.balance || 0;

            if (targetBalance < 10) {
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#ff9500')
                        .setTitle('😅 Robo Fallido')
                        .setDescription(`**${target.username}** no tiene suficientes Solecoins para robar (menos de 10).`)
                        .setTimestamp()]
                });
            }

            COOLDOWNS.set(cooldownKey, Date.now());

            const exito = Math.random() < 0.45;

            if (exito) {
                const porcentaje = 0.1 + Math.random() * 0.2;
                const cantidad = Math.max(1, Math.floor(targetBalance * porcentaje));

                await db.query('UPDATE economy SET balance = balance - $1 WHERE user_id = $2', [cantidad, target.id]);
                await db.query('UPDATE economy SET balance = balance + $1 WHERE user_id = $2', [cantidad, thief.id]);

                const embed = new EmbedBuilder()
                    .setColor('#2ECC71')
                    .setTitle('💸 ¡Robo Exitoso!')
                    .setDescription(`**${thief.username}** le robó **${cantidad} ${SC}** a **${target.username}**.`)
                    .addFields({ name: '🎁 Ganaste', value: `${cantidad} ${SC} Solecoins`, inline: true })
                    .setFooter({ text: '¡Que no te atrapen la próxima vez!' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                const multa = Math.floor(Math.random() * 30) + 10;
                await db.query('UPDATE economy SET balance = GREATEST(0, balance - $1) WHERE user_id = $2', [multa, thief.id]);

                const embed = new EmbedBuilder()
                    .setColor('#E74C3C')
                    .setTitle('🚨 ¡Te Atraparon!')
                    .setDescription(`**${thief.username}** intentó robarle a **${target.username}** pero fue atrapado y multado con **${multa} ${SC}**.`)
                    .setFooter({ text: 'El crimen no paga... bueno, a veces sí.' })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error en robar:', error);
            await interaction.editReply({ content: '❌ Ocurrió un error. Inténtalo más tarde.' });
        } finally {
            await db.end();
        }
    },
};
