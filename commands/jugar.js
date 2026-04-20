const {
    SlashCommandBuilder, EmbedBuilder, ActionRowBuilder,
    ButtonBuilder, ButtonStyle, StringSelectMenuBuilder,
} = require('discord.js');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ═══════════════════════════════════════════════════════════════
// JUEGO 1 — Piedra, Papel o Tijeras (5 rondas vs bot)
// ═══════════════════════════════════════════════════════════════
async function startPPT(interaction) {
    const BEATS = { piedra: 'tijeras', papel: 'piedra', tijeras: 'papel' };
    const EMOJI  = { piedra: '🪨', papel: '📄', tijeras: '✂️' };
    const OPTIONS = ['piedra', 'papel', 'tijeras'];
    const ROUNDS  = 5;
    let wins = 0, losses = 0, ties = 0, round = 0;

    function result(player, bot) {
        if (player === bot) return 'tie';
        return BEATS[player] === bot ? 'win' : 'loss';
    }

    function embed(res = null, pChoice = null, bChoice = null) {
        const e = new EmbedBuilder()
            .setColor('#4ECDC4')
            .setTitle('🪨 Piedra, Papel o Tijeras')
            .setDescription(round < ROUNDS ? `Ronda **${round + 1}** de **${ROUNDS}** — ¡Elige!` : '¡Juego terminado!')
            .addFields(
                { name: '✅ Victorias', value: `${wins}`,   inline: true },
                { name: '❌ Derrotas',  value: `${losses}`, inline: true },
                { name: '🤝 Empates',   value: `${ties}`,   inline: true },
            )
            .setFooter({ text: 'Soledad ❣ — Juegos' })
            .setTimestamp();

        if (res && pChoice && bChoice) {
            const txt = res === 'win' ? '✅ ¡Ganaste esta ronda!' : res === 'loss' ? '❌ Perdiste esta ronda.' : '🤝 Empate.';
            e.addFields({ name: 'Resultado', value: `Tú: ${EMOJI[pChoice]} | Bot: ${EMOJI[bChoice]}\n${txt}`, inline: false });
        }
        return e;
    }

    function buttons(disabled = false) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ppt_piedra').setLabel('Piedra').setEmoji('🪨').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId('ppt_papel').setLabel('Papel').setEmoji('📄').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
            new ButtonBuilder().setCustomId('ppt_tijeras').setLabel('Tijeras').setEmoji('✂️').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
        );
    }

    const msg = await interaction.editReply({ embeds: [embed()], components: [buttons()] });
    const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId.startsWith('ppt_'),
        time: 5 * 60 * 1000,
    });

    col.on('collect', async btn => {
        await btn.deferUpdate();
        round++;
        const player = btn.customId.replace('ppt_', '');
        const bot    = OPTIONS[Math.floor(Math.random() * 3)];
        const res    = result(player, bot);
        if (res === 'win') wins++; else if (res === 'loss') losses++; else ties++;

        if (round >= ROUNDS) {
            col.stop('done');
            const final = embed(res, player, bot);
            final.setDescription(wins > losses ? '🏆 ¡Ganaste el juego!' : losses > wins ? '😔 El bot ganó.' : '🤝 Empate total.');
            await interaction.editReply({ embeds: [final], components: [] });
        } else {
            await interaction.editReply({ embeds: [embed(res, player, bot)], components: [buttons()] });
        }
    });

    col.on('end', async (_, r) => { if (r !== 'done') await interaction.editReply({ components: [] }).catch(() => {}); });
}

// ═══════════════════════════════════════════════════════════════
// JUEGO 2 — Mayor o Menor (7 rondas)
// ═══════════════════════════════════════════════════════════════
async function startMayorMenor(interaction) {
    const ROUNDS = 7;
    let current = Math.floor(Math.random() * 10) + 1;
    let round = 0, score = 0;

    function embed(res = null, prev = null, next = null) {
        const e = new EmbedBuilder()
            .setColor('#FF6B6B')
            .setTitle('⬆️ Mayor o Menor')
            .setDescription(round < ROUNDS
                ? `**Número actual: ${current}**\n¿El siguiente será mayor o menor?`
                : '¡Juego terminado!')
            .addFields(
                { name: '🎯 Puntos', value: `${score}/${ROUNDS}`, inline: true },
                { name: '🔄 Ronda',  value: `${round}/${ROUNDS}`, inline: true },
            )
            .setFooter({ text: 'Números del 1 al 10 • Soledad ❣' })
            .setTimestamp();

        if (res !== null) {
            e.addFields({
                name: 'Resultado',
                value: `**${prev}** → **${next}**\n${res ? '✅ ¡Correcto!' : '❌ ¡Incorrecto!'}`,
            });
        }
        return e;
    }

    function buttons(disabled = false) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('mm_mayor').setLabel('Mayor').setEmoji('⬆️').setStyle(ButtonStyle.Success).setDisabled(disabled),
            new ButtonBuilder().setCustomId('mm_menor').setLabel('Menor').setEmoji('⬇️').setStyle(ButtonStyle.Danger).setDisabled(disabled),
        );
    }

    const msg = await interaction.editReply({ embeds: [embed()], components: [buttons()] });
    const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId.startsWith('mm_'),
        time: 5 * 60 * 1000,
    });

    col.on('collect', async btn => {
        await btn.deferUpdate();
        round++;
        const prev    = current;
        const next    = Math.floor(Math.random() * 10) + 1;
        const guessed = btn.customId === 'mm_mayor';
        const correct = guessed ? next > prev : next < prev;
        if (correct) score++;
        current = next;

        if (round >= ROUNDS) {
            col.stop('done');
            const final = embed(correct, prev, next);
            final.setDescription(score >= 6 ? `🏆 ¡Excelente! ${score}/${ROUNDS}` : score >= 4 ? `👍 ¡Bien! ${score}/${ROUNDS}` : `😔 ${score}/${ROUNDS}. ¡Practica más!`);
            await interaction.editReply({ embeds: [final], components: [] });
        } else {
            await interaction.editReply({ embeds: [embed(correct, prev, next)], components: [buttons()] });
        }
    });

    col.on('end', async (_, r) => { if (r !== 'done') await interaction.editReply({ components: [] }).catch(() => {}); });
}

// ═══════════════════════════════════════════════════════════════
// JUEGO 3 — Campo Minado (cuadrícula 3×3 con 3 minas)
// ═══════════════════════════════════════════════════════════════
async function startMinas(interaction) {
    const TOTAL  = 9;
    const MINES  = 3;
    const SAFE   = TOTAL - MINES;

    const mines    = new Set();
    while (mines.size < MINES) mines.add(Math.floor(Math.random() * TOTAL));
    const revealed = new Array(TOTAL).fill(false);
    let revealedCount = 0;

    function rows(disabled = false, exploded = -1, showAll = false) {
        const result = [];
        for (let r = 0; r < 3; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 3; c++) {
                const i = r * 3 + c;
                let emoji, style;
                if (showAll) {
                    emoji = mines.has(i) ? '💣' : revealed[i] ? '✅' : '⬛';
                    style = mines.has(i) ? ButtonStyle.Danger : revealed[i] ? ButtonStyle.Success : ButtonStyle.Secondary;
                } else if (i === exploded) {
                    emoji = '💥'; style = ButtonStyle.Danger;
                } else if (revealed[i]) {
                    emoji = '✅'; style = ButtonStyle.Success;
                } else {
                    emoji = '🟦'; style = ButtonStyle.Secondary;
                }
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`mina_${i}`)
                        .setLabel('\u200b')
                        .setEmoji(emoji)
                        .setStyle(style)
                        .setDisabled(disabled || revealed[i])
                );
            }
            result.push(row);
        }
        return result;
    }

    function embed(status = 'playing') {
        const e = new EmbedBuilder()
            .setColor('#FF9500')
            .setTitle('💣 Campo Minado')
            .addFields(
                { name: '💣 Minas',     value: `${MINES}`,                  inline: true },
                { name: '✅ Seguras',   value: `${revealedCount}/${SAFE}`,   inline: true },
            )
            .setFooter({ text: 'Soledad ❣ — Juegos' })
            .setTimestamp();

        if (status === 'playing') e.setDescription('¡Encuentra las casillas seguras sin pisar una mina!');
        else if (status === 'win')  e.setDescription('🏆 ¡Ganaste! ¡Encontraste todas las casillas seguras!').setColor('#51cf66');
        else                        e.setDescription('💥 ¡BOOM! Pisaste una mina. ¡Inténtalo de nuevo!').setColor('#ff4757');
        return e;
    }

    const msg = await interaction.editReply({ embeds: [embed()], components: rows() });
    const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId.startsWith('mina_'),
        time: 5 * 60 * 1000,
    });

    col.on('collect', async btn => {
        await btn.deferUpdate();
        const idx = parseInt(btn.customId.replace('mina_', ''));

        if (mines.has(idx)) {
            col.stop('done');
            await interaction.editReply({ embeds: [embed('lose')], components: rows(true, idx, true) });
        } else {
            revealed[idx] = true;
            revealedCount++;
            if (revealedCount >= SAFE) {
                col.stop('done');
                await interaction.editReply({ embeds: [embed('win')], components: rows(true, -1, true) });
            } else {
                await interaction.editReply({ embeds: [embed()], components: rows() });
            }
        }
    });

    col.on('end', async (_, r) => { if (r !== 'done') await interaction.editReply({ components: [] }).catch(() => {}); });
}

// ═══════════════════════════════════════════════════════════════
// JUEGO 4 — Blackjack
// ═══════════════════════════════════════════════════════════════
function makeDeck() {
    const suits  = ['♠', '♥', '♦', '♣'];
    const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    const deck   = suits.flatMap(s => values.map(v => `${v}${s}`));
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function cardVal(card) {
    const v = card.slice(0, -1);
    if (['J', 'Q', 'K'].includes(v)) return 10;
    if (v === 'A') return 11;
    return parseInt(v);
}

function handVal(cards) {
    let total = cards.reduce((s, c) => s + cardVal(c), 0);
    let aces  = cards.filter(c => c.startsWith('A')).length;
    while (total > 21 && aces-- > 0) total -= 10;
    return total;
}

async function startBlackjack(interaction) {
    const deck  = makeDeck();
    const pCards = [deck.pop(), deck.pop()];
    const dCards = [deck.pop(), deck.pop()];

    function embed(showDealer = false, status = 'playing') {
        const pv = handVal(pCards);
        const dv = handVal(dCards);
        const e  = new EmbedBuilder()
            .setColor('#F7B731')
            .setTitle('🃏 Blackjack')
            .addFields(
                { name: '🎴 Tus cartas', value: `${pCards.join(' ')} = **${pv}**`, inline: true },
                { name: '🤖 Bot',        value: showDealer ? `${dCards.join(' ')} = **${dv}**` : `${dCards[0]} 🂠`, inline: true },
            )
            .setFooter({ text: 'Llega a 21 sin pasarte • Soledad ❣' })
            .setTimestamp();

        if (status === 'playing') {
            e.setDescription('¿Pides otra carta o te plantas?');
        } else {
            const pFinal = handVal(pCards), dFinal = handVal(dCards);
            if (status === 'bust')      { e.setDescription(`💥 ¡Te pasaste! (${pFinal})`).setColor('#ff4757'); }
            else if (status === 'blackjack') { e.setDescription('🃏 ¡BLACKJACK! ¡21 automático!').setColor('#51cf66'); }
            else if (pFinal > dFinal || dFinal > 21) { e.setDescription(`🏆 ¡Ganaste! ${pFinal} vs ${dFinal}`).setColor('#51cf66'); }
            else if (pFinal === dFinal) { e.setDescription(`🤝 Empate (${pFinal})`).setColor('#ffd43b'); }
            else                        { e.setDescription(`😔 El bot gana. ${pFinal} vs ${dFinal}`).setColor('#ff4757'); }
        }
        return e;
    }

    function bjButtons(disabled = false) {
        return new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('bj_pedir').setLabel('Pedir carta').setEmoji('🃏').setStyle(ButtonStyle.Success).setDisabled(disabled),
            new ButtonBuilder().setCustomId('bj_plantar').setLabel('Plantarse').setEmoji('✋').setStyle(ButtonStyle.Danger).setDisabled(disabled),
        );
    }

    if (handVal(pCards) === 21) {
        await interaction.editReply({ embeds: [embed(true, 'blackjack')], components: [] });
        return;
    }

    const msg = await interaction.editReply({ embeds: [embed()], components: [bjButtons()] });
    const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId.startsWith('bj_'),
        time: 5 * 60 * 1000,
    });

    col.on('collect', async btn => {
        await btn.deferUpdate();
        if (btn.customId === 'bj_pedir') {
            pCards.push(deck.pop());
            const val = handVal(pCards);
            if (val > 21) {
                col.stop('done');
                await interaction.editReply({ embeds: [embed(true, 'bust')], components: [] });
            } else if (val === 21) {
                while (handVal(dCards) < 17) dCards.push(deck.pop());
                col.stop('done');
                await interaction.editReply({ embeds: [embed(true, 'result')], components: [] });
            } else {
                await interaction.editReply({ embeds: [embed()], components: [bjButtons()] });
            }
        } else {
            while (handVal(dCards) < 17) dCards.push(deck.pop());
            col.stop('done');
            await interaction.editReply({ embeds: [embed(true, 'result')], components: [] });
        }
    });

    col.on('end', async (_, r) => { if (r !== 'done') await interaction.editReply({ components: [] }).catch(() => {}); });
}

// ═══════════════════════════════════════════════════════════════
// JUEGO 5 — Parejas (Memory Match 4×2)
// ═══════════════════════════════════════════════════════════════
async function startParejas(interaction) {
    const PAIRS   = ['🎮', '🌟', '🎵', '🎭'];
    const board   = [...PAIRS, ...PAIRS].sort(() => Math.random() - 0.5);
    const matched = new Set();
    let firstIdx  = null;
    let moves     = 0;

    function buildRows(tempReveal = new Set(), disabled = false) {
        const result = [];
        for (let r = 0; r < 2; r++) {
            const row = new ActionRowBuilder();
            for (let c = 0; c < 4; c++) {
                const i = r * 4 + c;
                const isMatched = matched.has(i);
                const isFirst   = firstIdx === i;
                const isTemp    = tempReveal.has(i);
                row.addComponents(
                    new ButtonBuilder()
                        .setCustomId(`par_${i}`)
                        .setLabel('\u200b')
                        .setEmoji(isMatched || isFirst || isTemp ? board[i] : '❓')
                        .setStyle(isMatched ? ButtonStyle.Success : (isFirst || isTemp) ? ButtonStyle.Primary : ButtonStyle.Secondary)
                        .setDisabled(disabled || isMatched || isFirst)
                );
            }
            result.push(row);
        }
        return result;
    }

    function embed(done = false) {
        return new EmbedBuilder()
            .setColor(done ? '#51cf66' : '#9B59B6')
            .setTitle('🧠 Parejas')
            .setDescription(done ? `🏆 ¡Ganaste en **${moves}** movimientos!` : '¡Encuentra los 4 pares de emojis ocultos!')
            .addFields(
                { name: '✅ Pares encontrados', value: `${matched.size / 2}/4`, inline: true },
                { name: '🔄 Movimientos',        value: `${moves}`,             inline: true },
            )
            .setFooter({ text: 'Soledad ❣ — Juegos' })
            .setTimestamp();
    }

    const msg = await interaction.editReply({ embeds: [embed()], components: buildRows() });
    const col = msg.createMessageComponentCollector({
        filter: i => i.user.id === interaction.user.id && i.customId.startsWith('par_'),
        time: 5 * 60 * 1000,
    });

    col.on('collect', async btn => {
        await btn.deferUpdate();
        const idx = parseInt(btn.customId.replace('par_', ''));

        if (firstIdx === null) {
            firstIdx = idx;
            await interaction.editReply({ embeds: [embed()], components: buildRows() });
        } else {
            moves++;
            const second = idx;
            const first  = firstIdx;
            firstIdx     = null;

            if (board[first] === board[second]) {
                matched.add(first);
                matched.add(second);
                if (matched.size === 8) {
                    col.stop('done');
                    await interaction.editReply({ embeds: [embed(true)], components: buildRows(new Set(), true) });
                } else {
                    await interaction.editReply({ embeds: [embed()], components: buildRows() });
                }
            } else {
                // Mostrar ambas cartas brevemente (rojo) y luego ocultar
                const temp = new Set([first, second]);
                const tempRows = [];
                for (let r = 0; r < 2; r++) {
                    const row = new ActionRowBuilder();
                    for (let c = 0; c < 4; c++) {
                        const i = r * 4 + c;
                        const isM = matched.has(i), isT = temp.has(i);
                        row.addComponents(
                            new ButtonBuilder()
                                .setCustomId(`par_${i}`)
                                .setLabel('\u200b')
                                .setEmoji(isM || isT ? board[i] : '❓')
                                .setStyle(isM ? ButtonStyle.Success : isT ? ButtonStyle.Danger : ButtonStyle.Secondary)
                                .setDisabled(true)
                        );
                    }
                    tempRows.push(row);
                }
                await interaction.editReply({ embeds: [embed()], components: tempRows });
                await sleep(1500);
                await interaction.editReply({ embeds: [embed()], components: buildRows() }).catch(() => {});
            }
        }
    });

    col.on('end', async (_, r) => { if (r !== 'done') await interaction.editReply({ components: [] }).catch(() => {}); });
}

// ═══════════════════════════════════════════════════════════════
// COMANDO PRINCIPAL
// ═══════════════════════════════════════════════════════════════
module.exports = {
    data: new SlashCommandBuilder()
        .setName('jugar')
        .setDescription('Elige un juego interactivo y juega con botones'),

    async execute(interaction) {
        await interaction.deferReply();

        const menuEmbed = new EmbedBuilder()
            .setColor('#C084FC')
            .setTitle('🎮 ¡Hora de jugar!')
            .setDescription('Elige un juego del menú de abajo y juega con botones:')
            .addFields(
                { name: '🪨 Piedra, Papel o Tijeras', value: '5 rondas contra el bot',                   inline: true },
                { name: '⬆️ Mayor o Menor',           value: 'Adivina si el siguiente número es M/m',    inline: true },
                { name: '💣 Campo Minado',             value: 'Cuadrícula 3×3 con 3 minas ocultas',       inline: true },
                { name: '🃏 Blackjack',                value: 'Llega a 21 sin pasarte',                   inline: true },
                { name: '🧠 Parejas',                  value: 'Encuentra los 4 pares de emojis ocultos',  inline: true },
            )
            .setFooter({ text: 'Soledad ❣ — Juegos interactivos' })
            .setTimestamp();

        const selectRow = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('game_select')
                .setPlaceholder('🎮 Selecciona un juego...')
                .addOptions([
                    { label: 'Piedra, Papel o Tijeras', description: '5 rondas contra el bot',            value: 'ppt',         emoji: '🪨' },
                    { label: 'Mayor o Menor',            description: 'Adivina el siguiente número',       value: 'mayor_menor', emoji: '⬆️' },
                    { label: 'Campo Minado',             description: 'No pises las minas',                value: 'minas',       emoji: '💣' },
                    { label: 'Blackjack',                description: 'Llega a 21 sin pasarte',            value: 'blackjack',   emoji: '🃏' },
                    { label: 'Parejas',                  description: 'Encuentra los 4 pares ocultos',     value: 'parejas',     emoji: '🧠' },
                ])
        );

        const msg = await interaction.editReply({ embeds: [menuEmbed], components: [selectRow] });

        const menuCol = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60_000,
            max: 1,
        });

        menuCol.on('collect', async sel => {
            await sel.deferUpdate();
            switch (sel.values[0]) {
                case 'ppt':         return startPPT(interaction);
                case 'mayor_menor': return startMayorMenor(interaction);
                case 'minas':       return startMinas(interaction);
                case 'blackjack':   return startBlackjack(interaction);
                case 'parejas':     return startParejas(interaction);
            }
        });

        menuCol.on('end', async (_, r) => {
            if (r === 'time') await interaction.editReply({ components: [] }).catch(() => {});
        });
    },
};
