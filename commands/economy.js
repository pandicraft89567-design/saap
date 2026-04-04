const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');
const { getLanguage, t } = require('../utils/i18n');

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const INFINITE_USER = '738425516155076629';

const JOBS = {
    es: ['programador/a', 'chef', 'streamer', 'minero/a', 'diseñador/a', 'repartidor/a', 'youtuber', 'DJ', 'detective', 'astronauta'],
    en: ['programmer', 'chef', 'streamer', 'miner', 'designer', 'delivery driver', 'youtuber', 'DJ', 'detective', 'astronaut'],
    fr: ['programmeur/se', 'chef', 'streamer', 'mineur/se', 'designer', 'livreur/se', 'youtuber', 'DJ', 'détective', 'astronaute'],
    pt: ['programador/a', 'chef', 'streamer', 'mineiro/a', 'designer', 'entregador/a', 'youtuber', 'DJ', 'detetive', 'astronauta'],
};

function getJob(lang) {
    const list = JOBS[lang] || JOBS['en'];
    return list[Math.floor(Math.random() * list.length)];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setNameLocalizations({ 'en-US': 'economy', 'en-GB': 'economy' })
        .setDescription('Sistema de economía Solecoins')
        .setDescriptionLocalizations({ 'en-US': 'Solecoins economy system', 'en-GB': 'Solecoins economy system' })
        .addSubcommand(s => s.setName('balance')
            .setNameLocalizations({ 'en-US': 'balance', 'en-GB': 'balance' })
            .setDescription('Mira tu saldo de Solecoins')
            .setDescriptionLocalizations({ 'en-US': 'Check your Solecoins balance', 'en-GB': 'Check your Solecoins balance' }))
        .addSubcommand(s => s.setName('daily')
            .setNameLocalizations({ 'en-US': 'daily', 'en-GB': 'daily' })
            .setDescription('Reclama tus Solecoins diarios')
            .setDescriptionLocalizations({ 'en-US': 'Claim your daily Solecoins', 'en-GB': 'Claim your daily Solecoins' }))
        .addSubcommand(s => s.setName('work')
            .setNameLocalizations({ 'en-US': 'work', 'en-GB': 'work' })
            .setDescription('Trabaja para ganar Solecoins')
            .setDescriptionLocalizations({ 'en-US': 'Work to earn Solecoins', 'en-GB': 'Work to earn Solecoins' }))
        .addSubcommand(s =>
            s.setName('gamble')
             .setNameLocalizations({ 'en-US': 'gamble', 'en-GB': 'gamble' })
             .setDescription('Apuesta tus Solecoins')
             .setDescriptionLocalizations({ 'en-US': 'Gamble your Solecoins', 'en-GB': 'Gamble your Solecoins' })
             .addIntegerOption(o => o.setName('cantidad')
                .setNameLocalizations({ 'en-US': 'amount', 'en-GB': 'amount' })
                .setDescription('Cantidad a apostar')
                .setDescriptionLocalizations({ 'en-US': 'Amount to bet', 'en-GB': 'Amount to bet' })
                .setRequired(true))
        ),

    async execute(interaction) {
        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();
        const userId     = interaction.user.id;
        const subcommand = interaction.options.getSubcommand();
        const isInfinite = userId === INFINITE_USER;
        const lang       = await getLanguage(interaction.guildId);

        try {
            await db.query(
                'INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
                [userId]
            );

            // ── BALANCE ──────────────────────────────────────────────────
            if (subcommand === 'balance') {
                let balance, diamante, ultra;

                if (isInfinite) {
                    balance = '∞'; diamante = '∞'; ultra = '∞';
                } else {
                    const res = await db.query(
                        'SELECT balance, solecoins_diamante, solecoins_ultra FROM economy WHERE user_id = $1',
                        [userId]
                    );
                    balance  = res.rows[0].balance            ?? 0;
                    diamante = res.rows[0].solecoins_diamante ?? 0;
                    ultra    = res.rows[0].solecoins_ultra    ?? 0;
                }

                const embed = new EmbedBuilder()
                    .setTitle(t('ECONOMY_WALLET_TITLE', lang, { user: interaction.user.displayName || interaction.user.username }))
                    .setColor('#F1C40F')
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .addFields(
                        { name: `${SC} Solecoins`,          value: `**${balance}**`,  inline: true },
                        { name: `${SCD} Solecoins Diamante`, value: `**${diamante}**`, inline: true },
                        { name: `${SCU} Solecoins Ultra`,    value: `**${ultra}**`,    inline: true }
                    )
                    .setFooter({ text: t('ECONOMY_FOOTER', lang) })
                    .setTimestamp();

                if (isInfinite) embed.setDescription(t('ECONOMY_INFINITE_DESC', lang));

                return interaction.reply({ embeds: [embed] });
            }

            // ── DAILY ────────────────────────────────────────────────────
            if (subcommand === 'daily') {
                const res = await db.query(
                    'SELECT last_daily FROM economy WHERE user_id = $1', [userId]
                );
                const lastDaily = res.rows[0].last_daily;
                const now = new Date();

                if (lastDaily && (now - new Date(lastDaily)) < 86400000) {
                    const horasLeft = Math.ceil((86400000 - (now - new Date(lastDaily))) / 3600000);
                    const embed = new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle(t('ECONOMY_DAILY_WAIT_TITLE', lang))
                        .setDescription(t('ECONOMY_DAILY_WAIT_DESC', lang, { hours: horasLeft }))
                        .setFooter({ text: t('ECONOMY_FOOTER', lang) });
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                const reward = isInfinite ? 0 : 500;
                await db.query(
                    'UPDATE economy SET last_daily = $1 WHERE user_id = $2',
                    [now, userId]
                );
                if (!isInfinite) {
                    await db.query(
                        'UPDATE economy SET balance = balance + $1 WHERE user_id = $2',
                        [reward, userId]
                    );
                }

                const embed = new EmbedBuilder()
                    .setColor('#4ADE80')
                    .setTitle(t('ECONOMY_DAILY_TITLE', lang))
                    .setDescription(
                        isInfinite
                            ? t('ECONOMY_DAILY_INFINITE', lang, { SC })
                            : t('ECONOMY_DAILY_DESC', lang, { SC, reward })
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: t('ECONOMY_FOOTER', lang) })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // ── WORK ─────────────────────────────────────────────────────
            if (subcommand === 'work') {
                const res = await db.query(
                    'SELECT last_work FROM economy WHERE user_id = $1', [userId]
                );
                const lastWork = res.rows[0].last_work;
                const now = new Date();

                if (lastWork && (now - new Date(lastWork)) < 3600000) {
                    const minsLeft = Math.ceil((3600000 - (now - new Date(lastWork))) / 60000);
                    const embed = new EmbedBuilder()
                        .setColor('#FF6B6B')
                        .setTitle(t('ECONOMY_WORK_WAIT_TITLE', lang))
                        .setDescription(t('ECONOMY_WORK_WAIT_DESC', lang, { mins: minsLeft }))
                        .setFooter({ text: t('ECONOMY_FOOTER', lang) });
                    return interaction.reply({ embeds: [embed], flags: 64 });
                }

                const job     = getJob(lang);
                const payment = isInfinite ? 0 : (Math.floor(Math.random() * 200) + 50);

                await db.query(
                    'UPDATE economy SET last_work = $1 WHERE user_id = $2',
                    [now, userId]
                );
                if (!isInfinite) {
                    await db.query(
                        'UPDATE economy SET balance = balance + $1 WHERE user_id = $2',
                        [payment, userId]
                    );
                }

                const embed = new EmbedBuilder()
                    .setColor('#60A5FA')
                    .setTitle(t('ECONOMY_WORK_TITLE', lang))
                    .setDescription(
                        isInfinite
                            ? t('ECONOMY_WORK_INFINITE', lang, { job, SC })
                            : t('ECONOMY_WORK_DESC', lang, { job, payment, SC })
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: t('ECONOMY_FOOTER', lang) })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

            // ── GAMBLE ───────────────────────────────────────────────────
            if (subcommand === 'gamble') {
                const amount = interaction.options.getInteger('cantidad');

                if (amount <= 0) {
                    return interaction.reply({
                        content: t('ECONOMY_GAMBLE_AMOUNT_ERROR', lang, { SC }),
                        flags: 64
                    });
                }

                const res = await db.query(
                    'SELECT balance FROM economy WHERE user_id = $1', [userId]
                );
                const balance = isInfinite ? Infinity : parseInt(res.rows[0].balance);

                if (balance < amount) {
                    return interaction.reply({
                        content: t('ECONOMY_GAMBLE_NO_FUNDS', lang, { SC, balance }),
                        flags: 64
                    });
                }

                const win = Math.random() > 0.55;

                if (!isInfinite) {
                    if (win) {
                        await db.query(
                            'UPDATE economy SET balance = balance + $1 WHERE user_id = $2',
                            [amount, userId]
                        );
                    } else {
                        await db.query(
                            'UPDATE economy SET balance = balance - $1 WHERE user_id = $2',
                            [amount, userId]
                        );
                    }
                }

                const embed = new EmbedBuilder()
                    .setColor(win ? '#4ADE80' : '#FF6B6B')
                    .setTitle(win ? t('ECONOMY_GAMBLE_WIN', lang) : t('ECONOMY_GAMBLE_LOSE', lang))
                    .setDescription(
                        win
                            ? t('ECONOMY_GAMBLE_WIN_DESC', lang, { amount, SC })
                            : t('ECONOMY_GAMBLE_LOSE_DESC', lang, { amount, SC })
                    )
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                    .setFooter({ text: t('ECONOMY_GAMBLE_FOOTER', lang) })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            }

        } finally {
            await db.end();
        }
    },
};
