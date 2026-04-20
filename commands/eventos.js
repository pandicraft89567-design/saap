const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eventos')
        .setDescription('Crea un evento con canal, rol y botón de unirse')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o =>
            o.setName('mensaje')
                .setDescription('Mensaje del evento (descripción visible para todos)')
                .setRequired(true)
                .setMaxLength(1000))
        .addIntegerOption(o =>
            o.setName('duracion')
                .setDescription('Duración del evento en horas (ej: 2 = 2 horas)')
                .setRequired(true)
                .setMinValue(1)),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const mensaje  = interaction.options.getString('mensaje');
        const horas    = interaction.options.getInteger('duracion');
        const guild    = interaction.guild;
        const finMs    = Date.now() + horas * 3_600_000;
        const finTs    = Math.floor(finMs / 1000);

        // ── 1. Crear o reutilizar el rol ─────────────────────────────────
        let rol = guild.roles.cache.find(r => r.name === '🎉 Eventos');
        if (!rol) {
            rol = await guild.roles.create({
                name:        '🎉 Eventos',
                color:       '#F472B6',
                mentionable: true,
                reason:      `Evento creado por ${interaction.user.username}`,
            }).catch(() => null);
        }

        if (!rol) {
            return interaction.editReply({ content: '❌ No pude crear el rol de eventos. Verifica mis permisos.' });
        }

        // ── 2. Crear o reutilizar el canal ───────────────────────────────
        let canal = guild.channels.cache.find(c => c.name === '📅︱eventos' && c.type === ChannelType.GuildText);
        if (!canal) {
            canal = await guild.channels.create({
                name:   '📅︱eventos',
                type:   ChannelType.GuildText,
                reason: `Canal de eventos creado por ${interaction.user.username}`,
                permissionOverwrites: [
                    {
                        id:   guild.roles.everyone.id,
                        allow: ['ViewChannel', 'ReadMessageHistory'],
                        deny:  ['SendMessages'],
                    },
                ],
            }).catch(() => null);
        }

        if (!canal) {
            return interaction.editReply({ content: '❌ No pude crear el canal de eventos. Verifica mis permisos.' });
        }

        // ── 3. Construir embed y botón ───────────────────────────────────
        const embed = new EmbedBuilder()
            .setColor('#F472B6')
            .setTitle('🎉 ¡Nuevo Evento!')
            .setDescription(mensaje)
            .addFields(
                { name: '⏰ Termina',   value: `<t:${finTs}:F> (<t:${finTs}:R>)`, inline: true },
                { name: '🎭 Rol',       value: `<@&${rol.id}>`,                     inline: true },
            )
            .setFooter({ text: `Organizado por ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL() })
            .setTimestamp();

        const boton = new ButtonBuilder()
            .setCustomId(`evento_join_${rol.id}`)
            .setLabel('🎉 Unirse al evento')
            .setStyle(ButtonStyle.Primary);

        const fila = new ActionRowBuilder().addComponents(boton);

        // ── 4. Enviar mensaje en el canal ────────────────────────────────
        const mensajeEvento = await canal.send({ embeds: [embed], components: [fila] }).catch(() => null);

        if (!mensajeEvento) {
            return interaction.editReply({ content: '❌ No pude enviar el mensaje en el canal de eventos.' });
        }

        // ── 5. Confirmar al admin ────────────────────────────────────────
        const confirmEmbed = new EmbedBuilder()
            .setColor('#51cf66')
            .setTitle('✅ Evento creado')
            .addFields(
                { name: '📍 Canal',    value: `<#${canal.id}>`,     inline: true },
                { name: '🎭 Rol',      value: `<@&${rol.id}>`,      inline: true },
                { name: '⏰ Duración', value: `${horas} hora(s)`,   inline: true },
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [confirmEmbed] });

        // ── 6. Temporizador de fin de evento ─────────────────────────────
        setTimeout(async () => {
            try {
                // Editar embed como terminado
                const embedFin = EmbedBuilder.from(embed)
                    .setColor('#6B7280')
                    .setTitle('⏹️ Evento Finalizado')
                    .setDescription(mensaje)
                    .spliceFields(0, 1, { name: '✅ Terminó', value: `<t:${finTs}:F>`, inline: true });

                const botonDesactivado = new ButtonBuilder()
                    .setCustomId(`evento_join_${rol.id}`)
                    .setLabel('Evento finalizado')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);

                await mensajeEvento.edit({
                    embeds:     [embedFin],
                    components: [new ActionRowBuilder().addComponents(botonDesactivado)],
                }).catch(() => {});

                // Quitar el rol a todos los que lo tengan
                const miembros = await guild.members.fetch().catch(() => null);
                if (miembros) {
                    const conRol = miembros.filter(m => m.roles.cache.has(rol.id));
                    for (const [, miembro] of conRol) {
                        await miembro.roles.remove(rol).catch(() => {});
                    }
                }

                // Eliminar el rol
                await rol.delete('Evento finalizado').catch(() => {});

                // Anuncio en el canal
                await canal.send({
                    content: `⏹️ El evento ha finalizado. El rol <@&${rol.id}> ha sido retirado a todos los participantes.`,
                }).catch(() => {});

            } catch (err) {
                console.error('Error al finalizar evento:', err);
            }
        }, horas * 3_600_000);
    },
};
