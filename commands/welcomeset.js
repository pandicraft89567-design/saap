const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const { Client: PgClient } = require('pg');
const fs   = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('../config');

const BG_DIR = path.join(__dirname, '..', 'data', 'welcome-backgrounds');
if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });

const OWNER_IDS = ['766405066860527688', '738425516155076629'];

async function checkPremium(userId) {
    const db = new PgClient({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
        const res = await db.query('SELECT premium_until FROM economy WHERE user_id = $1', [userId]);
        const premiumUntil = res.rows[0]?.premium_until ? new Date(res.rows[0].premium_until) : null;
        return OWNER_IDS.includes(userId) || (premiumUntil && premiumUntil > new Date());
    } finally {
        await db.end();
    }
}

const welcomeConfigPath = path.join(__dirname, '..', 'data', 'welcome-config.json');

const RANDOM_COLORS = [
    '#FF6B6B', '#FF8E53', '#FFC300', '#2ECC71', '#1ABC9C',
    '#3498DB', '#9B59B6', '#E91E63', '#00BCD4', '#FF5722',
    '#8BC34A', '#F06292', '#26C6DA', '#AB47BC', '#FF7043',
    '#66BB6A', '#42A5F5', '#EC407A', '#26A69A', '#FFA726'
];

function randomColor() {
    return RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)];
}

function isValidHex(color) {
    return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

function loadConfig() {
    if (fs.existsSync(welcomeConfigPath)) {
        try { return JSON.parse(fs.readFileSync(welcomeConfigPath, 'utf8')); } catch (e) {}
    }
    return {};
}

function saveConfig(data) {
    if (!fs.existsSync(path.dirname(welcomeConfigPath))) {
        fs.mkdirSync(path.dirname(welcomeConfigPath), { recursive: true });
    }
    fs.writeFileSync(welcomeConfigPath, JSON.stringify(data, null, 2));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomeset')
        .setNameLocalizations({ 'en-US': 'welcomeset', 'en-GB': 'welcomeset' })
        .setDescription('Configura el sistema de bienvenidas')
        .setDescriptionLocalizations({ 'en-US': 'Configure the welcome system', 'en-GB': 'Configure the welcome system' })
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)

        .addSubcommand(sub => sub
            .setName('activar')
            .setNameLocalizations({ 'en-US': 'enable', 'en-GB': 'enable' })
            .setDescription('Activa el sistema de bienvenidas')
            .setDescriptionLocalizations({ 'en-US': 'Enable the welcome system', 'en-GB': 'Enable the welcome system' }))

        .addSubcommand(sub => sub
            .setName('desactivar')
            .setNameLocalizations({ 'en-US': 'disable', 'en-GB': 'disable' })
            .setDescription('Desactiva el sistema de bienvenidas')
            .setDescriptionLocalizations({ 'en-US': 'Disable the welcome system', 'en-GB': 'Disable the welcome system' }))

        .addSubcommand(sub => sub
            .setName('canal')
            .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
            .setDescription('Elige el canal donde se enviarán las bienvenidas')
            .setDescriptionLocalizations({ 'en-US': 'Choose the channel where welcomes will be sent', 'en-GB': 'Choose the channel where welcomes will be sent' })
            .addChannelOption(opt => opt
                .setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal de texto para las bienvenidas')
                .setDescriptionLocalizations({ 'en-US': 'Text channel for welcomes', 'en-GB': 'Text channel for welcomes' })
                .setRequired(true)))

        .addSubcommand(sub => sub
            .setName('mensaje')
            .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
            .setDescription('Edita o activa/desactiva el mensaje normal de bienvenida')
            .setDescriptionLocalizations({ 'en-US': 'Edit or enable/disable the normal welcome message', 'en-GB': 'Edit or enable/disable the normal welcome message' })
            .addStringOption(opt => opt
                .setName('accion')
                .setDescription('Activar o desactivar el mensaje normal')
                .addChoices(
                    { name: 'activar',    value: 'activar' },
                    { name: 'desactivar', value: 'desactivar' }
                )
                .setRequired(false))
            .addStringOption(opt => opt
                .setName('texto')
                .setNameLocalizations({ 'en-US': 'text', 'en-GB': 'text' })
                .setDescription('Nuevo mensaje de bienvenida (usa {user} y {server})')
                .setDescriptionLocalizations({ 'en-US': 'New welcome message (use {user} and {server})', 'en-GB': 'New welcome message (use {user} and {server})' })
                .setRequired(false)))

        .addSubcommand(sub => sub
            .setName('color')
            .setNameLocalizations({ 'en-US': 'color', 'en-GB': 'color' })
            .setDescription('Cambia el color del embed de bienvenida')
            .setDescriptionLocalizations({ 'en-US': 'Change the welcome embed color', 'en-GB': 'Change the welcome embed color' })
            .addStringOption(opt => opt
                .setName('color')
                .setNameLocalizations({ 'en-US': 'color', 'en-GB': 'color' })
                .setDescription('Código hex (#FF5733) o "random" para aleatorio')
                .setDescriptionLocalizations({ 'en-US': 'Hex code (#FF5733) or "random" for random color', 'en-GB': 'Hex code (#FF5733) or "random" for random color' })
                .setRequired(true)))

        .addSubcommand(sub => sub
            .setName('imagen')
            .setNameLocalizations({ 'en-US': 'image', 'en-GB': 'image' })
            .setDescription('Sube una imagen para el banner de bienvenida')
            .setDescriptionLocalizations({ 'en-US': 'Upload an image for the welcome banner', 'en-GB': 'Upload an image for the welcome banner' })
            .addAttachmentOption(opt => opt
                .setName('imagen')
                .setNameLocalizations({ 'en-US': 'image', 'en-GB': 'image' })
                .setDescription('Imagen PNG, JPG, GIF o WEBP')
                .setDescriptionLocalizations({ 'en-US': 'PNG, JPG, GIF or WEBP image', 'en-GB': 'PNG, JPG, GIF or WEBP image' })
                .setRequired(true)))

        .addSubcommand(sub => sub
            .setName('reset-imagen')
            .setNameLocalizations({ 'en-US': 'reset-image', 'en-GB': 'reset-image' })
            .setDescription('Quita la imagen personalizada de bienvenida')
            .setDescriptionLocalizations({ 'en-US': 'Remove the custom welcome image', 'en-GB': 'Remove the custom welcome image' }))

        .addSubcommand(sub => sub
            .setName('probar')
            .setNameLocalizations({ 'en-US': 'test', 'en-GB': 'test' })
            .setDescription('Envía una prueba de la bienvenida con la configuración actual')
            .setDescriptionLocalizations({ 'en-US': 'Send a test welcome with the current configuration', 'en-GB': 'Send a test welcome with the current configuration' }))

        .addSubcommand(sub => sub
            .setName('ver')
            .setNameLocalizations({ 'en-US': 'view', 'en-GB': 'view' })
            .setDescription('Muestra la configuración actual de bienvenidas')
            .setDescriptionLocalizations({ 'en-US': 'Show the current welcome configuration', 'en-GB': 'Show the current welcome configuration' }))

        .addSubcommand(sub => sub
            .setName('premium')
            .setNameLocalizations({ 'en-US': 'premium', 'en-GB': 'premium' })
            .setDescription('✨ Configura la imagen de bienvenida premium con fondo personalizado')
            .setDescriptionLocalizations({ 'en-US': '✨ Set up premium welcome image with custom background', 'en-GB': '✨ Set up premium welcome image with custom background' })
            .addStringOption(opt => opt
                .setName('color_welcome')
                .setDescription('Color del texto de bienvenida en hex (ej: #ff5733)')
                .setRequired(true))
            .addAttachmentOption(opt => opt
                .setName('imagen_fondo')
                .setDescription('Imagen de fondo (PNG, JPG, WEBP) — se guarda en el bot')
                .setRequired(true))
            .addStringOption(opt => opt
                .setName('color_descripcion')
                .setDescription('Color del texto de descripcion en hex (ej: #cccccc)')
                .setRequired(true))
            .addStringOption(opt => opt
                .setName('mensaje_descripcion')
                .setDescription('Mensaje que aparece en la imagen (usa {user} y {server})')
                .setRequired(true))
            .addIntegerOption(opt => opt
                .setName('minutos_visible')
                .setDescription('Minutos que la imagen premium se mantiene antes de volver al mensaje normal (1-1440)')
                .setMinValue(1)
                .setMaxValue(1440)
                .setRequired(false))),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const sub  = interaction.options.getSubcommand();
            const lang = await getLanguage(interaction.guildId);
            const welcomeConfig = loadConfig();

            if (!welcomeConfig[interaction.guildId]) {
                welcomeConfig[interaction.guildId] = {
                    enabled: false, channelId: null,
                    message: '¡Bienvenido {user} a {server}! 🎉'
                };
            }

            const cfg = welcomeConfig[interaction.guildId];

            // ── ACTIVAR ────────────────────────────────────────────────────
            if (sub === 'activar') {
                cfg.enabled = true;
                saveConfig(welcomeConfig);
                const canalText = cfg.channelId
                    ? `<#${cfg.channelId}>`
                    : '⚠️ No hay canal configurado. Usa `/welcomeset canal` para elegir uno.';
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#2ECC71')
                        .setTitle('✅ Bienvenidas Activadas')
                        .setDescription(`El sistema de bienvenidas está ahora **activo**.\n\n📢 Canal: ${canalText}`)
                        .setFooter({ text: 'Usa /welcomeset probar para ver cómo queda' })
                        .setTimestamp()]
                });
            }

            // ── DESACTIVAR ─────────────────────────────────────────────────
            if (sub === 'desactivar') {
                cfg.enabled = false;
                saveConfig(welcomeConfig);
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#E74C3C')
                        .setTitle('🔕 Bienvenidas Desactivadas')
                        .setDescription('El sistema de bienvenidas está ahora **desactivado**.')
                        .setFooter({ text: 'Usa /welcomeset activar para reactivarlo' })
                        .setTimestamp()]
                });
            }

            // ── CANAL ──────────────────────────────────────────────────────
            if (sub === 'canal') {
                const channel = interaction.options.getChannel('canal');
                if (!channel || channel.type !== 0) {
                    return await interaction.editReply({ content: '❌ Por favor selecciona un canal de texto válido.' });
                }
                cfg.channelId = channel.id;
                cfg.enabled   = true;
                saveConfig(welcomeConfig);
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(cfg.color || '#00ff00')
                        .setTitle('✅ Canal de Bienvenidas Configurado')
                        .setDescription(`Las bienvenidas se enviarán en ${channel}.`)
                        .setFooter({ text: 'Usa /welcomeset probar para ver cómo queda' })
                        .setTimestamp()]
                });
            }

            // ── MENSAJE ────────────────────────────────────────────────────
            if (sub === 'mensaje') {
                const accion     = interaction.options.getString('accion');
                const newMessage = interaction.options.getString('texto');

                // Activar / desactivar el mensaje normal
                if (accion === 'desactivar') {
                    cfg.messageDisabled = true;
                    saveConfig(welcomeConfig);
                    return await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#E74C3C')
                            .setTitle('🔕 Mensaje Normal Desactivado')
                            .setDescription('El embed de bienvenida normal ya **no se enviará**.\nSolo se enviará la imagen premium si la tienes configurada.')
                            .setFooter({ text: 'Usa /welcomeset mensaje accion:activar para reactivarlo' })
                            .setTimestamp()]
                    });
                }

                if (accion === 'activar') {
                    cfg.messageDisabled = false;
                    saveConfig(welcomeConfig);
                    return await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#2ECC71')
                            .setTitle('✅ Mensaje Normal Activado')
                            .setDescription('El embed de bienvenida normal vuelve a **enviarse**.')
                            .setTimestamp()]
                    });
                }

                // Editar el texto del mensaje
                if (!newMessage) {
                    return await interaction.editReply({
                        content: '❌ Debes indicar una `accion` (activar/desactivar) **o** un `texto` nuevo para el mensaje.'
                    });
                }

                cfg.message = newMessage;
                saveConfig(welcomeConfig);

                const preview = newMessage
                    .replace(/{user}/g, interaction.user.toString())
                    .replace(/{server}/g, interaction.guild.name);

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(config.colors?.success || '#00ff00')
                        .setTitle('✅ Mensaje de Bienvenida Actualizado')
                        .setDescription(`Vista previa:\n\n${preview}`)
                        .addFields({ name: '📝 Texto guardado', value: `\`\`\`${newMessage}\`\`\`` })
                        .setFooter({ text: 'Variables: {user} = mención • {server} = nombre del servidor' })
                        .setTimestamp()]
                });
            }

            // ── COLOR ──────────────────────────────────────────────────────
            if (sub === 'color') {
                const input = interaction.options.getString('color').trim();
                let finalColor, colorLabel;

                if (input.toLowerCase() === 'random') {
                    finalColor  = randomColor();
                    colorLabel  = `🎲 Aleatorio → \`${finalColor}\``;
                    cfg.colorMode = 'random';
                    delete cfg.color;
                } else if (isValidHex(input)) {
                    finalColor    = input.toUpperCase();
                    colorLabel    = `🎨 Color personalizado: \`${finalColor}\``;
                    cfg.colorMode = 'fixed';
                    cfg.color     = finalColor;
                } else {
                    return await interaction.editReply({
                        content: '❌ Color inválido. Escribe un código hex como `#FF5733` o escribe `random`.'
                    });
                }

                saveConfig(welcomeConfig);
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(finalColor)
                        .setTitle('🎨 Color Actualizado')
                        .setDescription(colorLabel)
                        .setFooter({ text: 'Usa /welcomeset probar para ver cómo queda' })
                        .setTimestamp()]
                });
            }

            // ── IMAGEN ─────────────────────────────────────────────────────
            if (sub === 'imagen') {
                const attachment = interaction.options.getAttachment('imagen');
                const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
                if (!validTypes.includes(attachment.contentType)) {
                    return await interaction.editReply({ content: '❌ Solo se aceptan imágenes (PNG, JPG, GIF, WEBP).' });
                }
                cfg.imageUrl = attachment.url;
                saveConfig(welcomeConfig);
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(cfg.color || '#00ff00')
                        .setTitle('🖼️ Imagen Configurada')
                        .setDescription('La imagen se mostrará en el embed de bienvenida.')
                        .setImage(attachment.url)
                        .setFooter({ text: 'Usa /welcomeset probar para ver cómo queda' })
                        .setTimestamp()]
                });
            }

            // ── RESET-IMAGEN ───────────────────────────────────────────────
            if (sub === 'reset-imagen') {
                delete cfg.imageUrl;
                saveConfig(welcomeConfig);
                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#99AAB5')
                        .setTitle('🗑️ Imagen Eliminada')
                        .setDescription('El embed de bienvenida ya no tendrá imagen personalizada.')
                        .setTimestamp()]
                });
            }

            // ── PROBAR ─────────────────────────────────────────────────────
            if (sub === 'probar') {
                const channelId     = cfg?.channelId;
                const targetChannel = channelId
                    ? interaction.guild.channels.cache.get(channelId)
                    : interaction.channel;

                if (!targetChannel) {
                    return await interaction.editReply({ content: '❌ No se encontró el canal configurado.' });
                }

                let welcomeMessage = cfg?.message || t('MEMBER_JOIN', lang, { user: interaction.user.toString() });
                welcomeMessage = welcomeMessage
                    .replace(/{user}/g, interaction.user.toString())
                    .replace(/{server}/g, interaction.guild.name);

                const embedColor = cfg?.colorMode === 'random'
                    ? randomColor()
                    : (cfg?.color || '#00ff00');

                const embed = new EmbedBuilder()
                    .setTitle(`<a:welcome:1385228410401325087> ¡Bienvenido a ${interaction.guild.name}!`)
                    .setDescription(welcomeMessage)
                    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setColor(embedColor)
                    .addFields(
                        { name: '👤 ' + t('NEW_MEMBER', lang), value: `${interaction.user.tag}`, inline: true },
                        { name: t('JOINED_AT', lang), value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true },
                        { name: '🔢 Miembro', value: `#${interaction.guild.memberCount}`, inline: true }
                    )
                    .setFooter({
                        text: interaction.guild.name,
                        iconURL: interaction.guild.iconURL() || interaction.client.user.displayAvatarURL()
                    })
                    .setTimestamp();

                if (cfg?.imageUrl) embed.setImage(cfg.imageUrl);

                await targetChannel.send({
                    content: `<a:holi:1385228499438145568> ¡Hola ${interaction.user}!`,
                    embeds: [embed]
                });

                const msg = targetChannel.id !== interaction.channel.id
                    ? `✅ Prueba enviada en ${targetChannel}.`
                    : '✅ Prueba enviada con tu configuración actual.';

                return await interaction.editReply({ content: msg });
            }

            // ── PREMIUM ────────────────────────────────────────────────────
            if (sub === 'premium') {
                const isPremium = await checkPremium(interaction.user.id);
                if (!isPremium) {
                    return await interaction.editReply({
                        embeds: [new EmbedBuilder()
                            .setColor('#FFD700')
                            .setTitle('✨ Función Premium')
                            .setDescription('Esta función es exclusiva para usuarios **Premium**.\nConsigue Premium con `/premium status` para más info.')
                            .setFooter({ text: 'Soledad Premium' })
                            .setTimestamp()]
                    });
                }

                const colorWelcome  = interaction.options.getString('color_welcome').trim();
                const adjunto       = interaction.options.getAttachment('imagen_fondo');
                const colorDesc     = interaction.options.getString('color_descripcion').trim();
                const msgDesc       = interaction.options.getString('mensaje_descripcion').trim();

                if (!isValidHex(colorWelcome)) {
                    return await interaction.editReply({ content: '❌ `color_welcome` inválido. Usa formato hex como `#FF5733`.' });
                }
                if (!isValidHex(colorDesc)) {
                    return await interaction.editReply({ content: '❌ `color_descripcion` inválido. Usa formato hex como `#cccccc`.' });
                }

                // Descargar y guardar la imagen localmente
                const ext      = (adjunto.name.split('.').pop() || 'png').toLowerCase();
                const bgPath   = path.join(BG_DIR, `${interaction.guildId}.${ext}`);
                try {
                    const res = await axios.get(adjunto.url, {
                        responseType: 'arraybuffer',
                        timeout: 15000,
                        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SoledadBot/1.0)' },
                    });
                    fs.writeFileSync(bgPath, Buffer.from(res.data));
                } catch (dlErr) {
                    console.error('Error descargando imagen premium:', dlErr);
                    return await interaction.editReply({ content: '❌ No pude descargar la imagen adjunta. Intenta de nuevo.' });
                }

                const minutosVisible = interaction.options.getInteger('minutos_visible');

                cfg.premium = {
                    enabled:       true,
                    welcomeColor:  colorWelcome.toUpperCase(),
                    bgPath,
                    descColor:     colorDesc.toUpperCase(),
                    descMessage:   msgDesc,
                    previewMinutes: minutosVisible || null,
                };
                saveConfig(welcomeConfig);

                // Vista previa
                const { generateWelcomeImage } = require('../utils/welcomeImage');
                const avatarUrl  = interaction.user.displayAvatarURL({ extension: 'png', size: 128, forceStatic: true });
                const previewMsg = msgDesc
                    .replace(/{user}/g, interaction.user.username)
                    .replace(/{server}/g, interaction.guild.name);

                let previewBuffer;
                try {
                    previewBuffer = await generateWelcomeImage({
                        username:     interaction.user.displayName || interaction.user.username,
                        avatarUrl,
                        memberCount:  interaction.guild.memberCount,
                        welcomeColor: colorWelcome,
                        descColor:    colorDesc,
                        descMessage:  previewMsg,
                        bgPath,
                    });
                } catch (imgErr) {
                    console.error('Error generando preview premium:', imgErr);
                    return await interaction.editReply({ content: '❌ No pude generar la vista previa. Revisa que la imagen sea válida.' });
                }

                const attachment = new AttachmentBuilder(previewBuffer, { name: 'preview-welcome.png' });

                return await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor(colorWelcome)
                        .setTitle('✨ Bienvenida Premium Configurada')
                        .setDescription('Así se verá la imagen al entrar un nuevo miembro:')
                        .addFields(
                            { name: '🎨 Color welcome',     value: `\`${colorWelcome}\``, inline: true },
                            { name: '🎨 Color descripción', value: `\`${colorDesc}\``,    inline: true },
                            { name: '⏱️ Visible',           value: minutosVisible ? `${minutosVisible} min, luego mensaje normal` : 'Permanente', inline: true },
                            { name: '💬 Mensaje',           value: `\`${msgDesc}\``,      inline: false }
                        )
                        .setImage('attachment://preview-welcome.png')
                        .setFooter({ text: 'Usa /welcomeset probar para ver la bienvenida completa' })
                        .setTimestamp()],
                    files: [attachment]
                });
            }

            // ── VER ────────────────────────────────────────────────────────
            if (sub === 'ver') {
                const statusText = cfg.enabled ? '🟢 Activado' : '🔴 Desactivado';
                const canal      = cfg.channelId ? `<#${cfg.channelId}>` : '❌ No configurado';
                const colorText  = cfg.colorMode === 'random'
                    ? '🎲 Aleatorio'
                    : (cfg.color ? `🎨 \`${cfg.color}\`` : '⬜ Por defecto');
                const imageText  = cfg.imageUrl ? `[Ver imagen](${cfg.imageUrl})` : '❌ Sin imagen';
                const msgText    = cfg.message
                    ? `\`\`\`${cfg.message}\`\`\``
                    : '`¡Bienvenido {user} a {server}! 🎉`';

                const premiumText = cfg.premium?.enabled
                    ? `✅ Activo${cfg.premium.previewMinutes ? ` (visible ${cfg.premium.previewMinutes} min, luego mensaje normal)` : ' (permanente)'}`
                    : '❌ No configurado';

                const embed = new EmbedBuilder()
                    .setColor(cfg.enabled ? (cfg.color || '#2ECC71') : '#E74C3C')
                    .setTitle('⚙️ Configuración de Bienvenidas')
                    .addFields(
                        { name: '🔔 Estado',   value: statusText,  inline: true },
                        { name: '📢 Canal',    value: canal,        inline: true },
                        { name: '🎨 Color',    value: colorText,    inline: true },
                        { name: '🖼️ Imagen',  value: imageText,    inline: true },
                        { name: '✨ Premium',  value: premiumText,  inline: true },
                        { name: '💬 Mensaje',  value: msgText,      inline: false }
                    )
                    .setFooter({ text: 'Usa /welcomeset probar para previsualizar' })
                    .setTimestamp();

                if (cfg.imageUrl) embed.setThumbnail(cfg.imageUrl);
                return await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error en welcomeset:', error);
            if (!interaction.replied) {
                await interaction.editReply({ content: '❌ Hubo un error al guardar la configuración.' });
            }
        }
    },
};
