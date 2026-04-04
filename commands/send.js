const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');

const NQN_REGEX = /(?<!<a?):[a-zA-Z0-9_]+:(?!\d*>)/g;

function resolveEmojis(text, client) {
    if (!text) return text;
    return text.replace(NQN_REGEX, match => {
        const name  = match.slice(1, -1);
        const emoji = client.emojis.cache.find(e => e.name === name);
        if (!emoji) return match;
        return emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`;
    });
}

const webhookCache = new Map();

async function getOrCreateWebhook(channel, client) {
    const cacheKey = channel.isThread() ? channel.parentId : channel.id;
    const threadId = channel.isThread() ? channel.id : null;

    const cached = webhookCache.get(cacheKey);
    if (cached?.token) return { webhook: cached, threadId };

    const targetChannel = channel.isThread() ? channel.parent : channel;
    if (!targetChannel) return null;

    const webhooks = await targetChannel.fetchWebhooks().catch(() => null);
    if (!webhooks) return null;

    let webhook = webhooks.find(wh => wh.name === 'Soledad NQN' && wh.token);

    if (!webhook) {
        webhook = await targetChannel.createWebhook({
            name: 'Soledad NQN',
            avatar: client.user.displayAvatarURL({ extension: 'png', size: 128 })
        }).catch(() => null);
    }

    if (!webhook) return null;

    webhookCache.set(cacheKey, webhook);
    setTimeout(() => webhookCache.delete(cacheKey), 30 * 60 * 1000);

    return { webhook, threadId };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('send')
        .setNameLocalizations({ 'en-US': 'send', 'en-GB': 'send' })
        .setDescription('Envía un mensaje personalizado a un canal')
        .setDescriptionLocalizations({ 'en-US': 'Send a custom message to a channel', 'en-GB': 'Send a custom message to a channel' })
        .addStringOption(option =>
            option.setName('mensaje')
                .setNameLocalizations({ 'en-US': 'message', 'en-GB': 'message' })
                .setDescription('El mensaje a enviar')
                .setDescriptionLocalizations({ 'en-US': 'The message to send', 'en-GB': 'The message to send' })
                .setRequired(false))
        .addChannelOption(option =>
            option.setName('canal')
                .setNameLocalizations({ 'en-US': 'channel', 'en-GB': 'channel' })
                .setDescription('Canal donde enviar el mensaje (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Channel to send the message to (optional)', 'en-GB': 'Channel to send the message to (optional)' })
                .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('imagen')
                .setNameLocalizations({ 'en-US': 'image', 'en-GB': 'image' })
                .setDescription('Imagen a adjuntar (PNG, JPG, GIF, WEBP)')
                .setDescriptionLocalizations({ 'en-US': 'Image to attach (PNG, JPG, GIF, WEBP)', 'en-GB': 'Image to attach (PNG, JPG, GIF, WEBP)' })
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('embed')
                .setNameLocalizations({ 'en-US': 'embed', 'en-GB': 'embed' })
                .setDescription('Enviar como embed (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Send as embed (optional)', 'en-GB': 'Send as embed (optional)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('titulo')
                .setNameLocalizations({ 'en-US': 'title', 'en-GB': 'title' })
                .setDescription('Título del embed (solo si embed está activado)')
                .setDescriptionLocalizations({ 'en-US': 'Embed title (only if embed is enabled)', 'en-GB': 'Embed title (only if embed is enabled)' })
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setNameLocalizations({ 'en-US': 'color', 'en-GB': 'color' })
                .setDescription('Color del embed en hexadecimal (ej: #FF0000)')
                .setDescriptionLocalizations({ 'en-US': 'Embed color in hexadecimal (e.g. #FF0000)', 'en-GB': 'Embed color in hexadecimal (e.g. #FF0000)' })
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('como_bot')
                .setNameLocalizations({ 'en-US': 'as_bot', 'en-GB': 'as_bot' })
                .setDescription('Enviar el mensaje con tu avatar y nombre (como si fueras un bot)')
                .setDescriptionLocalizations({ 'en-US': 'Send the message with your avatar and name (as if you were a bot)', 'en-GB': 'Send the message with your avatar and name (as if you were a bot)' })
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const message      = interaction.options.getString('mensaje');
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const useEmbed     = interaction.options.getBoolean('embed') || false;
        const embedTitle   = interaction.options.getString('titulo');
        const embedColor   = interaction.options.getString('color');
        const attachment   = interaction.options.getAttachment('imagen');
        const comoBot      = interaction.options.getBoolean('como_bot') || false;

        // Resolver emojis estilo NQN en el texto y el título antes de enviar
        const resolvedMessage = resolveEmojis(message, interaction.client);
        const resolvedTitle   = resolveEmojis(embedTitle, interaction.client);

        if (!resolvedMessage && !attachment) {
            return await interaction.editReply({
                content: '❌ Debes escribir un mensaje o adjuntar una imagen (o ambos).'
            });
        }

        const permissions = targetChannel.permissionsFor(interaction.guild.members.me);

        if (!permissions.has('SendMessages')) {
            return await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Bot Sin Permisos')
                    .setDescription(`No tengo permisos para enviar mensajes en ${targetChannel}.`)
                    .setTimestamp()]
            });
        }

        if (useEmbed && !permissions.has('EmbedLinks')) {
            return await interaction.editReply({
                embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Sin Permisos de Embed')
                    .setDescription(`No tengo permisos para enviar embeds en ${targetChannel}.`)
                    .setTimestamp()]
            });
        }

        if (comoBot && !permissions.has('ManageWebhooks')) {
            return await interaction.editReply({
                content: '❌ Necesito el permiso **Gestionar Webhooks** en ese canal para enviar como bot.'
            });
        }

        if (attachment) {
            const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
            if (!validTypes.includes(attachment.contentType)) {
                return await interaction.editReply({
                    content: '❌ Solo se aceptan imágenes (PNG, JPG, GIF, WEBP).'
                });
            }
        }

        let colorValue = '#0099FF';
        if (embedColor && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(embedColor)) {
            colorValue = embedColor;
        }

        // Construir el payload del mensaje
        let messagePayload = {};

        if (useEmbed) {
            const embed = new EmbedBuilder()
                .setColor(colorValue)
                .setTimestamp();

            if (!comoBot) {
                embed.setFooter({
                    text: `Enviado por ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true })
                });
            }

            if (resolvedTitle)   embed.setTitle(resolvedTitle);
            if (resolvedMessage) embed.setDescription(resolvedMessage);

            if (attachment) {
                const imgName = attachment.name || 'imagen.png';
                const imgFile = new AttachmentBuilder(attachment.url, { name: imgName });
                embed.setImage(`attachment://${imgName}`);
                messagePayload = { embeds: [embed], files: [imgFile] };
            } else {
                messagePayload = { embeds: [embed] };
            }
        } else {
            if (resolvedMessage) messagePayload.content = resolvedMessage;
            if (attachment) {
                const imgFile = new AttachmentBuilder(attachment.url, { name: attachment.name || 'imagen.png' });
                messagePayload.files = [imgFile];
            }
        }

        try {
            if (comoBot) {
                const result = await getOrCreateWebhook(targetChannel, interaction.client);
                if (!result) {
                    return await interaction.editReply({
                        content: '❌ No pude crear el webhook en ese canal. Verifica que tengo el permiso **Gestionar Webhooks**.'
                    });
                }

                const { webhook, threadId } = result;

                const sendOptions = {
                    ...messagePayload,
                    username:  interaction.member?.displayName || interaction.user.username,
                    avatarURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    allowedMentions: { parse: [] },
                };
                if (threadId) sendOptions.threadId = threadId;

                await webhook.send(sendOptions);
            } else {
                await targetChannel.send(messagePayload);
            }

            const confirmEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Mensaje Enviado')
                .addFields(
                    { name: '📍 Canal',   value: targetChannel.toString(), inline: true },
                    { name: '🎨 Formato', value: useEmbed ? 'Embed' : 'Texto plano', inline: true },
                    { name: '🖼️ Imagen',  value: attachment ? '✅ Adjuntada' : '❌ Sin imagen', inline: true },
                    { name: '🤖 Modo',    value: comoBot ? 'Como bot (tu avatar)' : 'Normal', inline: true }
                )
                .setTimestamp();

            if (resolvedMessage) {
                confirmEmbed.setDescription(`> ${resolvedMessage.length > 120 ? resolvedMessage.substring(0, 120) + '...' : resolvedMessage}`);
            }

            await interaction.editReply({ embeds: [confirmEmbed] });

        } catch (error) {
            console.error('Error enviando mensaje:', error);
            try {
                await interaction.editReply({
                    embeds: [new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Error')
                        .setDescription('No pude enviar el mensaje. Verifica los permisos del bot.')
                        .setTimestamp()]
                });
            } catch (e) {}
        }
    },
};
