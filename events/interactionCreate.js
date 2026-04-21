const { Events, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, t, wrapInteraction } = require('../utils/i18n');

const processedInteractions = new Set();

async function handleHelpButtons(interaction) {
    const category = interaction.customId.replace('help_', '');

    await interaction.deferUpdate();

    try {
        let bannerUrl = null;
        try {
            const botUser = await interaction.client.users.fetch(interaction.client.user.id, { force: true });
            bannerUrl = botUser.bannerURL({ size: 1024 }) || null;
        } catch {}

        // Build a map of command name → command ID for clickable mentions
        const commandIds = new Map();
        try {
            const guildCommands = await interaction.guild?.commands.fetch().catch(() => null);
            const appCommands = await interaction.client.application?.commands.fetch().catch(() => null);
            const allCmds = [...(guildCommands?.values() || []), ...(appCommands?.values() || [])];
            for (const cmd of allCmds) {
                commandIds.set(cmd.name, cmd.id);
            }
        } catch {}

        const ayuda = require('../commands/ayuda');

        if (category === 'home') {
            const { EmbedBuilder } = require('discord.js');
            const mainEmbed = new EmbedBuilder()
                .setTitle('<a:lux:1385222769566027836> Soledad ❣ — Menú de Ayuda')
                .setDescription('¡Hola! Aquí están todos mis comandos disponibles.\n\u200B')
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

            return await interaction.editReply({ embeds: [mainEmbed], components: ayuda.createNavButtons() });
        }

        const embed = ayuda.createCategoryEmbed(category, commandIds, bannerUrl);

        if (!embed) {
            return await interaction.followUp({ content: '❌ Categoría no encontrada.', flags: 64 });
        }

        await interaction.editReply({ embeds: [embed], components: ayuda.createNavButtons() });

    } catch (error) {
        console.error('Error en botones de ayuda:', error);
        try {
            await interaction.followUp({ content: '❌ Ocurrió un error al cargar esta categoría.', flags: 64 });
        } catch {}
    }
}

const REASON_MAP = {
    resp: 'Faltas de respeto',
    cord: 'Falta de cordialidad',
    lang: 'Lenguaje inapropiado',
};

const DURATIONS = [
    { label: '30 min',  minutes: 30    },
    { label: '1 hora',  minutes: 60    },
    { label: '6 horas', minutes: 360   },
    { label: '12 hs',   minutes: 720   },
    { label: '1 día',   minutes: 1440  },
    { label: '7 días',  minutes: 10080 },
    { label: '15 días', minutes: 21600 },
];

async function handleAutomodSelect(interaction) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ Necesitas permisos de moderación para usar esto.', flags: 64 });
    }

    const userId = interaction.customId.slice('am_sel_'.length);
    const action  = interaction.values[0];
    await interaction.deferUpdate();

    const baseEmbed = EmbedBuilder.from(interaction.message.embeds[0]);

    if (action === 'silenciar') {
        const buttons = DURATIONS.map(d =>
            new ButtonBuilder()
                .setCustomId(`am_mute_${userId}_${d.minutes}`)
                .setLabel(d.label)
                .setStyle(ButtonStyle.Secondary)
        );
        const row1 = new ActionRowBuilder().addComponents(buttons.slice(0, 4));
        const row2 = new ActionRowBuilder().addComponents(buttons.slice(4));
        baseEmbed.setColor('#ffd43b').spliceFields(3, 1, { name: '⏳ Acción seleccionada', value: '🔇 Silenciar — elige la duración:', inline: false });
        await interaction.editReply({ embeds: [baseEmbed], components: [row1, row2] });
    } else {
        const prefix = action === 'banear' ? 'am_ban' : 'am_kick';
        const style  = action === 'banear' ? ButtonStyle.Danger : ButtonStyle.Primary;
        const row = new ActionRowBuilder().addComponents(
            Object.entries(REASON_MAP).map(([code, label]) =>
                new ButtonBuilder()
                    .setCustomId(`${prefix}_${userId}_${code}`)
                    .setLabel(label)
                    .setStyle(style)
            )
        );
        const actionLabel = action === 'banear' ? '🔨 Banear' : '👢 Expulsar';
        baseEmbed.setColor(action === 'banear' ? '#ff4757' : '#ff6b35')
                 .spliceFields(3, 1, { name: '⏳ Acción seleccionada', value: `${actionLabel} — elige la razón:`, inline: false });
        await interaction.editReply({ embeds: [baseEmbed], components: [row] });
    }
}

async function handleAutomodButton(interaction) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers)) {
        return interaction.reply({ content: '❌ Necesitas permisos de moderación para usar esto.', flags: 64 });
    }

    await interaction.deferUpdate();

    const parts      = interaction.customId.split('_');
    const actionType = parts[1];
    const userId     = parts[2];
    const param      = parts[3];

    let resultText = '';
    try {
        const target = await interaction.guild.members.fetch(userId).catch(() => null);
        if (!target) {
            resultText = '❌ Usuario no encontrado en el servidor (puede que ya no esté)';
        } else if (actionType === 'mute') {
            const minutes = parseInt(param);
            await target.timeout(minutes * 60 * 1000, `AutoMod manual por ${interaction.user.username}`);
            const label = minutes >= 1440
                ? `${Math.round(minutes / 1440)} día(s)`
                : minutes >= 60
                    ? `${Math.round(minutes / 60)} hora(s)`
                    : `${minutes} minuto(s)`;
            resultText = `🔇 Silenciado por **${label}**`;
        } else if (actionType === 'ban') {
            const reason = REASON_MAP[param] ?? param;
            await target.ban({ reason: `AutoMod manual: ${reason}` });
            resultText = `🔨 Baneado — Razón: **${reason}**`;
        } else if (actionType === 'kick') {
            const reason = REASON_MAP[param] ?? param;
            await target.kick(`AutoMod manual: ${reason}`);
            resultText = `👢 Expulsado — Razón: **${reason}**`;
        }
    } catch (err) {
        console.error('Error en automod manual:', err.message);
        resultText = `❌ Error al aplicar la sanción: ${err.message}`;
    }

    const doneEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor('#51cf66')
        .setTitle('✅ AutoMod • Sanción aplicada')
        .spliceFields(3, 1,
            { name: '⚖️ Sanción aplicada', value: `${resultText}\n👮 Por: <@${interaction.user.id}>`, inline: false }
        );
    await interaction.editReply({ embeds: [doneEmbed], components: [] });
}

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (processedInteractions.has(interaction.id)) return;
        processedInteractions.add(interaction.id);
        setTimeout(() => processedInteractions.delete(interaction.id), 10000);

        // ===============================
        // 🔘 BOTONES
        // ===============================
        if (interaction.isButton()) {

            // ===== AUTOMOD MANUAL =====
            if (interaction.customId.startsWith('am_mute_') ||
                interaction.customId.startsWith('am_ban_')  ||
                interaction.customId.startsWith('am_kick_')) {
                await handleAutomodButton(interaction);
                return;
            }

            // ===============================
            // 🗑️ ELIMINAR MENSAJE (FIX UI)
            // ===============================
            if (interaction.customId.startsWith('delete_')) {
                const [_, channelId, messageId] = interaction.customId.split('_');

                try {
                    const channel = await interaction.client.channels.fetch(channelId);
                    if (!channel) return interaction.deferUpdate().catch(() => {});

                    const msg = await channel.messages.fetch(messageId);

                    if (msg.author.id !== interaction.client.user.id) {
                        return interaction.reply({
                            content: '❌ Solo puedo eliminar mensajes enviados por mí.',
                            flags: 64
                        });
                    }

                    await msg.delete();

                    // 🔥 CLAVE: no usar reply → evita romper otros botones
                    return interaction.deferUpdate().catch(() => {});

                } catch (err) {
                    console.error('Error eliminando mensaje:', err);

                    if (!interaction.replied) {
                        return interaction.reply({
                            content: '❌ No pude eliminar el mensaje.',
                            flags: 64
                        });
                    }
                }
            }

            // ===== HELP =====
            if (interaction.customId.startsWith('help_')) {
                await handleHelpButtons(interaction);
                return;
            }

            // ===== QUOTE =====
            if (interaction.customId.startsWith('quote_style:')) {
                const newStyle = interaction.customId.split(':')[1];
                const cached = interaction.client.quoteCache?.get(interaction.message.id);
                if (!cached) {
                    return interaction.reply({ content: '⏰ Esta cita ya expiró. Usa `/cita` de nuevo.', flags: 64 });
                }
                await interaction.deferUpdate();
                const { generateQuoteImage } = require('../utils/quote');
                const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
                const imageBuffer = await generateQuoteImage(cached.text, cached.username, cached.avatarURL, newStyle);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'cita.png' });

                const nextStyle  = newStyle === 'bw' ? 'color' : 'bw';
                const nextLabel  = newStyle === 'bw' ? '🎨 Color' : '⬛ B&N';
                const toggleRow  = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId(`quote_style:${nextStyle}`)
                        .setLabel(nextLabel)
                        .setStyle(ButtonStyle.Secondary)
                );

                cached.style = newStyle;
                await interaction.editReply({ files: [attachment], components: [toggleRow] });
                return;
            }

            // ===== PAGINACIÓN JOIN =====
            if (interaction.customId.startsWith('join_page_')) {
                const page = parseInt(interaction.customId.replace('join_page_', ''));
                const joinCommand = interaction.client.commands.get('join');
                if (joinCommand?.handlePage) {
                    await joinCommand.handlePage(interaction, page);
                }
                return;
            }
            
            // ===== VERIFICACIÓN =====
            if (interaction.customId.startsWith('verify_')) {
                const roleId = interaction.customId.replace('verify_', '');
                const role = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ El rol de verificación ya no existe. Pide al admin que lo reconfigure.', flags: 64 });
                }
                if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ No tengo permisos para gestionar roles.', flags: 64 });
                }
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.reply({ content: '❌ No puedo asignar ese rol por jerarquía. Pide al admin que suba mi rol.', flags: 64 });
                }

                try {
                    if (interaction.member.roles.cache.has(roleId)) {
                        return interaction.reply({ content: `✅ Ya tienes el rol **${role.name}**, ¡ya estás verificado/a!`, flags: 64 });
                    }
                    await interaction.member.roles.add(role);
                    const verifiedEmbed = new EmbedBuilder()
                        .setColor('#57F287')
                        .setTitle('✅ ¡Verificado/a!')
                        .setDescription(`Se te ha asignado el rol **${role.name}**. ¡Bienvenido/a al servidor!`)
                        .setFooter({ text: 'Soledad ❣', iconURL: interaction.client.user.displayAvatarURL() });
                    return interaction.reply({ embeds: [verifiedEmbed], flags: 64 });
                } catch (error) {
                    console.error('Error en verificación:', error);
                    return interaction.reply({ content: '❌ No pude asignarte el rol. Contacta a un admin.', flags: 64 });
                }
            }

            // ===== EVENTOS (unirse/salir del rol) =====
            if (interaction.customId.startsWith('evento_join_')) {
                const roleId = interaction.customId.replace('evento_join_', '');
                const role   = interaction.guild.roles.cache.get(roleId);

                if (!role) {
                    return interaction.reply({ content: '❌ El evento ya terminó y el rol fue eliminado.', flags: 64 });
                }
                if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
                    return interaction.reply({ content: '❌ No tengo permisos para gestionar roles.', flags: 64 });
                }
                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    return interaction.reply({ content: '❌ No puedo asignar ese rol por jerarquía. Pide al admin que suba mi rol.', flags: 64 });
                }

                try {
                    if (interaction.member.roles.cache.has(roleId)) {
                        await interaction.member.roles.remove(role);
                        return interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor('#ff9500')
                                .setDescription(`➖ Te has **salido** del evento. Se te quitó el rol **${role.name}**.`)],
                            flags: 64,
                        });
                    } else {
                        await interaction.member.roles.add(role);
                        return interaction.reply({
                            embeds: [new EmbedBuilder()
                                .setColor('#F472B6')
                                .setDescription(`🎉 ¡Te has **unido** al evento! Se te asignó el rol **${role.name}**.`)],
                            flags: 64,
                        });
                    }
                } catch (err) {
                    console.error('Error en botón de evento:', err);
                    return interaction.reply({ content: '❌ No pude asignarte el rol. Contacta a un admin.', flags: 64 });
                }
            }

            // ===== ROLES =====
            if (interaction.customId.startsWith('role_')) {
                const roleId = interaction.customId.replace('role_', '');
                const role = interaction.guild.roles.cache.get(roleId);
                
                if (!role) {
                    const roleNotFoundEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Rol No Encontrado')
                        .setDescription('El rol configurado ya no existe en el servidor.')
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [roleNotFoundEmbed], flags: 64 });
                }

                if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
                    const noPermEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Sin Permisos')
                        .setDescription('No tengo permisos para gestionar roles.')
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [noPermEmbed], flags: 64 });
                }

                if (role.position >= interaction.guild.members.me.roles.highest.position) {
                    const hierarchyEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Jerarquía Insuficiente')
                        .setDescription('No puedo asignar este rol porque está por encima de mi posición.')
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [hierarchyEmbed], flags: 64 });
                }

                try {
                    const member = interaction.member;
                    
                    if (member.roles.cache.has(roleId)) {
                        await member.roles.remove(role);
                        
                        const removedEmbed = new EmbedBuilder()
                            .setColor('#ff9500')
                            .setTitle('➖ Rol Removido')
                            .setDescription(`Se te ha quitado el rol **${role.name}**`)
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [removedEmbed], flags: 64 });
                    } else {
                        await member.roles.add(role);
                        
                        const addedEmbed = new EmbedBuilder()
                            .setColor('#00ff00')
                            .setTitle('✅ Rol Asignado')
                            .setDescription(`Se te ha asignado el rol **${role.name}**`)
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [addedEmbed], flags: 64 });
                    }
                } catch (error) {
                    console.error('Error asignando rol:', error);
                    
                    const errorEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Error')
                        .setDescription('No pude asignar el rol. Verifica los permisos.')
                        .setTimestamp();
                    
                    await interaction.reply({ embeds: [errorEmbed], flags: 64 });
                }
                
                return;
            }
        }

        // ===============================
        // SELECT MENU
        // ===============================
        if (interaction.isStringSelectMenu()) {

            // ===== AUTOMOD MANUAL =====
            if (interaction.customId.startsWith('am_sel_')) {
                await handleAutomodSelect(interaction);
                return;
            }

            // ===== CHANNEL: tipo de letra =====
            if (interaction.customId === 'channel_font_select') {
                const channelCmd = require('../commands/channel');
                const newFont    = interaction.values[0];
                channelCmd._getPrefs(interaction.user.id).font = newFont;

                const label = channelCmd._FONTS[newFont]?.label || newFont;
                const ex    = channelCmd._FONTS[newFont]?.example || '';
                return interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('✅ Tipo de letra guardado')
                        .setDescription(`Letra elegida: **${label}**\nEjemplo: \`${ex}\``)],
                    components: [],
                });
            }

            // ===== CHANNEL: símbolo separador =====
            if (interaction.customId === 'channel_symbol_select') {
                const channelCmd = require('../commands/channel');
                const newSym     = interaction.values[0];
                channelCmd._getPrefs(interaction.user.id).symbol = newSym;

                return interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#51cf66')
                        .setTitle('✅ Símbolo guardado')
                        .setDescription(`Símbolo elegido: \`${newSym}\`\nEjemplo: ✅${newSym}verificacion`)],
                    components: [],
                });
            }

            if (interaction.customId === 'language_select') {
                const languageCommand = interaction.client.commands.get('language');
                if (languageCommand?.handleSelect) {
                    await languageCommand.handleSelect(interaction);
                }
                return;
            }
        }

        // ===============================
        // SLASH COMMANDS
        // ===============================
        if (!interaction.isChatInputCommand()) return;

        if (Date.now() - interaction.createdTimestamp > 2500) return;

        console.log(`📋 Comando recibido: /${interaction.commandName}`);

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            return interaction.reply({ content: '❌ Comando no encontrado.', flags: 64 });
        }

        try {
            const guildLang = interaction.guildId ? await getLanguage(interaction.guildId).catch(() => 'es') : 'es';

            if (interaction.commandName !== 'language') {
                wrapInteraction(interaction, guildLang);
            }

            await command.execute(interaction);

        } catch (error) {
            console.error(error);

            const errorEmbed = createErrorEmbed('❌ Error ejecutando comando.');

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
            } else {
                await interaction.reply({ embeds: [errorEmbed], flags: 64 });
            }
        }
    }
};
