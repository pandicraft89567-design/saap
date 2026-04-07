const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('verificar')
        .setDescription('Configura un sistema de verificación con botón personalizable')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addChannelOption(option =>
            option.setName('canal')
                .setDescription('Canal donde se enviará el mensaje de verificación')
                .setRequired(true))
        .addRoleOption(option =>
            option.setName('rol')
                .setDescription('Rol que se asignará al verificarse')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('boton_nombre')
                .setDescription('Nombre del botón (ej: Verificar, Acepto, Entrar...)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('boton_emoji')
                .setDescription('Emoji del botón (ej: ✅ o emoji personalizado)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('titulo')
                .setDescription('Título del mensaje de verificación')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('descripcion')
                .setDescription('Descripción del mensaje de verificación')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Color del embed en HEX (ej: #7289DA)')
                .setRequired(false)),

    async execute(interaction) {
        const canal       = interaction.options.getChannel('canal');
        const rol         = interaction.options.getRole('rol');
        const btnNombre   = interaction.options.getString('boton_nombre')  || 'Verificar';
        const btnEmoji    = interaction.options.getString('boton_emoji')   || '✅';
        const titulo      = interaction.options.getString('titulo')        || '✅ Verificación';
        const descripcion = interaction.options.getString('descripcion')   || `Haz clic en el botón para verificarte y obtener el rol **${rol.name}**.`;
        const colorHex    = interaction.options.getString('color')         || '#57F287';

        // Validar permisos del bot en el canal
        if (!canal.permissionsFor(interaction.guild.members.me).has(['SendMessages', 'EmbedLinks'])) {
            return interaction.reply({
                content: '❌ No tengo permisos para enviar mensajes en ese canal.',
                flags: 64
            });
        }

        // Validar jerarquía del rol
        if (rol.position >= interaction.guild.members.me.roles.highest.position) {
            return interaction.reply({
                content: '❌ El rol que elegiste está por encima de mi posición. Mueve mi rol más arriba en el servidor.',
                flags: 64
            });
        }

        const embed = new EmbedBuilder()
            .setColor(colorHex)
            .setTitle(titulo)
            .setDescription(descripcion)
            .setFooter({ text: `Soledad ❣ • Rol: ${rol.name}`, iconURL: interaction.client.user.displayAvatarURL() })
            .setTimestamp();

        // Construir el botón
        let button = new ButtonBuilder()
            .setCustomId(`verify_${rol.id}`)
            .setLabel(btnNombre)
            .setStyle(ButtonStyle.Success);

        // Agregar emoji si se proporcionó
        if (btnEmoji) {
            try {
                button = button.setEmoji(btnEmoji);
            } catch {
                // Si el emoji falla (ej: emoji personalizado de otro servidor), ignorarlo
            }
        }

        const row = new ActionRowBuilder().addComponents(button);

        try {
            await canal.send({ embeds: [embed], components: [row] });
            await interaction.reply({
                content: `✅ Mensaje de verificación enviado en ${canal}.\nCuando alguien haga clic en el botón recibirá el rol **${rol.name}**.`,
                flags: 64
            });
        } catch (error) {
            console.error('Error enviando verificación:', error);
            await interaction.reply({
                content: '❌ No pude enviar el mensaje al canal. Verifica mis permisos.',
                flags: 64
            });
        }
    },
};
