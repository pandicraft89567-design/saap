const { Events, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, t, wrapInteraction } = require('../utils/i18n');

const processedInteractions = new Set();

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
                await this.handleHelpButtons(interaction);
                return;
            }

            // ===== QUOTE =====
            if (interaction.customId.startsWith('quote_style:')) {
                await this.handleQuoteStyle(interaction);
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
