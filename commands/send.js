const { 
    SlashCommandBuilder, 
    EmbedBuilder, 
    PermissionFlagsBits, 
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const NQN_REGEX = /(?<!<a?):[a-zA-Z0-9_]+:(?!\d*>)/g;

function resolveEmojis(text, client) {
    if (!text) return text;
    return text.replace(NQN_REGEX, match => {
        const name  = match.slice(1, -1);
        const emoji = client.emojis.cache.find(e => e.name === name);
        if (!emoji) return match;
        return emoji.animated 
            ? `<a:${emoji.name}:${emoji.id}>` 
            : `<:${emoji.name}:${emoji.id}>`;
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
        .setDescription('Envía un mensaje personalizado')
        .addStringOption(o => o.setName('mensaje').setDescription('Mensaje').setRequired(false))
        .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(false))
        .addAttachmentOption(o => o.setName('imagen').setDescription('Imagen').setRequired(false))
        .addBooleanOption(o => o.setName('embed').setDescription('Enviar como embed').setRequired(false))
        .addStringOption(o => o.setName('titulo').setDescription('Título del embed').setRequired(false))
        .addStringOption(o => o.setName('color').setDescription('Color HEX').setRequired(false))
        .addBooleanOption(o => o.setName('como_bot').setDescription('Enviar como bot').setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const message = interaction.options.getString('mensaje');
        const targetChannel = interaction.options.getChannel('canal') || interaction.channel;
        const useEmbed = interaction.options.getBoolean('embed') || false;
        const embedTitle = interaction.options.getString('titulo');
        const embedColor = interaction.options.getString('color');
        const attachment = interaction.options.getAttachment('imagen');
        const comoBot = interaction.options.getBoolean('como_bot') || false;

        const resolvedMessage = resolveEmojis(message, interaction.client);
        const resolvedTitle = resolveEmojis(embedTitle, interaction.client);

        if (!resolvedMessage && !attachment) {
            return interaction.editReply({ content: '❌ Debes enviar algo.' });
        }

        const permissions = targetChannel.permissionsFor(interaction.guild.members.me);

        if (!permissions.has('SendMessages')) {
            return interaction.editReply({ content: '❌ Sin permisos para enviar mensajes.' });
        }

        if (useEmbed && !permissions.has('EmbedLinks')) {
            return interaction.editReply({ content: '❌ Sin permisos para embeds.' });
        }

        if (comoBot && !permissions.has('ManageWebhooks')) {
            return interaction.editReply({ content: '❌ Necesito permisos de webhooks.' });
        }

        let colorValue = '#0099FF';
        if (embedColor && /^#([0-9A-Fa-f]{6})$/.test(embedColor)) {
            colorValue = embedColor;
        }

        let payload = {};

        if (useEmbed) {
            const embed = new EmbedBuilder()
                .setColor(colorValue)
                .setTimestamp();

            if (resolvedTitle) embed.setTitle(resolvedTitle);
            if (resolvedMessage) embed.setDescription(resolvedMessage);

            if (attachment) {
                const file = new AttachmentBuilder(attachment.url, { name: attachment.name });
                embed.setImage(`attachment://${attachment.name}`);
                payload = { embeds: [embed], files: [file] };
            } else {
                payload = { embeds: [embed] };
            }
        } else {
            payload.content = resolvedMessage;
            if (attachment) {
                payload.files = [new AttachmentBuilder(attachment.url, { name: attachment.name })];
            }
        }

        try {
            let sentMessage;

            if (comoBot) {
                const result = await getOrCreateWebhook(targetChannel, interaction.client);
                if (!result) return interaction.editReply({ content: '❌ Error webhook.' });

                const { webhook, threadId } = result;

                sentMessage = await webhook.send({
                    ...payload,
                    username: interaction.user.username,
                    avatarURL: interaction.user.displayAvatarURL(),
                    threadId
                });

            } else {
                sentMessage = await targetChannel.send(payload);
            }

            // ===== BOTONES =====
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_${sentMessage.id}_${comoBot ? 'wb' : 'normal'}`)
                    .setLabel('🗑️ Eliminar')
                    .setStyle(ButtonStyle.Danger),

                new ButtonBuilder()
                    .setCustomId(`edit_${sentMessage.id}_${comoBot ? 'wb' : 'normal'}`)
                    .setLabel('✏️ Editar')
                    .setStyle(ButtonStyle.Primary)
            );

            const confirmEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Mensaje enviado')
                .setDescription(resolvedMessage ? `> ${resolvedMessage.slice(0, 100)}` : 'Sin texto')
                .setTimestamp();

            await interaction.editReply({
                embeds: [confirmEmbed],
                components: [row]
            });

        } catch (err) {
            console.error(err);
            await interaction.editReply({
                content: '❌ Error enviando mensaje.'
            });
        }
    }
};
