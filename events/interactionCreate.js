const { Events, EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { createErrorEmbed } = require('../utils/embeds');
const { getLanguage, t, wrapInteraction } = require('../utils/i18n');

const processedInteractions = new Set();

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Deduplicación: ignorar si ya fue procesada esta interacción
        if (processedInteractions.has(interaction.id)) return;
        processedInteractions.add(interaction.id);
        setTimeout(() => processedInteractions.delete(interaction.id), 10000);

        // Manejar interacciones de botones
        if (interaction.isButton()) {
            // Manejar botones de ayuda
            if (interaction.customId.startsWith('help_')) {
                await this.handleHelpButtons(interaction);
                return;
            }

            // Manejar cambio de estilo de quote
            if (interaction.customId.startsWith('quote_style:')) {
                await this.handleQuoteStyle(interaction);
                return;
            }

            // Manejar paginación de /join
            if (interaction.customId.startsWith('join_page_')) {
                const page = parseInt(interaction.customId.replace('join_page_', ''));
                const joinCommand = interaction.client.commands.get('join');
                if (joinCommand?.handlePage) {
                    await joinCommand.handlePage(interaction, page);
                }
                return;
            }
            
            // Manejar botón de verificación
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

            // Manejar botones de roles
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

                // Verificar permisos del bot
                if (!interaction.guild.members.me.permissions.has('ManageRoles')) {
                    const noPermEmbed = new EmbedBuilder()
                        .setColor('#ff0000')
                        .setTitle('❌ Sin Permisos')
                        .setDescription('No tengo permisos para gestionar roles.')
                        .setTimestamp();
                    
                    return await interaction.reply({ embeds: [noPermEmbed], flags: 64 });
                }

                // Verificar jerarquía
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
                        // Quitar el rol
                        await member.roles.remove(role);
                        
                        const removedEmbed = new EmbedBuilder()
                            .setColor('#ff9500')
                            .setTitle('➖ Rol Removido')
                            .setDescription(`Se te ha quitado el rol **${role.name}**`)
                            .setTimestamp();
                        
                        await interaction.reply({ embeds: [removedEmbed], flags: 64 });
                    } else {
                        // Añadir el rol
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

        // Manejar menús de selección
        if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'language_select') {
                const languageCommand = interaction.client.commands.get('language');
                if (languageCommand?.handleSelect) {
                    await languageCommand.handleSelect(interaction);
                }
                return;
            }
        }
        
        // Solo manejar comandos slash
        if (!interaction.isChatInputCommand()) return;

        // Descartar interacciones expiradas (token válido solo 3 segundos)
        if (Date.now() - interaction.createdTimestamp > 2500) return;

        console.log(`📋 Comando recibido: /${interaction.commandName}`);
        const command = interaction.client.commands.get(interaction.commandName) || 
                        Array.from(interaction.client.commands.values()).find(cmd => 
                            cmd.alias === interaction.commandName || 
                            (Array.isArray(cmd.aliases) && cmd.aliases.includes(interaction.commandName)) ||
                            (cmd.data && cmd.data.name === interaction.commandName)
                        );

        if (!command) {
            console.error(`❌ No se encontró el comando: ${interaction.commandName}`);
            // Log de depuración para ver qué tenemos en la colección
            console.log(`📝 Comandos cargados en memoria:`, Array.from(interaction.client.commands.keys()));
            
            // Intentar responder si el comando no existe para que el usuario no se quede esperando
            try {
                await interaction.reply({ 
                    content: `❌ El comando \`/${interaction.commandName}\` no está disponible o no se ha cargado correctamente.`, 
                    flags: 64 
                });
            } catch (e) {}
            return;
        }

        try {
            console.log(`🚀 Ejecutando comando: ${interaction.commandName}`);
            const guildLang = interaction.guildId ? await getLanguage(interaction.guildId).catch(() => 'es') : 'es';
            // El comando /language maneja su propio texto bilingüe — no aplicar wrapper
            if (interaction.commandName !== 'language') {
                wrapInteraction(interaction, guildLang);
            }
            await command.execute(interaction);
            console.log(`📝 Comando completado: /${interaction.commandName} por ${interaction.user.tag} en ${interaction.guild?.name || 'DM'}`);

        } catch (error) {
            console.error(`❌ Error ejecutando el comando ${interaction.commandName}:`, error);

            // Obtener idioma del servidor para mostrar el error en el idioma correcto
            const lang = interaction.guildId ? await getLanguage(interaction.guildId).catch(() => 'es') : 'es';
            const errorMessages = {
                es: 'Hubo un error al ejecutar este comando. Por favor, inténtalo de nuevo más tarde.',
                en: 'There was an error executing this command. Please try again later.',
                fr: 'Une erreur s\'est produite lors de l\'exécution de cette commande. Veuillez réessayer plus tard.',
                pt: 'Ocorreu um erro ao executar este comando. Por favor, tente novamente mais tarde.',
                de: 'Beim Ausführen dieses Befehls ist ein Fehler aufgetreten. Bitte versuche es später erneut.',
                it: 'Si è verificato un errore durante l\'esecuzione di questo comando. Riprova più tardi.',
                ja: 'このコマンドの実行中にエラーが発生しました。後でもう一度お試しください。',
                ko: '이 명령을 실행하는 중 오류가 발생했습니다. 나중에 다시 시도해 주세요.',
                zh: '执行此命令时出现错误。请稍后再试。',
                ru: 'При выполнении этой команды произошла ошибка. Пожалуйста, попробуйте позже.',
                ar: 'حدث خطأ أثناء تنفيذ هذا الأمر. يرجى المحاولة مرة أخرى لاحقاً.',
                tr: 'Bu komut yürütülürken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
            };

            const errorEmbed = createErrorEmbed(errorMessages[lang] || errorMessages.es);

            try {
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ embeds: [errorEmbed], flags: 64 });
                } else {
                    await interaction.reply({ embeds: [errorEmbed], flags: 64 });
                }
            } catch (e) {
                console.error('Error enviando mensaje de error:', e);
            }
        }
    },

    async handleHelpButtons(interaction) {
        const helpCommand = interaction.client.commands.get('ayuda');
        const buttonId = interaction.customId;
        const navButtons = helpCommand.createNavButtons();

        // Obtener banner del perfil del bot
        let bannerUrl = null;
        try {
            const botUser = await interaction.client.users.fetch(interaction.client.user.id, { force: true });
            bannerUrl = botUser.bannerURL({ size: 1024 }) || null;
        } catch {}

        if (buttonId === 'help_home') {
            const mainEmbed = new EmbedBuilder()
                .setTitle('<a:lux:1385222769566027836> Soledad ❣ — Menú de Ayuda')
                .setDescription('¡Bienvenido de vuelta al menú principal! Usa los botones para navegar.\n\u200B')
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
                .setFooter({ text: 'Soledad ❣ • Usa los botones para navegar', iconURL: interaction.client.user.displayAvatarURL() })
                .setTimestamp();

            if (bannerUrl) mainEmbed.setImage(bannerUrl);
            await interaction.update({ embeds: [mainEmbed], components: navButtons });

        } else {
            const categoryMap = {
                'help_entretenimiento': 'entretenimiento',
                'help_music': 'entretenimiento',
                'help_gaming': 'gaming',
                'help_social': 'social',
                'help_utils': 'utils',
                'help_mod': 'mod',
                'help_premium': 'premium'
            };

            const category = categoryMap[buttonId];
            if (category && helpCommand.createCategoryEmbed) {
                const commandIds = interaction.client.commandIds;
                const categoryEmbed = helpCommand.createCategoryEmbed(category, commandIds, bannerUrl);
                await interaction.update({ embeds: [categoryEmbed], components: navButtons });
            }
        }

        console.log(`🔘 Botón procesado: ${buttonId} por ${interaction.user.tag}`);
    },

    async handleQuoteStyle(interaction) {
        const { generateQuoteImage, STYLES } = require('../utils/quote');

        const style = interaction.customId.replace('quote_style:', '');
        const cache = interaction.client.quoteCache;

        if (!cache || !cache.has(interaction.message.id)) {
            return interaction.reply({ content: '⏰ Esta cita ya expiró. Mencióname de nuevo con tu texto.', flags: 64 });
        }

        await interaction.deferUpdate();

        const { text, username, avatarURL } = cache.get(interaction.message.id);

        try {
            const imageBuffer = await generateQuoteImage(text, username, avatarURL, style);
            const attachment = new AttachmentBuilder(imageBuffer, { name: 'quote.png' });

            const styleRow = new ActionRowBuilder().addComponents(
                ...Object.entries(STYLES).map(([key, val]) =>
                    new ButtonBuilder()
                        .setCustomId(`quote_style:${key}`)
                        .setLabel(val.label)
                        .setStyle(key === style ? ButtonStyle.Primary : ButtonStyle.Secondary)
                )
            );

            await interaction.editReply({ files: [attachment], components: [styleRow] });
            console.log(`🎨 Quote estilo "${style}" para ${username}`);
        } catch (error) {
            console.error('Error regenerando quote:', error);
            await interaction.followUp({ content: '❌ No pude cambiar el estilo. Inténtalo de nuevo.', flags: 64 });
        }
    }
};
