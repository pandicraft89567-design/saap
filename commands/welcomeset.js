const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getLanguage, t } = require('../utils/i18n');
const fs = require('fs');
const path = require('path');
const config = require('../config');

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
            .setDescription('Edita el mensaje de bienvenida (usa {user} y {server})')
            .setDescriptionLocalizations({ 'en-US': 'Edit the welcome message (use {user} and {server})', 'en-GB': 'Edit the welcome message (use {user} and {server})' })
            .addStringOption(opt => opt
                .setName('texto')
                .setNameLocalizations({ 'en-US': 'text', 'en-GB': 'text' })
                .setDescription('Nuevo mensaje de bienvenida')
                .setDescriptionLocalizations({ 'en-US': 'New welcome message', 'en-GB': 'New welcome message' })
                .setRequired(true)))

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
            .setDescriptionLocalizations({ 'en-US': 'Show the current welcome configuration', 'en-GB': 'Show the current welcome configuration' })),

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
                const newMessage = interaction.options.getString('texto');
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

                const embed = new EmbedBuilder()
                    .setColor(cfg.enabled ? (cfg.color || '#2ECC71') : '#E74C3C')
                    .setTitle('⚙️ Configuración de Bienvenidas')
                    .addFields(
                        { name: '🔔 Estado',   value: statusText, inline: true },
                        { name: '📢 Canal',    value: canal,       inline: true },
                        { name: '🎨 Color',    value: colorText,   inline: true },
                        { name: '🖼️ Imagen',  value: imageText,   inline: true },
                        { name: '💬 Mensaje',  value: msgText,     inline: false }
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
