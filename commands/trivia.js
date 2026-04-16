const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');
const { Pool } = require('pg');
const https = require('https');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initTriviaDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS trivia_stats (
            user_id VARCHAR(30) NOT NULL,
            guild_id VARCHAR(30) NOT NULL,
            points INTEGER DEFAULT 0,
            correct INTEGER DEFAULT 0,
            total INTEGER DEFAULT 0,
            games_played INTEGER DEFAULT 0,
            PRIMARY KEY (user_id, guild_id)
        )
    `);
}
initTriviaDB().catch(console.error);

async function addPoints(userId, guildId, pts, correct, total) {
    await pool.query(`
        INSERT INTO trivia_stats (user_id, guild_id, points, correct, total, games_played)
        VALUES ($1, $2, $3, $4, $5, 1)
        ON CONFLICT (user_id, guild_id) DO UPDATE SET
            points = trivia_stats.points + $3,
            correct = trivia_stats.correct + $4,
            total = trivia_stats.total + $5,
            games_played = trivia_stats.games_played + CASE WHEN $6 THEN 1 ELSE 0 END
    `, [userId, guildId, pts, correct, total, total > 1]);
}

async function getLeaderboard(guildId, limit = 10) {
    const res = await pool.query(`
        SELECT user_id, points, correct, total, games_played
        FROM trivia_stats
        WHERE guild_id = $1
        ORDER BY points DESC
        LIMIT $2
    `, [guildId, limit]);
    return res.rows;
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function translateToSpanish(text) {
    try {
        const encoded = encodeURIComponent(text).slice(0, 499);
        const data = await httpGet(`https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|es`);
        const json = JSON.parse(data);
        if (json.responseStatus === 200) return json.responseData.translatedText;
        return text;
    } catch {
        return text;
    }
}

async function translateQuestion(q) {
    try {
        const correctIdx = q.options.indexOf(q.correct);
        const parts = [q.question, ...q.options];
        const SEP = ' [|||] ';
        const combined = parts.join(SEP);

        if (combined.length > 490) {
            const translatedQ = await translateToSpanish(q.question);
            return { ...q, question: translatedQ };
        }

        const translated = await translateToSpanish(combined);
        const translatedParts = translated.split(SEP.trim()).map(s => s.replace(/\s*\[\|\|\|\]\s*/g, '').trim());

        if (translatedParts.length < parts.length) {
            const translatedQ = await translateToSpanish(q.question);
            return { ...q, question: translatedQ };
        }

        const translatedOptions = translatedParts.slice(1, 1 + q.options.length);
        const translatedCorrect = correctIdx >= 0 && correctIdx < translatedOptions.length
            ? translatedOptions[correctIdx]
            : translatedOptions[0];

        return {
            ...q,
            question: translatedParts[0],
            options: translatedOptions,
            correct: translatedCorrect,
        };
    } catch {
        return q;
    }
}

async function translateQuestions(questions) {
    return Promise.all(questions.map(q => translateQuestion(q)));
}

function fetchQuestions(amount = 5, category = '') {
    return new Promise((resolve, reject) => {
        const catParam = category ? `&category=${category}` : '';
        const url = `https://opentdb.com/api.php?amount=${amount}&type=multiple&encode=url3986${catParam}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    if (json.response_code !== 0 || !json.results?.length) {
                        return reject(new Error('No se pudieron obtener preguntas.'));
                    }
                    const questions = json.results.map(q => ({
                        category: decodeURIComponent(q.category),
                        difficulty: decodeURIComponent(q.difficulty),
                        question: decodeURIComponent(q.question),
                        correct: decodeURIComponent(q.correct_answer),
                        options: shuffle([
                            decodeURIComponent(q.correct_answer),
                            ...q.incorrect_answers.map(a => decodeURIComponent(a))
                        ])
                    }));
                    resolve(questions);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const CATEGORY_META = {
    'General Knowledge':                    { emoji: '🌍', color: '#F4C430', img: 'https://i.imgur.com/6Fq8kZH.png' },
    'Entertainment: Books':                 { emoji: '📚', color: '#8B4513', img: 'https://i.imgur.com/QwDRrzM.png' },
    'Entertainment: Film':                  { emoji: '🎬', color: '#C0392B', img: 'https://i.imgur.com/mUt7MkK.png' },
    'Entertainment: Music':                 { emoji: '🎵', color: '#8E44AD', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Entertainment: Television':            { emoji: '📺', color: '#2980B9', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Entertainment: Video Games':           { emoji: '🎮', color: '#27AE60', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Science & Nature':                     { emoji: '🔬', color: '#16A085', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Science: Computers':                   { emoji: '💻', color: '#2C3E50', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Science: Mathematics':                 { emoji: '➗', color: '#E67E22', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Mythology':                            { emoji: '⚡', color: '#D35400', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Sports':                               { emoji: '⚽', color: '#27AE60', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Geography':                            { emoji: '🗺️', color: '#1ABC9C', img: 'https://i.imgur.com/O9rLyuE.png' },
    'History':                              { emoji: '🏛️', color: '#7F8C8D', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Politics':                             { emoji: '🏛️', color: '#2C3E50', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Art':                                  { emoji: '🎨', color: '#E91E63', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Celebrities':                          { emoji: '⭐', color: '#F39C12', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Animals':                              { emoji: '🐾', color: '#795548', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Vehicles':                             { emoji: '🚗', color: '#607D8B', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Entertainment: Comics':                { emoji: '💥', color: '#F44336', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Entertainment: Japanese Anime & Manga':{ emoji: '🌸', color: '#FF69B4', img: 'https://i.imgur.com/O9rLyuE.png' },
    'Entertainment: Cartoon & Animations':  { emoji: '🎭', color: '#FF5722', img: 'https://i.imgur.com/O9rLyuE.png' },
};

function getMeta(category) {
    return CATEGORY_META[category] || { emoji: '🧠', color: '#7289DA', img: null };
}

function difficultyLabel(d) {
    return { easy: '🟢 Fácil', medium: '🟡 Media', hard: '🔴 Difícil' }[d] || d;
}
function difficultyPoints(d) {
    return { easy: 1, medium: 2, hard: 3 }[d] || 1;
}

const LETTERS = ['🇦', '🇧', '🇨', '🇩'];

function buildQuestionEmbed(q, num, total, scores) {
    const meta = getMeta(q.category);
    const pts = difficultyPoints(q.difficulty);
    const embed = new EmbedBuilder()
        .setColor(meta.color)
        .setTitle(`${meta.emoji} Pregunta ${num}/${total}`)
        .setDescription(`**${q.question}**\n\n${q.options.map((o, i) => `${LETTERS[i]} ${o}`).join('\n')}`)
        .addFields(
            { name: '📂 Categoría', value: q.category, inline: true },
            { name: '⚡ Dificultad', value: difficultyLabel(q.difficulty), inline: true },
            { name: '🏅 Puntos', value: `+${pts} pts si aciertas`, inline: true }
        )
        .setFooter({ text: `⏱ 20 segundos para responder • Soledad ❣` })
        .setTimestamp();

    if (scores && scores.size > 0) {
        const ranking = [...scores.entries()]
            .sort((a, b) => b[1].pts - a[1].pts)
            .slice(0, 5)
            .map((e, i) => `${['🥇','🥈','🥉','4️⃣','5️⃣'][i]} <@${e[0]}> — **${e[1].pts}** pts`)
            .join('\n');
        embed.addFields({ name: '🏆 Marcador actual', value: ranking });
    }

    if (meta.img && meta.img !== 'https://i.imgur.com/O9rLyuE.png') {
        embed.setThumbnail(meta.img);
    }

    return embed;
}

function buildButtons(q, gameId, questionIdx) {
    const row = new ActionRowBuilder().addComponents(
        q.options.map((opt, i) =>
            new ButtonBuilder()
                .setCustomId(`trivia_ans_${gameId}_${questionIdx}_${i}_${opt === q.correct ? 'C' : 'W'}`)
                .setLabel(`${['A','B','C','D'][i]}: ${opt.length > 60 ? opt.slice(0, 57) + '...' : opt}`)
                .setStyle(ButtonStyle.Primary)
        )
    );
    return row;
}

const activeSessions = new Map();

async function runQuestion(channel, session, qIdx) {
    const q = session.questions[qIdx];
    const gameId = session.id;
    const total = session.questions.length;

    const embed = buildQuestionEmbed(q, qIdx + 1, total, qIdx > 0 ? session.scores : null);
    const row = buildButtons(q, gameId, qIdx);

    const msg = await channel.send({ embeds: [embed], components: [row] });

    const answered = new Set();

    const collector = msg.createMessageComponentCollector({ time: 20000 });

    collector.on('collect', async (btn) => {
        if (session.phase !== 'playing') return btn.deferUpdate().catch(() => {});

        if (!session.players.has(btn.user.id)) {
            return btn.reply({ content: '❌ No estás en esta partida. ¡Únete a la próxima!', flags: 64 });
        }
        if (answered.has(btn.user.id)) {
            return btn.reply({ content: '⚠️ Ya respondiste esta pregunta.', flags: 64 });
        }

        answered.add(btn.user.id);
        const isCorrect = btn.customId.endsWith('_C');
        const pts = isCorrect ? difficultyPoints(q.difficulty) : 0;

        if (!session.scores.has(btn.user.id)) {
            session.scores.set(btn.user.id, { pts: 0, correct: 0, total: 0 });
        }
        const s = session.scores.get(btn.user.id);
        s.pts += pts;
        if (isCorrect) s.correct++;
        s.total++;

        await btn.reply({
            content: isCorrect
                ? `✅ <@${btn.user.id}> ¡Correcto! **+${pts}** pts`
                : `❌ <@${btn.user.id}> Incorrecto. La respuesta era **${q.correct}**`,
            flags: 64
        }).catch(() => {});

        if (answered.size >= session.players.size) collector.stop('all_answered');
    });

    await new Promise(resolve => {
        collector.on('end', async (_, reason) => {
            const meta = getMeta(q.category);
            const resultEmbed = new EmbedBuilder()
                .setColor(meta.color)
                .setTitle(`${reason === 'all_answered' ? '⚡ ¡Todos respondieron!' : '⏰ ¡Tiempo!'}`)
                .setDescription(`**${q.question}**\n\n✅ Respuesta correcta: **${q.correct}**`);

            if (answered.size > 0) {
                const who = [...answered.values()].map(id => {
                    const s = session.scores.get(id);
                    return s ? `<@${id}> — **${s.pts}** pts totales` : `<@${id}>`;
                }).join('\n');
                resultEmbed.addFields({ name: '👥 Respondieron', value: who });
            }

            await msg.edit({ embeds: [resultEmbed], components: [] }).catch(() => {});
            setTimeout(resolve, 2500);
        });
    });
}

async function runGame(channel, session) {
    session.phase = 'playing';
    for (let i = 0; i < session.questions.length; i++) {
        await runQuestion(channel, session, i);
    }

    session.phase = 'ended';

    const sorted = [...session.scores.entries()].sort((a, b) => b[1].pts - a[1].pts);
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

    const rankText = sorted.length > 0
        ? sorted.map((e, i) => {
            const s = e[1];
            const acc = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
            return `${medals[i] || `${i + 1}.`} <@${e[0]}> — **${s.pts}** pts | ${s.correct}/${s.total} correctas (${acc}%)`;
        }).join('\n')
        : 'Nadie respondió ninguna pregunta.';

    const winnerText = sorted.length > 0 ? `¡Felicidades <@${sorted[0][0]}>! 🎉` : '';

    const finalEmbed = new EmbedBuilder()
        .setColor('#F4C430')
        .setTitle('🏆 ¡Partida terminada!')
        .setDescription(`${winnerText}\n\n${rankText}`)
        .setFooter({ text: 'Soledad ❣ — Trivia' })
        .setTimestamp();

    await channel.send({ embeds: [finalEmbed] });

    for (const [userId, s] of sorted) {
        await addPoints(userId, session.guildId, s.pts, s.correct, s.total).catch(console.error);
    }

    activeSessions.delete(channel.id);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Sistema de trivia con preguntas reales, multijugador y puntos')
        .addSubcommand(sub =>
            sub.setName('rapida')
                .setDescription('Una pregunta rápida de trivia (todos pueden responder)')
                .addStringOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Categoría de la pregunta')
                        .addChoices(
                            { name: '🌍 General', value: '9' },
                            { name: '🎬 Cine', value: '11' },
                            { name: '🎵 Música', value: '12' },
                            { name: '📺 Televisión', value: '14' },
                            { name: '🎮 Videojuegos', value: '15' },
                            { name: '🔬 Ciencia', value: '17' },
                            { name: '💻 Computación', value: '18' },
                            { name: '➗ Matemáticas', value: '19' },
                            { name: '⚽ Deportes', value: '21' },
                            { name: '🗺️ Geografía', value: '22' },
                            { name: '🏛️ Historia', value: '23' },
                            { name: '🐾 Animales', value: '27' },
                            { name: '🌸 Anime', value: '31' },
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('partida')
                .setDescription('Partida de 5 preguntas multijugador')
                .addIntegerOption(opt =>
                    opt.setName('preguntas')
                        .setDescription('Número de preguntas (1-10, default 5)')
                        .setMinValue(1)
                        .setMaxValue(10)
                )
                .addStringOption(opt =>
                    opt.setName('categoria')
                        .setDescription('Categoría de la partida')
                        .addChoices(
                            { name: '🌍 General', value: '9' },
                            { name: '🎬 Cine', value: '11' },
                            { name: '🎵 Música', value: '12' },
                            { name: '📺 Televisión', value: '14' },
                            { name: '🎮 Videojuegos', value: '15' },
                            { name: '🔬 Ciencia', value: '17' },
                            { name: '💻 Computación', value: '18' },
                            { name: '➗ Matemáticas', value: '19' },
                            { name: '⚽ Deportes', value: '21' },
                            { name: '🗺️ Geografía', value: '22' },
                            { name: '🏛️ Historia', value: '23' },
                            { name: '🐾 Animales', value: '27' },
                            { name: '🌸 Anime', value: '31' },
                        )
                )
        )
        .addSubcommand(sub =>
            sub.setName('leaderboard')
                .setDescription('Ranking de los mejores jugadores de trivia del servidor')
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'leaderboard') {
            await interaction.deferReply();
            const rows = await getLeaderboard(interaction.guildId);
            if (!rows.length) {
                return interaction.editReply({ content: '📭 Aún no hay estadísticas de trivia en este servidor. ¡Juega con `/trivia rapida` o `/trivia partida`!' });
            }
            const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
            const text = rows.map((r, i) => {
                const acc = r.total > 0 ? Math.round((r.correct / r.total) * 100) : 0;
                return `${medals[i] || `${i+1}.`} <@${r.user_id}> — **${r.points}** pts | ${r.correct}/${r.total} correctas (${acc}%) | ${r.games_played} partidas`;
            }).join('\n');

            const embed = new EmbedBuilder()
                .setColor('#F4C430')
                .setTitle('🏆 Leaderboard de Trivia')
                .setDescription(text)
                .setFooter({ text: 'Soledad ❣ — ¡Juega para aparecer aquí!' })
                .setTimestamp();
            return interaction.editReply({ embeds: [embed] });
        }

        if (sub === 'rapida') {
            await interaction.deferReply();
            const catVal = interaction.options.getString('categoria') || '';

            let questions;
            try {
                questions = await fetchQuestions(1, catVal);
                questions = await translateQuestions(questions);
            } catch (e) {
                return interaction.editReply({ content: '❌ Error al obtener preguntas. Intenta de nuevo.' });
            }
            const q = questions[0];
            const meta = getMeta(q.category);
            const pts = difficultyPoints(q.difficulty);

            const embed = new EmbedBuilder()
                .setColor(meta.color)
                .setTitle(`${meta.emoji} Trivia Rápida`)
                .setDescription(`**${q.question}**\n\n${q.options.map((o, i) => `${LETTERS[i]} ${o}`).join('\n')}`)
                .addFields(
                    { name: '📂 Categoría', value: q.category, inline: true },
                    { name: '⚡ Dificultad', value: difficultyLabel(q.difficulty), inline: true },
                    { name: '🏅 Puntos', value: `+${pts} pts`, inline: true }
                )
                .setFooter({ text: '⏱ 20 segundos • ¡Primero en acertar gana! • Soledad ❣' })
                .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
                q.options.map((opt, i) =>
                    new ButtonBuilder()
                        .setCustomId(`trivr_${i}_${opt === q.correct ? 'C' : 'W'}_${interaction.id}`)
                        .setLabel(`${['A','B','C','D'][i]}: ${opt.length > 60 ? opt.slice(0,57)+'...' : opt}`)
                        .setStyle(ButtonStyle.Primary)
                )
            );

            const msg = await interaction.editReply({ embeds: [embed], components: [row] });
            const answered = new Set();

            const collector = msg.createMessageComponentCollector({ time: 20000 });

            collector.on('collect', async (btn) => {
                if (answered.has(btn.user.id)) {
                    return btn.reply({ content: '⚠️ Ya respondiste.', flags: 64 });
                }
                answered.add(btn.user.id);

                const isCorrect = btn.customId.includes('_C_');
                if (isCorrect) {
                    await addPoints(btn.user.id, interaction.guildId, pts, 1, 1).catch(console.error);
                    await btn.reply({ content: `✅ ¡Correcto <@${btn.user.id}>! **+${pts}** pts`, flags: 64 });
                    collector.stop('correct');
                } else {
                    await addPoints(btn.user.id, interaction.guildId, 0, 0, 1).catch(console.error);
                    await btn.reply({ content: `❌ Incorrecto <@${btn.user.id}>. Respuesta: **${q.correct}**`, flags: 64 });
                }
            });

            collector.on('end', async (_, reason) => {
                const resultEmbed = new EmbedBuilder()
                    .setColor(reason === 'correct' ? '#2ECC71' : '#95A5A6')
                    .setTitle(reason === 'correct' ? `${meta.emoji} ¡Alguien acertó!` : `${meta.emoji} ¡Tiempo!`)
                    .setDescription(`**${q.question}**\n\n✅ Respuesta: **${q.correct}**`)
                    .addFields(
                        { name: '📂 Categoría', value: q.category, inline: true },
                        { name: '⚡ Dificultad', value: difficultyLabel(q.difficulty), inline: true }
                    )
                    .setFooter({ text: 'Usa /trivia leaderboard para ver el ranking • Soledad ❣' });

                await interaction.editReply({ embeds: [resultEmbed], components: [] }).catch(() => {});
            });

            return;
        }

        if (sub === 'partida') {
            if (activeSessions.has(interaction.channelId)) {
                return interaction.reply({ content: '⚠️ Ya hay una partida activa en este canal. ¡Espera a que termine!', flags: 64 });
            }

            const numQ = interaction.options.getInteger('preguntas') || 5;
            const catVal = interaction.options.getString('categoria') || '';

            await interaction.deferReply();

            let questions;
            try {
                questions = await fetchQuestions(numQ, catVal);
                questions = await translateQuestions(questions);
            } catch (e) {
                return interaction.editReply({ content: '❌ Error al obtener preguntas de trivia. Intenta de nuevo.' });
            }

            const sessionId = `${interaction.channelId}_${Date.now()}`;
            const session = {
                id: sessionId,
                phase: 'joining',
                players: new Set([interaction.user.id]),
                scores: new Map(),
                questions,
                guildId: interaction.guildId,
            };
            activeSessions.set(interaction.channelId, session);

            const joinRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`trivia_join_${sessionId}`)
                    .setLabel('🎮 ¡Unirse a la partida!')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId(`trivia_start_${sessionId}`)
                    .setLabel('▶️ Iniciar ya')
                    .setStyle(ButtonStyle.Primary)
            );

            const catName = catVal ? Object.entries(CATEGORY_META).find(() => true)?.['emoji'] || '' : '';
            const joinEmbed = new EmbedBuilder()
                .setColor('#57F287')
                .setTitle('🎮 ¡Nueva Partida de Trivia!')
                .setDescription(
                    `<@${interaction.user.id}> ha iniciado una partida de **${numQ} preguntas**.\n\n` +
                    `¡Pulsa el botón para unirte!\n\n` +
                    `👥 **Jugadores:** <@${interaction.user.id}>`
                )
                .addFields(
                    { name: '❓ Preguntas', value: `${numQ}`, inline: true },
                    { name: '⏳ Fase de unirse', value: '30 segundos', inline: true },
                    { name: '🏅 Puntos por dificultad', value: '🟢 Fácil: 1 | 🟡 Media: 2 | 🔴 Difícil: 3', inline: false }
                )
                .setFooter({ text: 'Soledad ❣ — Trivia Multijugador' })
                .setTimestamp();

            const joinMsg = await interaction.editReply({ embeds: [joinEmbed], components: [joinRow] });

            const joinCollector = joinMsg.createMessageComponentCollector({ time: 30000 });
            let started = false;

            const startGame = async () => {
                if (started) return;
                started = true;
                joinCollector.stop('started');

                const startEmbed = new EmbedBuilder()
                    .setColor('#F4C430')
                    .setTitle('🚀 ¡La partida comienza!')
                    .setDescription(
                        `**Jugadores:** ${[...session.players].map(id => `<@${id}>`).join(', ')}\n\n` +
                        `Prepárense... ¡Primera pregunta en 3 segundos!`
                    )
                    .setFooter({ text: 'Soledad ❣ — Trivia' });

                await interaction.editReply({ embeds: [startEmbed], components: [] }).catch(() => {});
                await new Promise(r => setTimeout(r, 3000));

                await runGame(interaction.channel, session);
            };

            joinCollector.on('collect', async (btn) => {
                if (btn.customId.startsWith('trivia_join_')) {
                    session.players.add(btn.user.id);
                    const playerList = [...session.players].map(id => `<@${id}>`).join(', ');
                    const updatedEmbed = EmbedBuilder.from(joinEmbed)
                        .setDescription(
                            `<@${interaction.user.id}> ha iniciado una partida de **${numQ} preguntas**.\n\n` +
                            `¡Pulsa el botón para unirte!\n\n` +
                            `👥 **Jugadores (${session.players.size}):** ${playerList}`
                        );
                    await interaction.editReply({ embeds: [updatedEmbed], components: [joinRow] }).catch(() => {});
                    await btn.reply({ content: `✅ <@${btn.user.id}> ¡Te has unido a la partida!`, flags: 64 });
                } else if (btn.customId.startsWith('trivia_start_')) {
                    if (btn.user.id !== interaction.user.id) {
                        return btn.reply({ content: '❌ Solo quien inició la partida puede empezarla antes de tiempo.', flags: 64 });
                    }
                    await btn.deferUpdate().catch(() => {});
                    await startGame();
                }
            });

            joinCollector.on('end', async (_, reason) => {
                if (reason !== 'started') {
                    await startGame();
                }
            });
        }
    },
};
