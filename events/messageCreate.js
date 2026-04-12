const { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLanguage } = require('../utils/i18n');
const {
    detectBadWord, isAutomodEnabled, generateWarnMessage,
    addInfraction, getAutomodRules, applyAutomodAction, getLogChannel,
} = require('../utils/automod');
const { generateQuoteImage, STYLES } = require('../utils/quote');
const { getChannelConfig, translateMessage, detectLanguage, LANG_NAMES } = require('../utils/traduccionAuto');

// Cache de webhooks por canal para no crear uno nuevo cada vez
const webhookCache = new Map();

// Regex: detecta :nombre_emoji: pero NO los ya formateados <:nombre:id> o <a:nombre:id>
const NQN_REGEX = /(?<!<a?):[a-zA-Z0-9_]+:(?!\d*>)/g;

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
    name: 'messageCreate',
    once: false,
    async execute(message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        // ── AUTO-MODERACIÓN ──────────────────────────────────────────────
        const [detected, automodOn] = await Promise.all([
            Promise.resolve(detectBadWord(message.content)),
            isAutomodEnabled(message.guildId)
        ]);
        if (detected && automodOn) {
            try {
                if (message.deletable) await message.delete().catch(() => {});

                // Registrar infracción y obtener total acumulado
                const newCount = await addInfraction(message.guildId, message.author.id);

                // Buscar regla exacta para ese número de infracciones
                const rules    = await getAutomodRules(message.guildId);
                const rule     = rules.find(r => Number(r.infractions) === newCount);
                let actionText = null;
                if (rule && message.member) {
                    actionText = await applyAutomodAction(message.member, rule);
                }

                // Advertencia en el canal
                const warnText = await generateWarnMessage(message.author.username);
                const warnEmbed = new EmbedBuilder()
                    .setColor('#ff4757')
                    .setTitle('🚫 Mensaje eliminado')
                    .setDescription(`<@${message.author.id}> — ${warnText}`)
                    .addFields(
                        { name: '⚠️ Infracciones', value: `${newCount}`, inline: true },
                        { name: '🎯 Acción',        value: actionText ?? 'Solo advertencia', inline: true }
                    )
                    .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                    .setTimestamp();

                const warnMsg = await message.channel.send({ embeds: [warnEmbed] });
                setTimeout(() => warnMsg.delete().catch(() => {}), 8000);

                // Log en el canal configurado
                const logChannelId = await getLogChannel(message.guildId);
                if (logChannelId) {
                    const logCh = message.guild.channels.cache.get(logChannelId);
                    if (logCh) {
                        const logEmbed = new EmbedBuilder()
                            .setColor('#ff6b35')
                            .setTitle('📋 AutoMod • Infracción registrada')
                            .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
                            .addFields(
                                { name: '👤 Usuario',         value: `<@${message.author.id}> (${message.author.username})`, inline: true },
                                { name: '📍 Canal',           value: `<#${message.channel.id}>`,                             inline: true },
                                { name: '⚠️ Total faltas',   value: `${newCount}`,                                           inline: true },
                                { name: '🎯 Acción aplicada', value: actionText ?? 'Solo advertencia',                        inline: true }
                            )
                            .setFooter({ text: 'Soledad ❣ • Auto-Moderación' })
                            .setTimestamp();
                        await logCh.send({ embeds: [logEmbed] }).catch(() => {});
                    }
                }

                console.log(`🚫 AutoMod: ${message.author.username} → falta #${newCount}${actionText ? ` → ${actionText}` : ''} en ${message.guild.name}`);
            } catch (error) {
                console.error('Error en auto-moderación:', error);
            }
            return;
        }
        // ────────────────────────────────────────────────────────────────

        // ── TRADUCCIÓN AUTOMÁTICA ─────────────────────────────────────────
        try {
            const tradCfg = await getChannelConfig(message.guildId, message.channelId);
            if (tradCfg?.enabled && message.content.trim().length > 2) {
                const text       = message.content.trim();
                const detectedLang = await detectLanguage(text);

                if (detectedLang && detectedLang !== tradCfg.target_lang) {
                    const translated = await translateMessage(text, tradCfg.target_lang);
                    if (translated && translated !== text) {
                        const langName = LANG_NAMES[tradCfg.target_lang] || tradCfg.target_lang;
                        const embed = new EmbedBuilder()
                            .setColor('#1D9BF0')
                            .setAuthor({
                                name: message.member?.displayName || message.author.username,
                                iconURL: message.author.displayAvatarURL({ dynamic: true })
                            })
                            .setDescription(translated)
                            .setFooter({ text: `🌐 Traducido al ${langName} • Soledad ❣` });

                        await message.reply({ embeds: [embed] }).catch(() => {});
                    }
                }
            }
        } catch (tradErr) {
            // Silencioso: no interrumpir el flujo si falla la traducción
        }
        // ────────────────────────────────────────────────────────────────

        // ── NQN: REENVÍO DE EMOJIS NITRO ─────────────────────────────────
        const nqnMatches = [...message.content.matchAll(NQN_REGEX)];
        if (nqnMatches.length > 0) {
            let newContent = message.content;
            let replaced   = false;

            for (const match of nqnMatches) {
                const name  = match[0].slice(1, -1); // quitar los :
                const emoji = message.client.emojis.cache.find(e => e.name === name);
                if (emoji) {
                    const fmt = emoji.animated
                        ? `<a:${emoji.name}:${emoji.id}>`
                        : `<:${emoji.name}:${emoji.id}>`;
                    newContent = newContent.replace(match[0], fmt);
                    replaced   = true;
                }
            }

            if (replaced) {
                const me = message.guild.members.me;
                const hasPerms = message.channel.permissionsFor(me)?.has(['ManageWebhooks', 'ManageMessages']);

                if (hasPerms) {
                    try {
                        const result = await getOrCreateWebhook(message.channel, message.client);
                        if (result) {
                            const { webhook, threadId } = result;
                            await message.delete().catch(() => {});

                            const sendOptions = {
                                content: newContent,
                                username: message.member?.displayName || message.author.username,
                                avatarURL: message.author.displayAvatarURL({ dynamic: true }),
                                allowedMentions: { parse: [] },
                            };
                            if (threadId) sendOptions.threadId = threadId;

                            await webhook.send(sendOptions);
                            console.log(`✨ NQN: emoji enviado por ${message.author.username} en #${message.channel.name}`);
                            return;
                        }
                    } catch (err) {
                        console.error('Error en NQN:', err.message);
                    }
                }
            }
        }
        // ────────────────────────────────────────────────────────────────

        const content = message.content.toLowerCase().trim();
        const words = content.split(/\s+/);
        const possibleCommandName = words[0];

        const command = message.client.commands.get(possibleCommandName);

        if (command && !message.content.startsWith('/')) {
            try {
                const lang = await getLanguage(message.guildId);
                if (message.deletable) await message.delete().catch(() => {});

                const hint = lang === 'en'
                    ? `Hello <@${message.author.id}>! I detected you want to use **/${possibleCommandName}**. Please use the slash command by typing \`/\` so it works correctly. ✨`
                    : `¡Hola <@${message.author.id}>! He detectado que quieres usar **/${possibleCommandName}**. Por favor, usa el comando de barra escribiendo \`/\` para que funcione correctamente. ✨`;

                const infoMsg = await message.channel.send({ content: hint });
                setTimeout(() => infoMsg.delete().catch(() => {}), 10000);
                return;
            } catch (error) {
                console.error('Error detectando comando sin prefijo:', error);
            }
        }

        const isDirectMention =
            (message.mentions.users.has(message.client.user.id) && !message.mentions.everyone &&
                message.content.includes(`<@${message.client.user.id}>`)) ||
            message.content.includes(`<@!${message.client.user.id}>`);

        if (!isDirectMention) return;

        // Extraer el texto después de la mención
        const afterMention = message.content
            .replace(new RegExp(`<@!?${message.client.user.id}>`, 'g'), '')
            .trim();

        // Detectar @Soledad frase [texto opcional]
        const FRASE_CON_TEXTO_RE = /^frase\s+(.+)/is;
        const FRASE_SOLA_RE      = /^frase\s*$/i;
        const fraseConTexto = afterMention.match(FRASE_CON_TEXTO_RE);
        const fraseSola     = FRASE_SOLA_RE.test(afterMention);
        const quoteText     = fraseConTexto ? fraseConTexto[1].trim() : null;

        // ── @Soledad frase → genera frase AI y la envía como texto ──────────
        if (fraseSola) {
            try {
                await message.channel.sendTyping();
                const { generateAIMessage } = require('../utils/ai');
                const prompt = `Eres Soledad, un bot de Discord con personalidad tsundere. Genera UNA frase motivacional o filosófica en español. Máximo 2 oraciones. Sin introducción, solo la frase.`;
                const frase = await generateAIMessage(prompt, 120);
                const texto = frase || 'El único límite real eres tú mismo. Supérate.';
                await message.reply({ content: `✨ *"${texto}"*` });
            } catch (error) {
                console.error('Error generando frase:', error);
                await message.reply('❌ No pude generar la frase. Inténtalo de nuevo.');
            }
            return;
        }

        // ── @Soledad frase <texto> → convierte texto en imagen de cita ──────
        if (quoteText && quoteText.length > 0) {
            try {
                await message.channel.sendTyping();

                const avatarURL = message.author.displayAvatarURL({ extension: 'png', size: 512, forceStatic: true });
                const displayName = message.member?.displayName || message.author.username;

                const imageBuffer = await generateQuoteImage(quoteText, displayName, avatarURL, 'bw');
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });

                const styleRow = new ActionRowBuilder().addComponents(
                    ...Object.entries(STYLES).map(([key, val]) =>
                        new ButtonBuilder()
                            .setCustomId(`quote_style:${key}`)
                            .setLabel(val.label)
                            .setStyle(ButtonStyle.Secondary)
                    )
                );

                const quoteMsg = await message.reply({ files: [attachment], components: [styleRow] });

                if (!message.client.quoteCache) message.client.quoteCache = new Map();
                message.client.quoteCache.set(quoteMsg.id, { text: quoteText, username: displayName, avatarURL });
                setTimeout(() => message.client.quoteCache?.delete(quoteMsg.id), 10 * 60 * 1000);

                console.log(`🖼️ Quote generada para ${message.author.username} en ${message.guild.name}`);
            } catch (error) {
                console.error('Error generando quote:', error);
                await message.reply('❌ No pude generar la imagen. Inténtalo de nuevo.');
            }
            return;
        }
        // ─────────────────────────────────────────────────────────────────

        // Sin texto → respuesta de ayuda normal
        try {
            const helpEmbed = new EmbedBuilder()
                .setColor('#C084FC')
                .setTitle('<a:lux:1385222769566027836> ¡Hola! Soy Soledad ❣')
                .setDescription(`¡Hola <@${message.author.id}>! 👋 Usa **\`/ayuda\`** para ver todas mis funciones.\n\n💡 **Tip:** Mencioname con una frase y la convertiré en una **imagen de cita filosófica**.\n\u200B`)
                .addFields(
                    { name: '📖 Todos los comandos', value: '`/ayuda` — Menú interactivo completo',              inline: true },
                    { name: '🎬 Ocio & Economía',    value: '`/yt`, `/meme`, `/economy`, `/shop`',               inline: true },
                    { name: '💬 Social & IA',        value: '`/ia`, `/frase`, `/carta`, `/horoscopo`',           inline: true },
                    { name: '🖼️ Genera una cita',    value: 'Mencioname + texto → imagen filosófica al instante', inline: false },
                    { name: '💎 VIP Premium',        value: 'Suscríbete en [**whop.com/soledad-858d**](https://whop.com/soledad-858d) y desbloquea comandos exclusivos.', inline: false }
                )
                .setThumbnail(message.client.user.displayAvatarURL({ dynamic: true }))
                .setFooter({
                    text: `Soledad ❣ • Respondiendo a ${message.author.username}`,
                    iconURL: message.client.user.displayAvatarURL()
                })
                .setTimestamp();

            await message.reply({ embeds: [helpEmbed] });
            console.log(`💬 Respuesta a mención de ${message.author.username} en ${message.guild?.name || 'DM'}`);
        } catch (error) {
            console.error('Error respondiendo a mención:', error);
            try {
                await message.reply('¡Hola! Usa `/ayuda` para ver todos mis comandos. 👋');
            } catch (fallbackError) {
                console.error('Error con respuesta de fallback:', fallbackError);
            }
        }
    },
};
