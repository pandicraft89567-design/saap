const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const PAGE_SIZE = 20;

// tipo: 'all' | 'animated' | 'static'
function searchEmojis(client, term, tipo = 'all') {
    const results = [];
    const query   = term?.toLowerCase().replace(/:/g, '').trim() || '';

    for (const guild of client.guilds.cache.values()) {
        for (const emoji of guild.emojis.cache.values()) {
            if (!emoji.name) continue;
            if (tipo === 'animated' && !emoji.animated)  continue;
            if (tipo === 'static'   &&  emoji.animated)  continue;
            if (query && !emoji.name.toLowerCase().includes(query)) continue;
            results.push({ emoji, guild });
        }
    }

    if (query) {
        results.sort((a, b) => {
            const aStarts = a.emoji.name.toLowerCase().startsWith(query);
            const bStarts = b.emoji.name.toLowerCase().startsWith(query);
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            return a.emoji.name.localeCompare(b.emoji.name);
        });
    }

    return results;
}

const TIPO_LABEL = { all: '✨ Todos', animated: '<a:lux:1385222769566027836> Animados', static: '🖼️ Estáticos' };

function buildEmbed(results, page, term, tipo, client) {
    const start  = page * PAGE_SIZE;
    const slice  = results.slice(start, start + PAGE_SIZE);
    const pages  = Math.ceil(results.length / PAGE_SIZE) || 1;

    const lines = slice.map(({ emoji, guild }) => {
        const tag  = emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
        const icon = emoji.animated ? '`GIF`' : '`IMG`';
        return `${tag} ${icon} \`:${emoji.name}:\` — *${guild.name}*`;
    });

    const tipoLabel = TIPO_LABEL[tipo] || tipo;
    const titulo    = `🔍 Emojis — ${tipoLabel}${term ? `  ·  "${term}"` : ''}`;

    return new EmbedBuilder()
        .setColor('#C084FC')
        .setTitle(titulo)
        .setDescription(lines.length ? lines.join('\n') : '❌ No encontré emojis con esos filtros.')
        .addFields(
            { name: '📊 Encontrados',  value: `${results.length}`,                       inline: true },
            { name: '🌐 Servidores',   value: `${client.guilds.cache.size}`,             inline: true },
            { name: '📄 Página',       value: `${page + 1} / ${pages}`,                 inline: true }
        )
        .setFooter({ text: 'Usa :nombre_emoji: en cualquier mensaje para enviarlos con NQN ✨' })
        .setTimestamp();
}

// customId: emojis~ACTION~PAGE~TYPE~TERM   (separador ~ para evitar conflictos con _)
function buildButtons(page, totalPages, tipo, term) {
    const base = `emojis~${page}~${tipo}~${term ?? ''}`;
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`prev~${base}`)
            .setLabel('◀ Anterior')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId(`next~${base}`)
            .setLabel('Siguiente ▶')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page >= totalPages - 1)
    );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setNameLocalizations({ 'en-US': 'emojis', 'en-GB': 'emojis' })
        .setDescription('Busca emojis de todos los servidores donde está Soledad 🔍')
        .setDescriptionLocalizations({ 'en-US': 'Search emojis from all servers where Soledad is 🔍', 'en-GB': 'Search emojis from all servers where Soledad is 🔍' })
        .addStringOption(opt =>
            opt.setName('buscar')
                .setNameLocalizations({ 'en-US': 'search', 'en-GB': 'search' })
                .setDescription('Nombre del emoji (ej: heart, uwu, fuego)')
                .setDescriptionLocalizations({ 'en-US': 'Emoji name (e.g. heart, uwu, fire)', 'en-GB': 'Emoji name (e.g. heart, uwu, fire)' })
                .setRequired(false)
                .setMaxLength(40))
        .addStringOption(opt =>
            opt.setName('tipo')
                .setNameLocalizations({ 'en-US': 'type', 'en-GB': 'type' })
                .setDescription('Filtrar por tipo de emoji')
                .setDescriptionLocalizations({ 'en-US': 'Filter by emoji type', 'en-GB': 'Filter by emoji type' })
                .setRequired(false)
                .addChoices(
                    { name: '✨ Todos',      value: 'all'      },
                    { name: '🎞️ Animados',  value: 'animated' },
                    { name: '🖼️ Estáticos', value: 'static'   }
                )),

    async execute(interaction) {
        await interaction.deferReply();

        const term    = interaction.options.getString('buscar') ?? '';
        const tipo    = interaction.options.getString('tipo')   ?? 'all';
        const results = searchEmojis(interaction.client, term, tipo);
        const pages   = Math.ceil(results.length / PAGE_SIZE) || 1;

        const msg = await interaction.editReply({
            embeds:     [buildEmbed(results, 0, term, tipo, interaction.client)],
            components: pages > 1 ? [buildButtons(0, pages, tipo, term)] : []
        });

        if (pages <= 1) return;

        const collector = msg.createMessageComponentCollector({ time: 120_000 });

        collector.on('collect', async btn => {
            if (btn.user.id !== interaction.user.id)
                return btn.reply({ content: '❌ Solo quien usó el comando puede navegar.', flags: 64 });

            await btn.deferUpdate();

            // customId: prev~emojis~CURRENTPAGE~TYPE~TERM
            const parts       = btn.customId.split('~');
            const action      = parts[0];           // prev | next
            const currentPage = parseInt(parts[2]);
            const queryTipo   = parts[3] || 'all';
            const queryTerm   = parts[4] || '';

            const newPage    = action === 'next' ? currentPage + 1 : currentPage - 1;
            const newResults = searchEmojis(interaction.client, queryTerm, queryTipo);
            const newPages   = Math.ceil(newResults.length / PAGE_SIZE) || 1;

            await interaction.editReply({
                embeds:     [buildEmbed(newResults, newPage, queryTerm, queryTipo, interaction.client)],
                components: [buildButtons(newPage, newPages, queryTipo, queryTerm)]
            });
        });

        collector.on('end', async () => {
            await interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};
