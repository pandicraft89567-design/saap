const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle,
    PermissionFlagsBits 
} = require('discord.js');

const PAGE_SIZE = 20;

/* =========================
   🔍 BUSCADOR
========================= */

function searchEmojis(client, term, tipo = 'all') {
    const results = [];
    const query = term?.toLowerCase().replace(/:/g, '').trim() || '';

    for (const guild of client.guilds.cache.values()) {
        for (const emoji of guild.emojis.cache.values()) {

            if (!emoji.name) continue;
            if (tipo === 'animated' && !emoji.animated) continue;
            if (tipo === 'static' && emoji.animated) continue;
            if (query && !emoji.name.toLowerCase().includes(query)) continue;

            results.push({ emoji, guild });
        }
    }

    return results;
}

function buildEmbed(results, page, term, tipo, client) {
    const start = page * PAGE_SIZE;
    const slice = results.slice(start, start + PAGE_SIZE);
    const pages = Math.ceil(results.length / PAGE_SIZE) || 1;

    const lines = slice.map(({ emoji, guild }) => {
        const tag = emoji.animated
            ? `<a:${emoji.name}:${emoji.id}>`
            : `<:${emoji.name}:${emoji.id}>`;

        return `${tag} \`:${emoji.name}:\` — *${guild.name}*`;
    });

    return new EmbedBuilder()
        .setColor('#C084FC')
        .setTitle(`🔍 Emojis ${term ? `· "${term}"` : ''}`)
        .setDescription(lines.join('\n') || '❌ No encontré emojis.')
        .addFields(
            { name: '📊 Total', value: `${results.length}`, inline: true },
            { name: '📄 Página', value: `${page + 1} / ${pages}`, inline: true }
        )
        .setTimestamp();
}

function buildButtons(page, totalPages, tipo, term) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`prev~${page}~${tipo}~${term}`)
            .setLabel('◀')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),

        new ButtonBuilder()
            .setCustomId(`next~${page}~${tipo}~${term}`)
            .setLabel('▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
    );
}

/* =========================
   🚀 COMANDO PRINCIPAL
========================= */

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Sistema de emojis')

        // 🔍 SUBCOMANDO BUSCAR
        .addSubcommand(cmd =>
            cmd.setName('buscar')
                .setDescription('Buscar emojis')
                .addStringOption(opt =>
                    opt.setName('nombre')
                        .setDescription('Nombre del emoji')
                        .setRequired(false))
                .addStringOption(opt =>
                    opt.setName('tipo')
                        .setDescription('Tipo')
                        .addChoices(
                            { name: 'Todos', value: 'all' },
                            { name: 'Animados', value: 'animated' },
                            { name: 'Estáticos', value: 'static' }
                        ))
        )

        // 🔥 SUBCOMANDO ROBAR
        .addSubcommand(cmd =>
            cmd.setName('robar')
                .setDescription('Robar emoji')
                .addStringOption(opt =>
                    opt.setName('emoji')
                        .setDescription('Emoji o ID')
                        .setRequired(true))
                .addStringOption(opt =>
                    opt.setName('nombre')
                        .setDescription('Nuevo nombre')
                        .setRequired(false))
        ),

    async execute(interaction) {

        const sub = interaction.options.getSubcommand();

        /* =========================
           🔍 BUSCAR
        ========================= */

        if (sub === 'buscar') {

            await interaction.deferReply();

            const term = interaction.options.getString('nombre') ?? '';
            const tipo = interaction.options.getString('tipo') ?? 'all';

            const results = searchEmojis(interaction.client, term, tipo);
            const pages = Math.ceil(results.length / PAGE_SIZE) || 1;

            const msg = await interaction.editReply({
                embeds: [buildEmbed(results, 0, term, tipo, interaction.client)],
                components: pages > 1 ? [buildButtons(0, pages, tipo, term)] : []
            });

            if (pages <= 1) return;

            const collector = msg.createMessageComponentCollector({ time: 120000 });

            collector.on('collect', async btn => {

                if (btn.user.id !== interaction.user.id)
                    return btn.reply({ content: '❌ No es tuyo.', flags: 64 });

                await btn.deferUpdate();

                const [action, page, tipo, term] = btn.customId.split('~');

                const newPage = action === 'next'
                    ? Number(page) + 1
                    : Number(page) - 1;

                const newResults = searchEmojis(interaction.client, term, tipo);
                const newPages = Math.ceil(newResults.length / PAGE_SIZE);

                await interaction.editReply({
                    embeds: [buildEmbed(newResults, newPage, term, tipo, interaction.client)],
                    components: [buildButtons(newPage, newPages, tipo, term)]
                });
            });
        }

        /* =========================
           🔥 ROBAR EMOJI
        ========================= */

        if (sub === 'robar') {

            if (!interaction.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
                return interaction.reply({
                    content: '❌ Sin permisos.',
                    flags: 64
                });
            }

            await interaction.deferReply();

            const input = interaction.options.getString('emoji');
            const nombreNuevo = interaction.options.getString('nombre');

            const match = input.match(/^<a?:([\w_]+):(\d+)>$/);

            let emojiId = null;
            let isAnimated = false;

            if (match) {
                emojiId = match[2];
                isAnimated = input.startsWith('<a:');
            } else if (/^\d+$/.test(input)) {
                emojiId = input;
            }

            if (!emojiId) {
                return interaction.editReply('❌ Emoji inválido.');
            }

            try {

                const url = `https://cdn.discordapp.com/emojis/${emojiId}.${isAnimated ? 'gif' : 'png'}?size=256`;

                const newEmoji = await interaction.guild.emojis.create({
                    attachment: url,
                    name: (nombreNuevo || 'emoji').replace(/[^a-zA-Z0-9_]/g, '_')
                });

                const str = newEmoji.animated
                    ? `<a:${newEmoji.name}:${newEmoji.id}>`
                    : `<:${newEmoji.name}:${newEmoji.id}>`;

                const embed = new EmbedBuilder()
                    .setColor('#2ecc71')
                    .setTitle('✅ Emoji robado')
                    .setDescription(`${str} añadido correctamente`)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });

            } catch (err) {
                await interaction.editReply(`❌ ${err.message}`);
            }
        }
    }
};
