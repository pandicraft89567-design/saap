const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Client } = require('pg');

const INFINITE_USER = '738425516155076629';

const SC  = '<:Solecoincomun:1488044566907981995>';
const SCD = '<:solecoindimante:1488045797672095784>';
const SCU = '<:SolecoinUltra:1488046486263697439>';

const PROB_ULTRA    = 1e-12;   // 0.0000000001%
const PROB_DIAMANTE = 0.00005; // 0.005%
const PROB_COMUN    = 0.12;    // 12% — consolación pequeña

function spin() {
    const r = Math.random();
    if (r < PROB_ULTRA)    return 'ultra';
    if (r < PROB_DIAMANTE) return 'diamante';
    if (r < PROB_COMUN)    return 'comun';
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ruleta')
        .setNameLocalizations({ 'en-US': 'roulette', 'en-GB': 'roulette' })
        .setDescription('Gira la ruleta de Solecoins y gana premios exclusivos')
        .setDescriptionLocalizations({ 'en-US': 'Spin the Solecoins roulette and win exclusive prizes', 'en-GB': 'Spin the Solecoins roulette and win exclusive prizes' })
        .addStringOption(opt =>
            opt.setName('modo')
                .setDescription('Elige el modo de giro')
                .setRequired(true)
                .addChoices(
                    { name: `10 giros — 100 ${SC} Solecoins comunes`, value: '10' },
                    { name: `100 giros — 1 ${SCD} Solecoindimante`,   value: '100' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const userId = interaction.user.id;
        const modo   = interaction.options.getString('modo');
        const giros  = parseInt(modo);
        const isInfinite = userId === INFINITE_USER;

        const db = new Client({ connectionString: process.env.DATABASE_URL });
        await db.connect();

        try {
            await db.query('INSERT INTO economy (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING', [userId]);

            const res = await db.query(
                'SELECT balance, solecoins_diamante, solecoins_ultra FROM economy WHERE user_id = $1',
                [userId]
            );
            const row = res.rows[0];
            let balance  = parseInt(row.balance)            || 0;
            let diamante = parseInt(row.solecoins_diamante) || 0;

            // ── Cobrar coste ─────────────────────────────────────────────
            if (!isInfinite) {
                if (giros === 10) {
                    if (balance < 100) {
                        return interaction.editReply({
                            content: `❌ Necesitas **100 ${SC} Solecoins comunes** para 10 giros. Tu saldo: **${balance}**.`
                        });
                    }
                    await db.query('UPDATE economy SET balance = balance - 100 WHERE user_id = $1', [userId]);
                    balance -= 100;
                } else {
                    if (diamante < 1) {
                        return interaction.editReply({
                            content: `❌ Necesitas **1 ${SCD} Solecoindimante** para 100 giros. No tienes ninguno.`
                        });
                    }
                    await db.query('UPDATE economy SET solecoins_diamante = solecoins_diamante - 1 WHERE user_id = $1', [userId]);
                    diamante -= 1;
                }
            }

            // ── Girar ────────────────────────────────────────────────────
            let ganancia_comun    = 0;
            let ganancia_diamante = 0;
            let ganancia_ultra    = 0;
            const destellos = [];

            for (let i = 0; i < giros; i++) {
                const premio = spin();
                if (premio === 'ultra')    { ganancia_ultra++;    destellos.push(SCU); }
                else if (premio === 'diamante') { ganancia_diamante++; destellos.push(SCD); }
                else if (premio === 'comun') {
                    const amt = Math.floor(Math.random() * 20) + 5;
                    ganancia_comun += amt;
                    destellos.push(SC);
                }
            }

            // ── Aplicar premios en DB ────────────────────────────────────
            let premiumMsg = '';
            if (!isInfinite) {
                if (ganancia_comun > 0)
                    await db.query('UPDATE economy SET balance = balance + $1 WHERE user_id = $2', [ganancia_comun, userId]);

                if (ganancia_diamante > 0) {
                    await db.query(
                        'UPDATE economy SET solecoins_diamante = solecoins_diamante + $1, premium_until = GREATEST(COALESCE(premium_until, NOW()), NOW()) + ($2 * INTERVAL \'1 year\') WHERE user_id = $3',
                        [ganancia_diamante, ganancia_diamante, userId]
                    );
                    premiumMsg += `\n> ${SCD} ¡Ganaste **${ganancia_diamante}** Solecoindimante! Se añadió **${ganancia_diamante} año(s) de Premium**.`;
                }

                if (ganancia_ultra > 0) {
                    await db.query(
                        "UPDATE economy SET solecoins_ultra = solecoins_ultra + $1, premium_until = '9999-12-31 23:59:59' WHERE user_id = $2",
                        [ganancia_ultra, userId]
                    );
                    premiumMsg += `\n> ${SCU} ¡¡JACKPOT!! Ganaste **${ganancia_ultra}** SolecoinUltra → **Premium PERMANENTE** 🎊`;
                }
            }

            // ── Construir embed ──────────────────────────────────────────
            const tuvoPremio = ganancia_ultra > 0 || ganancia_diamante > 0;
            const color = ganancia_ultra > 0 ? '#FFD700' : ganancia_diamante > 0 ? '#00FFFF' : '#C084FC';

            // Mostrar sólo hasta 30 resultados visualmente
            const muestra = destellos.slice(0, 30).join(' ') || '`Sin premios esta vez…`';
            const extras  = destellos.length > 30 ? `\n*…y ${destellos.length - 30} resultados más*` : '';

            const embed = new EmbedBuilder()
                .setTitle(tuvoPremio
                    ? `${ganancia_ultra > 0 ? '🎊 ¡¡JACKPOT ULTRA!!' : '🎉 ¡Premio!'} — Ruleta Solecoins`
                    : '🎰 Ruleta Solecoins')
                .setColor(color)
                .setDescription(
                    `> Giraste la ruleta **${giros} veces** — ¡aquí están tus resultados!\n\u200B`
                )
                .addFields(
                    { name: '🎡 Resultados',    value: muestra + extras, inline: false },
                    { name: `${SC} Comunes ganados`,    value: `**+${ganancia_comun}**`,    inline: true },
                    { name: `${SCD} Diamantes ganados`, value: `**+${ganancia_diamante}**`, inline: true },
                    { name: `${SCU} Ultras ganados`,    value: `**+${ganancia_ultra}**`,    inline: true }
                )
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setFooter({
                    text: `Soledad ❣ • Diamante: 0.005% • Ultra: 0.0000000001%`,
                    iconURL: interaction.client.user.displayAvatarURL()
                })
                .setTimestamp();

            if (premiumMsg) embed.addFields({ name: '🏆 Premio Premium', value: premiumMsg, inline: false });

            await interaction.editReply({ embeds: [embed] });

        } finally {
            await db.end();
        }
    }
};
