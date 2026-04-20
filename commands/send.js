const {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    AttachmentBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require('discord.js');

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

function parseEmoji(str) {
    if (!str) return null;
    const custom = str.match(/^<(a?):(\w+):(\d+)>$/);
    if (custom) return { animated: Boolean(custom[1]), name: custom[2], id: custom[3] };
    const trimmed = str.trim();
    return trimmed ? { name: trimmed } : null;
}

function isValidUrl(url) {
    try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; }
}

function buildLinkButtons(opts) {
    const buttons = [];
    for (let n = 1; n <= 3; n++) {
        const label = opts.getString(`btn${n}_texto`);
        const url   = opts.getString(`btn${n}_url`);
        if (!label || !url) continue;
        if (!isValidUrl(url)) continue;

        const btn = new ButtonBuilder()
            .setLabel(label.slice(0, 80))
            .setURL(url)
            .setStyle(ButtonStyle.Link);

        const emoji = parseEmoji(opts.getString(`btn${n}_emoji`));
        try { if (emoji) btn.setEmoji(emoji); } catch {}

        buttons.push(btn);
    }
    return buttons;
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
            avatar: client.user.displayAvatarURL({ extension: 'png', size: 128 }),
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
        .setDescription('Enviar o editar mensajes con botones de link opcionales')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)

        // ── Opciones de contenido ──────────────────────────────────────────
        .addStringOption(o  => o.setName('mensaje').setDescription('Texto del mensaje').setRequired(false))
        .addStringOption(o  => o.setName('editar').setDescription('ID del mensaje a editar').setRequired(false))
        .addChannelOption(o => o.setName('canal').setDescription('Canal destino').setRequired(false))
        .addAttachmentOption(o => o.setName('imagen').setDescription('Imagen adjunta').setRequired(false))
        .addBooleanOption(o => o.setName('embed').setDescription('Enviar como embed').setRequired(false))
        .addStringOption(o  => o.setName('titulo').setDescription('Título del embed').setRequired(false))
        .addStringOption(o  => o.setName('color').setDescription('Color HEX del embed (ej: #FF5733)').setRequired(false))
        .addBooleanOption(o => o.setName('como_bot').setDescription('Enviar como bot (webhook)').setRequired(false))

        // ── Botón 1 ────────────────────────────────────────────────────────
        .addStringOption(o => o.setName('btn1_texto').setDescription('Botón 1 — Nombre del botón').setRequired(false).setMaxLength(80))
        .addStringOption(o => o.setName('btn1_url').setDescription('Botón 1 — URL del enlace').setRequired(false))
        .addStringOption(o => o.setName('btn1_emoji').setDescription('Botón 1 — Emoji (ej: 🎮 o <:nombre:id>)').setRequired(false))

        // ── Botón 2 ────────────────────────────────────────────────────────
        .addStringOption(o => o.setName('btn2_texto').setDescription('Botón 2 — Nombre del botón').setRequired(false).setMaxLength(80))
        .addStringOption(o => o.setName('btn2_url').setDescription('Botón 2 — URL del enlace').setRequired(false))
        .addStringOption(o => o.setName('btn2_emoji').setDescription('Botón 2 — Emoji (ej: 🌐 o <:nombre:id>)').setRequired(false))

        // ── Botón 3 ────────────────────────────────────────────────────────
        .addStringOption(o => o.setName('btn3_texto').setDescription('Botón 3 — Nombre del botón').setRequired(false).setMaxLength(80))
        .addStringOption(o => o.setName('btn3_url').setDescription('Botón 3 — URL del enlace').setRequired(false))
        .addStringOption(o => o.setName('btn3_emoji').setDescription('Botón 3 — Emoji (ej: ❤️ o <:nombre:id>)').setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const opts          = interaction.options;
        const message       = opts.getString('mensaje');
        const editId        = opts.getString('editar');
        const targetChannel = opts.getChannel('canal') || interaction.channel;
        const useEmbed      = opts.getBoolean('embed')    || false;
        const embedTitle    = opts.getString('titulo');
        const embedColor    = opts.getString('color');
        const attachment    = opts.getAttachment('imagen');
        const comoBot       = opts.getBoolean('como_bot') || false;

        const resolvedMessage = resolveEmojis(message,    interaction.client);
        const resolvedTitle   = resolveEmojis(embedTitle, interaction.client);

        let colorValue = '#0099FF';
        if (embedColor && /^#?([0-9A-Fa-f]{6})$/.test(embedColor.replace('#', ''))) {
            colorValue = embedColor.startsWith('#') ? embedColor : `#${embedColor}`;
        }

        const linkButtons = buildLinkButtons(opts);
        const linkRow     = linkButtons.length > 0
            ? new ActionRowBuilder().addComponents(linkButtons)
            : null;

        // ── EDITAR ──────────────────────────────────────────────────────────
        if (editId) {
            try {
                const msg = await targetChannel.messages.fetch(editId);
                if (msg.author.id !== interaction.client.user.id) {
                    return interaction.editReply({ content: '❌ Solo puedo editar mensajes enviados por mí.' });
                }

                let newContent = {};

                if (useEmbed) {
                    const embed = new EmbedBuilder().setColor(colorValue).setTimestamp();
                    if (resolvedTitle)   embed.setTitle(resolvedTitle);
                    if (resolvedMessage) embed.setDescription(resolvedMessage);
                    newContent = { embeds: [embed] };
                } else {
                    newContent = { content: resolvedMessage || '' };
                }

                if (linkRow) newContent.components = [linkRow];

                await msg.edit(newContent);
                return interaction.editReply({ content: '✅ Mensaje editado correctamente.' });

            } catch {
                return interaction.editReply({ content: '❌ No pude editar ese mensaje. Verifica el ID y el canal.' });
            }
        }

        // ── ENVIAR ──────────────────────────────────────────────────────────
        if (!resolvedMessage && !attachment) {
            return interaction.editReply({ content: '❌ Debes escribir algo o adjuntar una imagen.' });
        }

        const perms = targetChannel.permissionsFor(interaction.guild.members.me);
        if (!perms.has('SendMessages'))  return interaction.editReply({ content: '❌ Sin permisos para enviar mensajes en ese canal.' });
        if (useEmbed && !perms.has('EmbedLinks'))     return interaction.editReply({ content: '❌ Sin permisos para embeds en ese canal.' });
        if (comoBot  && !perms.has('ManageWebhooks')) return interaction.editReply({ content: '❌ Necesito permisos de webhooks en ese canal.' });

        let payload = {};

        if (useEmbed) {
            const embed = new EmbedBuilder().setColor(colorValue).setTimestamp();
            if (!comoBot) embed.setFooter({ text: `Enviado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() });
            if (resolvedTitle)   embed.setTitle(resolvedTitle);
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
            if (attachment) payload.files = [new AttachmentBuilder(attachment.url, { name: attachment.name })];
        }

        if (linkRow) payload.components = [linkRow];

        try {
            let sentMessage;

            if (comoBot) {
                const result = await getOrCreateWebhook(targetChannel, interaction.client);
                if (!result) return interaction.editReply({ content: '❌ No pude crear el webhook.' });
                const { webhook, threadId } = result;
                sentMessage = await webhook.send({
                    ...payload,
                    username:  interaction.user.username,
                    avatarURL: interaction.user.displayAvatarURL(),
                    threadId,
                });
            } else {
                sentMessage = await targetChannel.send(payload);
            }

            // ── Confirmación con botón eliminar ────────────────────────────
            const deleteRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`delete_${targetChannel.id}_${sentMessage.id}`)
                    .setLabel('🗑️ Eliminar mensaje')
                    .setStyle(ButtonStyle.Danger)
            );

            const confirmEmbed = new EmbedBuilder()
                .setColor('#51cf66')
                .setTitle('✅ Mensaje enviado')
                .addFields(
                    { name: '📍 Canal', value: `<#${targetChannel.id}>`, inline: true },
                    { name: '🔗 Botones', value: linkButtons.length > 0 ? `${linkButtons.length} botón(es) añadido(s)` : 'Ninguno', inline: true },
                )
                .setTimestamp();

            await interaction.editReply({ embeds: [confirmEmbed], components: [deleteRow] });

        } catch (err) {
            console.error(err);
            await interaction.editReply({ content: '❌ Error al enviar el mensaje.' });
        }
    },
};
