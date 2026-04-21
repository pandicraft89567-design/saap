const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');

// ════════════════════════════════════════════════════════════════════
// PREFERENCIAS POR USUARIO (en memoria)
// ════════════════════════════════════════════════════════════════════
// Estructura: Map<userId, { font: string, symbol: string, categoryId: string|null }>
const prefs = new Map();

function getPrefs(userId) {
    if (!prefs.has(userId)) prefs.set(userId, { font: 'normal', symbol: '┊', categoryId: null });
    return prefs.get(userId);
}

// ════════════════════════════════════════════════════════════════════
// TIPOGRAFÍAS UNICODE
// ════════════════════════════════════════════════════════════════════
const FONTS = {
    normal:     { label: 'Normal',          example: 'verificacion' },
    bold:       { label: 'Negrita',         example: '𝐯𝐞𝐫𝐢𝐟𝐢𝐜𝐚𝐜𝐢𝐨𝐧' },
    italic:     { label: 'Cursiva',         example: '𝑣𝑒𝑟𝑖𝑓𝑖𝑐𝑎𝑐𝑖𝑜𝑛' },
    bolditalic: { label: 'Negrita Cursiva', example: '𝒗𝒆𝒓𝒊𝒇𝒊𝒄𝒂𝒄𝒊𝒐𝒏' },
    sans:       { label: 'Sans-Serif',      example: '𝗏𝖾𝗋𝗂𝖿𝗂𝖼𝖺𝖼𝗂𝗈𝗇' },
    sansbold:   { label: 'Sans Negrita',    example: '𝘃𝗲𝗿𝗶𝗳𝗶𝗰𝗮𝗰𝗶𝗼𝗻' },
    monospace:  { label: 'Monoespaciada',   example: '𝚟𝚎𝚛𝚒𝚏𝚒𝚌𝚊𝚌𝚒𝚘𝚗' },
    fraktur:    { label: 'Gótica',          example: '𝔳𝔢𝔯𝔦𝔣𝔦𝔠𝔞𝔠𝔦𝔬𝔫' },
    smallcaps:  { label: 'Versalitas',      example: 'ᴠᴇʀɪғɪᴄᴀᴄɪᴏɴ' },
};

const FONT_OFFSETS = {
    bold:       { upper: 0x1D400 - 0x41, lower: 0x1D41A - 0x61 },
    italic:     { upper: 0x1D434 - 0x41, lower: 0x1D44E - 0x61 },
    bolditalic: { upper: 0x1D468 - 0x41, lower: 0x1D482 - 0x61 },
    sans:       { upper: 0x1D5A0 - 0x41, lower: 0x1D5BA - 0x61 },
    sansbold:   { upper: 0x1D5D4 - 0x41, lower: 0x1D5EE - 0x61 },
    monospace:  { upper: 0x1D670 - 0x41, lower: 0x1D68A - 0x61 },
    fraktur:    { upper: 0x1D504 - 0x41, lower: 0x1D51E - 0x61 },
};

const SMALLCAPS_MAP = {
    a:'ᴀ',b:'ʙ',c:'ᴄ',d:'ᴅ',e:'ᴇ',f:'ғ',g:'ɢ',h:'ʜ',i:'ɪ',j:'ᴊ',
    k:'ᴋ',l:'ʟ',m:'ᴍ',n:'ɴ',o:'ᴏ',p:'ᴘ',q:'ǫ',r:'ʀ',s:'s',t:'ᴛ',
    u:'ᴜ',v:'ᴠ',w:'ᴡ',x:'x',y:'ʏ',z:'ᴢ',
};

function stripAccents(s) {
    return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function applyFont(text, font) {
    const clean = stripAccents(text);
    if (font === 'normal') return clean.toLowerCase();
    if (font === 'smallcaps') return clean.toLowerCase().split('').map(c => SMALLCAPS_MAP[c] || c).join('');

    const off = FONT_OFFSETS[font];
    if (!off) return clean.toLowerCase();
    return clean.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 0x41 && code <= 0x5A) return String.fromCodePoint(code + off.upper);
        if (code >= 0x61 && code <= 0x7A) return String.fromCodePoint(code + off.lower);
        return c;
    }).join('');
}

// ════════════════════════════════════════════════════════════════════
// SÍMBOLOS SEPARADORES
// ════════════════════════════════════════════════════════════════════
const SYMBOLS = [
    { value: '┊', label: 'Línea punteada vertical' },
    { value: '┃', label: 'Línea gruesa vertical'   },
    { value: '┆', label: 'Línea segmentada'        },
    { value: '‖', label: 'Doble línea vertical'    },
    { value: '╵', label: 'Línea corta'             },
    { value: '⌈', label: 'Esquina superior'        },
    { value: '╚', label: 'Esquina inferior'        },
    { value: '・', label: 'Punto medio japonés'    },
    { value: '⌗', label: 'Almohadilla cuadrada'    },
    { value: '·', label: 'Punto medio'             },
];

// ════════════════════════════════════════════════════════════════════
// EMOJI AUTOMÁTICO POR NOMBRE
// ════════════════════════════════════════════════════════════════════
const EMOJI_MAP = [
    [/general/i,                  '🌍'],
    [/verifica|verify/i,          '✅'],
    [/bienvenid|welcome/i,        '👋'],
    [/regla|rule/i,               '📜'],
    [/anuncio|announce|news/i,    '📢'],
    [/info/i,                     'ℹ️'],
    [/meme/i,                     '😂'],
    [/imagen|image|foto|pic/i,    '🖼️'],
    [/arte|art|draw|dibuj/i,      '🎨'],
    [/musica|music/i,             '🎵'],
    [/voz|voice/i,                '🔊'],
    [/juego|game|gaming/i,        '🎮'],
    [/bot/i,                      '🤖'],
    [/chat|charla/i,              '💬'],
    [/ayuda|help|soport|support/i,'🛠️'],
    [/staff/i,                    '🛡️'],
    [/admin/i,                    '👑'],
    [/log|registro/i,             '📋'],
    [/event|evento/i,             '🎉'],
    [/sorteo|giveaway/i,          '🎁'],
    [/anime/i,                    '🌸'],
    [/nsfw/i,                     '🔞'],
    [/clip|video/i,               '🎬'],
    [/foro|forum/i,               '💭'],
    [/sugerenc|suggest/i,         '💡'],
    [/reporte|report/i,           '🚨'],
    [/comando|command/i,          '⌨️'],
    [/economia|economy/i,         '💰'],
    [/nivel|level|rank/i,         '🏆'],
    [/tienda|shop|store/i,        '🛒'],
    [/premium|vip/i,              '💎'],
];

function autoEmoji(name) {
    for (const [re, emoji] of EMOJI_MAP) {
        if (re.test(name)) return emoji;
    }
    return '📌';
}

// ════════════════════════════════════════════════════════════════════
// CONSTRUCCIÓN DEL NOMBRE FINAL
// ════════════════════════════════════════════════════════════════════
function buildChannelName(rawName, userId) {
    const p     = getPrefs(userId);
    const emoji = autoEmoji(rawName);
    const text  = applyFont(rawName, p.font);
    return `${emoji}${p.symbol}${text}`;
}

// ════════════════════════════════════════════════════════════════════
// CANALES AUTO (agrupados por categoría)
// ════════════════════════════════════════════════════════════════════
const AUTO_CATEGORIES = [
    { name: '📌 INFORMACIÓN', channels: ['bienvenida', 'reglas', 'anuncios', 'verificacion'] },
    { name: '💬 COMUNIDAD',   channels: ['general',     'chat',   'sugerencias', 'ayuda']    },
    { name: '🎨 MEDIA',       channels: ['memes',       'imagenes', 'arte',     'musica']    },
    { name: '🎮 OCIO',        channels: ['juegos',      'anime',  'clips']                   },
    { name: '🤖 BOTS',        channels: ['bots',        'comandos', 'economia']              },
    { name: '🛡️ STAFF',        channels: ['staff',       'logs',   'reportes']                },
];

// ════════════════════════════════════════════════════════════════════
// EXPORT
// ════════════════════════════════════════════════════════════════════
module.exports = {
    // Exponemos helpers para que interactionCreate.js los pueda usar
    _prefs: prefs,
    _getPrefs: getPrefs,
    _FONTS: FONTS,
    _SYMBOLS: SYMBOLS,

    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Crea y personaliza canales con tipografías, símbolos y emojis automáticos')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)

        .addSubcommand(s => s
            .setName('letra')
            .setDescription('Elige el tipo de letra para los nombres de canal'))

        .addSubcommand(s => s
            .setName('simbolo')
            .setDescription('Elige el símbolo separador entre el emoji y el nombre'))

        .addSubcommand(s => s
            .setName('nombre')
            .setDescription('Crea un canal con la letra, símbolo y emoji automático')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del canal (ej: verificacion)').setRequired(true).setMaxLength(50))
            .addStringOption(o => o.setName('tipo').setDescription('Tipo de canal').setRequired(false)
                .addChoices(
                    { name: 'Texto', value: 'text'  },
                    { name: 'Voz',   value: 'voice' },
                )))

        .addSubcommand(s => s
            .setName('auto')
            .setDescription('Crea automáticamente los canales típicos (general, memes, reglas, etc.)'))

        .addSubcommandGroup(g => g
            .setName('categoria')
            .setDescription('Gestiona la categoría donde se crean los canales')
            .addSubcommand(s => s
                .setName('crear')
                .setDescription('Crea una nueva categoría y la usa para próximos canales')
                .addStringOption(o => o.setName('nombre').setDescription('Nombre de la categoría').setRequired(true).setMaxLength(50)))
            .addSubcommand(s => s
                .setName('elegir')
                .setDescription('Elige una categoría existente para los próximos canales')
                .addChannelOption(o => o.setName('categoria').setDescription('Categoría destino').addChannelTypes(ChannelType.GuildCategory).setRequired(true)))
            .addSubcommand(s => s
                .setName('quitar')
                .setDescription('Deja de usar categoría (los canales se crearán en la raíz)'))),

    async execute(interaction) {
        const sub   = interaction.options.getSubcommand();
        const group = interaction.options.getSubcommandGroup(false);
        const userId = interaction.user.id;

        // ── /channel letra ──────────────────────────────────────────
        if (sub === 'letra' && !group) {
            const menu = new StringSelectMenuBuilder()
                .setCustomId('channel_font_select')
                .setPlaceholder('Selecciona un tipo de letra')
                .addOptions(Object.entries(FONTS).map(([key, v]) => ({
                    label:       v.label,
                    description: v.example.slice(0, 90),
                    value:       key,
                })));

            const embed = new EmbedBuilder()
                .setColor('#C084FC')
                .setTitle('🔤 Elige tu tipo de letra')
                .setDescription(
                    Object.entries(FONTS).map(([k, v]) => `• **${v.label}** → \`${v.example}\``).join('\n') +
                    `\n\n*Actual: **${FONTS[getPrefs(userId).font].label}***`
                );

            return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)], flags: 64 });
        }

        // ── /channel simbolo ────────────────────────────────────────
        if (sub === 'simbolo' && !group) {
            const menu = new StringSelectMenuBuilder()
                .setCustomId('channel_symbol_select')
                .setPlaceholder('Selecciona un símbolo separador')
                .addOptions(SYMBOLS.map(s => ({
                    label:       `${s.value}   —   ${s.label}`,
                    description: `Ejemplo: ✅${s.value}verificacion`,
                    value:       s.value,
                })));

            const embed = new EmbedBuilder()
                .setColor('#C084FC')
                .setTitle('➗ Elige tu símbolo separador')
                .setDescription(
                    SYMBOLS.map(s => `• \`${s.value}\` → ✅${s.value}verificacion  *(${s.label})*`).join('\n') +
                    `\n\n*Actual: \`${getPrefs(userId).symbol}\`*`
                );

            return interaction.reply({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)], flags: 64 });
        }

        // ── /channel nombre ─────────────────────────────────────────
        if (sub === 'nombre' && !group) {
            await interaction.deferReply({ flags: 64 });

            const raw  = interaction.options.getString('nombre');
            const tipo = interaction.options.getString('tipo') || 'text';
            const p    = getPrefs(userId);

            const finalName = buildChannelName(raw, userId);

            try {
                const canal = await interaction.guild.channels.create({
                    name:   finalName,
                    type:   tipo === 'voice' ? ChannelType.GuildVoice : ChannelType.GuildText,
                    parent: p.categoryId || undefined,
                    reason: `Canal creado por ${interaction.user.username} via /channel nombre`,
                });

                const confirm = new EmbedBuilder()
                    .setColor('#51cf66')
                    .setTitle('✅ Canal creado')
                    .addFields(
                        { name: '📛 Nombre',     value: `<#${canal.id}>`,                        inline: true },
                        { name: '🔤 Letra',      value: FONTS[p.font].label,                     inline: true },
                        { name: '➗ Símbolo',    value: `\`${p.symbol}\``,                       inline: true },
                        { name: '😀 Emoji',      value: autoEmoji(raw),                          inline: true },
                        { name: '📁 Categoría',  value: p.categoryId ? `<#${p.categoryId}>` : 'Ninguna', inline: true },
                        { name: '📺 Tipo',       value: tipo === 'voice' ? 'Voz' : 'Texto',      inline: true },
                    )
                    .setTimestamp();

                return interaction.editReply({ embeds: [confirm] });
            } catch (err) {
                console.error('Error creando canal:', err);
                return interaction.editReply({ content: `❌ No pude crear el canal: ${err.message}` });
            }
        }

        // ── /channel auto ───────────────────────────────────────────
        if (sub === 'auto' && !group) {
            await interaction.deferReply({ flags: 64 });

            const resumen      = [];
            const fallidos     = [];
            let totalCanales   = 0;
            let totalCreados   = 0;

            for (const cat of AUTO_CATEGORIES) {
                let categoria = null;
                try {
                    categoria = await interaction.guild.channels.create({
                        name:   cat.name,
                        type:   ChannelType.GuildCategory,
                        reason: `Categoría automática creada por ${interaction.user.username}`,
                    });
                } catch (err) {
                    fallidos.push(`Categoría \`${cat.name}\` (${err.message})`);
                    continue;
                }

                const creadosCat = [];
                for (const nombreRaw of cat.channels) {
                    totalCanales++;
                    const finalName = buildChannelName(nombreRaw, userId);
                    try {
                        const canal = await interaction.guild.channels.create({
                            name:   finalName,
                            type:   ChannelType.GuildText,
                            parent: categoria.id,
                            reason: `Canal automático creado por ${interaction.user.username}`,
                        });
                        creadosCat.push(`<#${canal.id}>`);
                        totalCreados++;
                    } catch (err) {
                        fallidos.push(`\`${nombreRaw}\` (${err.message})`);
                    }
                }

                resumen.push({
                    name:  `📁 ${cat.name}`,
                    value: creadosCat.length ? creadosCat.join(' ') : '*sin canales*',
                });
            }

            const embed = new EmbedBuilder()
                .setColor(fallidos.length ? '#ffd43b' : '#51cf66')
                .setTitle(`✅ Servidor auto-organizado (${totalCreados}/${totalCanales} canales en ${AUTO_CATEGORIES.length} categorías)`)
                .addFields(resumen.slice(0, 25))
                .setTimestamp();

            if (fallidos.length) {
                embed.addFields({ name: '❌ Fallidos', value: fallidos.join('\n').slice(0, 1024) });
            }

            return interaction.editReply({ embeds: [embed] });
        }

        // ── /channel categoria crear ────────────────────────────────
        if (group === 'categoria' && sub === 'crear') {
            await interaction.deferReply({ flags: 64 });
            const nombre = interaction.options.getString('nombre');

            try {
                const cat = await interaction.guild.channels.create({
                    name:   nombre.toUpperCase(),
                    type:   ChannelType.GuildCategory,
                    reason: `Categoría creada por ${interaction.user.username}`,
                });
                getPrefs(userId).categoryId = cat.id;

                return interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('✅ Categoría creada y seleccionada')
                        .setDescription(`Los próximos canales se crearán en **${cat.name}**.`)],
                });
            } catch (err) {
                return interaction.editReply({ content: `❌ No pude crear la categoría: ${err.message}` });
            }
        }

        // ── /channel categoria elegir ───────────────────────────────
        if (group === 'categoria' && sub === 'elegir') {
            const cat = interaction.options.getChannel('categoria');
            getPrefs(userId).categoryId = cat.id;

            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#51cf66')
                    .setTitle('✅ Categoría seleccionada')
                    .setDescription(`Los próximos canales se crearán en **${cat.name}**.`)],
                flags: 64,
            });
        }

        // ── /channel categoria quitar ───────────────────────────────
        if (group === 'categoria' && sub === 'quitar') {
            getPrefs(userId).categoryId = null;
            return interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#ff9500')
                    .setTitle('➖ Categoría desactivada')
                    .setDescription('Los próximos canales se crearán en la raíz del servidor.')],
                flags: 64,
            });
        }
    },
};
