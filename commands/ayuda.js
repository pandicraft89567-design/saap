const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { generateAIMessage } = require('../utils/ai');

async function getBotBanner(client) {
    try {
        const botUser = await client.users.fetch(client.user.id, { force: true });
        return botUser.bannerURL({ size: 1024 }) || null;
    } catch { return null; }
}

async function generateHelpIntro(username) {
    const prompt = `Eres Soledad, un bot de Discord con personalidad tierna, juguetona y un poco tsundere. Un usuario llamado "${username}" acaba de usar el comando /ayuda. Escribe UN saludo corto y creativo (máximo 2 oraciones) para presentar el menú de ayuda. Varía el tono: a veces alegre, a veces sarcástica, a veces misteriosa. No menciones categorías ni comandos. Solo el saludo de bienvenida al menú.`;
    return generateAIMessage(prompt, 80);
}

function createNavButtons() {
    const row1 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_entretenimiento').setLabel('Ocio').setEmoji('1488064981210628128').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('help_gaming').setLabel('Economía').setEmoji('1488065105856954471').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('help_social').setLabel('Social').setEmoji('1488065630765846598').setStyle(ButtonStyle.Primary)
    );
    const row2 = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('help_utils').setLabel('Utilidades').setEmoji('1488065220630020096').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('help_mod').setLabel('Moderación').setEmoji('1488066844773584927').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('help_premium').setLabel('VIP').setEmoji('1488064668705751050').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId('help_home').setLabel('Inicio').setEmoji('1488065968100872212').setStyle(ButtonStyle.Secondary)
    );
    return [row1, row2];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ayuda')
        .setDescription('Muestra todos los comandos disponibles del bot'),

    async execute(interaction) {
        await interaction.deferReply();

        const [aiIntro, bannerUrl] = await Promise.all([
            generateHelpIntro(interaction.user.displayName || interaction.user.username),
            getBotBanner(interaction.client)
        ]);
        const description = aiIntro || '¡Hola! Aquí están todos mis comandos disponibles.';

        const mainEmbed = new EmbedBuilder()
            .setTitle('<a:lux:1385222769566027836> Soledad ❣ — Menú de Ayuda')
            .setDescription(`${description}\n\u200B`)
            .setColor('#C084FC')
            .addFields(
                { name: '🎬 Ocio & Media',    value: 'YouTube, memes y entretenimiento.',     inline: true },
                { name: '🎮 Economía',         value: 'Solecoins, tienda y minijuegos.',        inline: true },
                { name: '💬 Social',           value: 'Anime, interacciones y diversión.',      inline: true },
                { name: '⚙️ Utilidades',       value: 'Info, servidor y configuración.',        inline: true },
                { name: '🛡️ Moderación',       value: 'Ban, kick, silenciar y más.',            inline: true },
                { name: '💎 VIP Premium',      value: 'Comandos exclusivos para suscriptores.', inline: true },
                { name: '\u200B', value: '> 💎 ¿Quieres ser **VIP**? Suscríbete en [**whop.com/soledad-858d**](https://whop.com/soledad-858d)', inline: false }
            )
            .setThumbnail(interaction.client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: `Soledad ❣ • Usa los botones para navegar • ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        if (bannerUrl) mainEmbed.setImage(bannerUrl);

        await interaction.editReply({ embeds: [mainEmbed], components: createNavButtons() });
    },

    createCategoryEmbed(category, commandIds, bannerUrl = null) {
        const m = (name, sub) => {
            if (!commandIds) return sub ? `\`/${name} ${sub}\`` : `\`/${name}\``;
            const id = commandIds.get(name);
            if (!id) return sub ? `\`/${name} ${sub}\`` : `\`/${name}\``;
            return sub ? `</${name} ${sub}:${id}>` : `</${name}:${id}>`;
        };

        const embeds = {
            entretenimiento: new EmbedBuilder()
                .setTitle('🎬 Ocio & Media')
                .setColor('#FF6B6B')
                .setDescription('Comandos de entretenimiento, contenido y medios.')
                .addFields(
                    { name: '🔍 Buscar YouTube',  value: m('yt'),       inline: true },
                    { name: '🤣 Meme aleatorio',  value: m('meme'),     inline: true },
                    { name: '🎮 Pokédex',          value: m('poke'),     inline: true },
                    { name: '💬 Cita famosa',      value: m('cita'),     inline: true },
                    { name: '🔮 Fortuna del día',  value: m('fortuna'),  inline: true }
                ),

            gaming: new EmbedBuilder()
                .setTitle('🎮 Economía & Minijuegos')
                .setColor('#4ADE80')
                .setDescription('Sistema de Solecoins, tienda y juegos de apuesta.')
                .addFields(
                    { name: '💰 Economía',     value: m('economy'),   inline: true },
                    { name: '🛒 Tienda',        value: m('shop'),      inline: true },
                    { name: '💎 Premium',       value: m('premium'),   inline: true },
                    { name: '⛏️ Minecraft',     value: m('minecraft'), inline: true },
                    { name: '🎮 Roblox',        value: m('roblox'),    inline: true },
                    { name: '🪙 Moneda',         value: m('coinflip'), inline: true },
                    { name: '🎲 Dado',           value: m('dado'),     inline: true },
                    { name: '🧠 Trivia',         value: m('trivia'),   inline: true },
                    { name: '✂️ Piedra, papel…', value: m('rps'),      inline: true },
                    { name: '💸 Robar',          value: m('robar'),    inline: true },
                    { name: '🎰 Ruleta',         value: m('ruleta'),   inline: true },
                    { name: '🛒 Comprar monedas', value: m('comprar'),  inline: true },
                    { name: '🔁 Canjear monedas', value: m('canjear'),  inline: true },
                    { name: '🌟 Servidores',     value: m('join'),     inline: true },
                    { name: '🎲 Dados D&D',      value: m('dados'),    inline: true }
                ),

            social: new EmbedBuilder()
                .setTitle('💬 Social & Anime')
                .setColor('#F472B6')
                .setDescription('Interacciones sociales, anime y entretenimiento con IA.')
                .addFields(
                    { name: '💋 Beso',            value: m('diversion', 'beso'),     inline: true },
                    { name: '🤗 Abrazar',         value: m('diversion', 'abrazo'),  inline: true },
                    { name: '🌸 Pat pat',         value: m('diversion', 'pat'),     inline: true },
                    { name: '👋 Bofetada',        value: m('diversion', 'slap'),    inline: true },
                    { name: '💀 Matar',           value: m('diversion', 'matar'),   inline: true },
                    { name: '🖼️ Waifu',           value: m('diversion', 'waifu'),   inline: true },
                    { name: '👊 Castigar',        value: m('diversion', 'castigar'), inline: true },
                    { name: '💖 Cumplido',        value: m('cumplido'),             inline: true },
                    { name: '🔍 Buscar emojis',   value: m('emojis'),               inline: true },
                    { name: '🧩 Acertijo IA',     value: m('acertijo'),             inline: true },
                    { name: '💕 Me gusta',        value: m('megusta'),              inline: true },
                    { name: '🐦 Tweet',           value: m('tuitear'),              inline: true },
                    { name: '🖼️ Avatar',          value: m('avatar'),               inline: true },
                    { name: '👤 Perfil',          value: m('perfil'),               inline: true },
                    { name: '🤖 Chat IA',         value: m('ia'),                   inline: true },
                    { name: '✨ Frases',          value: m('frase'),                inline: true },
                    { name: '😂 Broma',           value: m('broma'),                inline: true },
                    { name: '📊 Encuesta',        value: m('poll'),                 inline: true },
                    { name: '📸 Efectos de imagen', value: m('imagen'),             inline: true },
                    { name: '🌈 Estado de ánimo', value: m('mood'),                 inline: true },
                    { name: '🔮 Bola mágica',     value: m('8ball'),                inline: true },
                    { name: '🌸 Anime',           value: m('anime'),                inline: true },
                    { name: '🤔 Verdad o reto',   value: m('verdadoreto'),          inline: true },
                    { name: '<:kokoro:1385223047207850024> Ship', value: m('ship'), inline: true },
                    { name: '🎉 Sorteo',          value: m('sorteo'),               inline: true }
                ),

            utils: new EmbedBuilder()
                .setTitle('⚙️ Utilidades & Configuración')
                .setColor('#60A5FA')
                .setDescription('Herramientas de información, configuración del servidor y más.')
                .addFields(
                    { name: 'ℹ️ Info bot',         value: m('info'),         inline: true },
                    { name: '🤖 Stats técnicas',   value: m('infobot'),      inline: true },
                    { name: '🌐 Idioma',           value: m('language'),     inline: true },
                    { name: '🏓 Ping',             value: m('ping'),         inline: true },
                    { name: '📊 Estadísticas',     value: m('stats'),        inline: true },
                    { name: '👤 Info usuario',     value: m('userinfo'),     inline: true },
                    { name: '🏰 Info servidor',    value: m('serverinfo'),   inline: true },
                    { name: '🎭 Rol por reacción', value: m('msgrol'),       inline: true },
                    { name: '🧵 Hilo',             value: m('thread'),       inline: true },
                    { name: '🏛️ Foro',             value: m('forum'),        inline: true },
                    { name: '🧹 Limpiar mensajes', value: m('clear'),        inline: true },
                    { name: '👋 Bienvenidas',      value: `${m('welcomeset', 'activar')} ${m('welcomeset', 'desactivar')}\n${m('welcomeset', 'canal')} ${m('welcomeset', 'mensaje')}\n${m('welcomeset', 'color')} ${m('welcomeset', 'imagen')}\n${m('welcomeset', 'probar')} ${m('welcomeset', 'ver')}`, inline: false },
                    { name: '🌤️ Clima',            value: m('clima'),        inline: true },
                    { name: '📖 Buscar Wikipedia', value: m('buscar'),       inline: true },
                    { name: '💹 Precio crypto',    value: m('crypto'),       inline: true },
                    { name: '🎨 Info color',       value: m('color'),        inline: true },
                    { name: '🌐 Traductor',        value: m('traductor'),    inline: true },
                    { name: '⏰ Recordatorio',     value: m('recordatorio'), inline: true },
                    { name: '🌐 Web oficial',      value: m('web'),          inline: true }
                ),

            mod: new EmbedBuilder()
                .setTitle('🛡️ Moderación')
                .setColor('#FB923C')
                .setDescription('Herramientas de moderación para mantener el orden en el servidor.')
                .addFields(
                    { name: '🔨 Ban',             value: m('ban'),       inline: true },
                    { name: '✅ Desbanear',        value: m('unban'),     inline: true },
                    { name: '📋 Lista bans',       value: m('banlist'),   inline: true },
                    { name: '<a:tnt:1385229826008289330> Hackban', value: m('hackban'),  inline: true },
                    { name: '👢 Kick',            value: m('kick'),      inline: true },
                    { name: '🔇 Silenciar',       value: m('silenciar'), inline: true },
                    { name: '🔊 Desilenciar',     value: m('desilenciar'), inline: true },
                    { name: '⚠️ Advertir',        value: m('advertir'),  inline: true },
                    { name: '🎭 Rol',             value: m('role'),      inline: true },
                    { name: '⏳ Modo lento',      value: m('slowmode'),  inline: true },
                    { name: '🔒 Lockdown',        value: m('lockdown'),  inline: true },
                    { name: '✏️ Apodo',           value: m('nick'),      inline: true },
                    { name: '📢 Anuncio',         value: m('announce'),  inline: true },
                    { name: '📩 DM',              value: m('md'),        inline: true },
                    { name: '📨 Enviar msg',      value: m('send'),      inline: true },
                    { name: '⭐ Reacción auto',   value: m('reaction'),  inline: true },
                    { name: '🧹 Limpiar bot',     value: m('purgebot'),  inline: true },
                    { name: '🔀 Mover voz',       value: m('moveall'),   inline: true },
                    { name: '🤖 Automod',         value: m('automod'),    inline: true },
                    { name: '📋 Auditoría 💎',    value: m('auditoria'),  inline: true },
                    { name: '✅ Verificación',     value: m('verificar'),  inline: true }
                ),

            premium: new EmbedBuilder()
                .setTitle('<a:lux:1385222769566027836> VIP Premium — Comandos Exclusivos')
                .setColor('#00FFFF')
                .setDescription(`> Acceso exclusivo para suscriptores **Premium**.\n> Obtén tu suscripción en [**whop.com/soledad-858d**](https://whop.com/soledad-858d) o con ${commandIds?.get('shop') ? `</shop:${commandIds.get('shop')}>` : '`/shop`'} usando Solecoins.\n\u200B`)
                .addFields(
                    { name: '💸 Transferir',           value: m('transferir'),                  inline: true },
                    { name: '💌 Carta / Poema IA',     value: m('carta'),                       inline: true },
                    { name: '🔮 Horóscopo IA',         value: m('horoscopo'),                   inline: true },
                    { name: '📝 Bio de perfil',        value: m('bio'),                         inline: true },
                    { name: '🌟 Daily Premium',        value: m('daily-premium'),               inline: true },
                    { name: '🚀 Publicar servidor',    value: m('serverpost'),                  inline: true },
                    { name: '🔒 Bloquear canal',       value: m('premium', 'block-channel'),    inline: true },
                    { name: '👢 Patear (VIP)',         value: m('premium', 'patear'),           inline: true },
                    { name: '👻 Mensaje fantasma',     value: m('premium', 'ghost-msg'),        inline: true },
                    { name: '✨ Apodo brillante',      value: m('premium', 'nick'),             inline: true },
                    { name: '🖼️ Avatar VIP',           value: m('premium', 'exclusive-avatar'), inline: true },
                    { name: '📊 Mi suscripción',       value: m('premium', 'status'),           inline: true },
                    { name: '📝 Resumir texto',        value: m('resumir'),                     inline: true },
                    { name: '📖 Crear historia',       value: m('historia'),                    inline: true },
                    { name: '🗣️ Debate con IA',        value: m('debate'),                      inline: true },
                    { name: '🔥 Roast',                value: m('roast'),                       inline: true },
                    { name: '💡 Consejo IA',           value: m('consejo'),                     inline: true },
                    { name: '🎤 Rima / Rap',           value: m('rima'),                        inline: true },
                    { name: '🔮 Predicción futuro',    value: m('prediccion'),                  inline: true },
                    { name: '👨‍🍳 Receta IA',           value: m('receta'),                      inline: true },
                    { name: '🤫 Confesión anónima',    value: m('confesion'),                   inline: true },
                    { name: '🎂 Mensaje de cumpleaños',value: m('cumple'),                      inline: true }
                )
        };

        const selectedEmbed = embeds[category];
        if (selectedEmbed) {
            if (bannerUrl) selectedEmbed.setImage(bannerUrl);
            selectedEmbed
                .setFooter({ text: 'Soledad ❣ • Usa los botones para navegar' })
                .setTimestamp();
        }
        return selectedEmbed;
    },

    createNavButtons
};
