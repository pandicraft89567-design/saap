const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const EMOJI_SORTEO = '🎉';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sorteo')
        .setNameLocalizations({ 'en-US': 'giveaway', 'en-GB': 'giveaway' })
        .setDescription('Inicia un sorteo y elige un ganador aleatorio 🎉')
        .setDescriptionLocalizations({ 'en-US': 'Start a giveaway and pick a random winner 🎉', 'en-GB': 'Start a giveaway and pick a random winner 🎉' })
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addStringOption(opt =>
            opt.setName('premio')
                .setNameLocalizations({ 'en-US': 'prize', 'en-GB': 'prize' })
                .setDescription('¿Qué se sortea? (ej: Nitro, rol VIP, sesión de juego)')
                .setDescriptionLocalizations({ 'en-US': 'What is the prize? (e.g. Nitro, VIP role, gaming session)', 'en-GB': 'What is the prize? (e.g. Nitro, VIP role, gaming session)' })
                .setRequired(true)
                .setMaxLength(100))
        .addIntegerOption(opt =>
            opt.setName('duracion')
                .setNameLocalizations({ 'en-US': 'duration', 'en-GB': 'duration' })
                .setDescription('Duración del sorteo en minutos (1–1440)')
                .setDescriptionLocalizations({ 'en-US': 'Giveaway duration in minutes (1–1440)', 'en-GB': 'Giveaway duration in minutes (1–1440)' })
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1440))
        .addIntegerOption(opt =>
            opt.setName('ganadores')
                .setNameLocalizations({ 'en-US': 'winners', 'en-GB': 'winners' })
                .setDescription('Cantidad de ganadores (default: 1, max: 10)')
                .setDescriptionLocalizations({ 'en-US': 'Number of winners (default: 1, max: 10)', 'en-GB': 'Number of winners (default: 1, max: 10)' })
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10))
        .addRoleOption(opt =>
            opt.setName('rol_requerido')
                .setNameLocalizations({ 'en-US': 'required-role', 'en-GB': 'required-role' })
                .setDescription('Solo pueden participar miembros con este rol (opcional)')
                .setDescriptionLocalizations({ 'en-US': 'Only members with this role can participate (optional)', 'en-GB': 'Only members with this role can participate (optional)' })
                .setRequired(false)),

    async execute(interaction) {
        const premio      = interaction.options.getString('premio');
        const duracion    = interaction.options.getInteger('duracion');
        const numGanadores = interaction.options.getInteger('ganadores') ?? 1;
        const rolReq      = interaction.options.getRole('rol_requerido');

        const finAt  = Date.now() + duracion * 60_000;
        const finTs  = Math.floor(finAt / 1000);

        const embedInicio = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`${EMOJI_SORTEO} ¡SORTEO EN CURSO!`)
            .setDescription(
                `**Premio:** 🎁 ${premio}\n` +
                `**Termina:** <t:${finTs}:R> (<t:${finTs}:f>)\n` +
                `**Ganadores:** ${numGanadores}\n` +
                (rolReq ? `**Rol requerido:** <@&${rolReq.id}>\n` : '') +
                `\n> Reacciona con ${EMOJI_SORTEO} para participar!`
            )
            .setFooter({ text: `Organizado por ${interaction.user.username} • Reacciona con 🎉` })
            .setTimestamp();

        await interaction.reply({ embeds: [embedInicio] });
        const msg = await interaction.fetchReply();

        await msg.react(EMOJI_SORTEO);

        // Esperar hasta que termine el sorteo
        setTimeout(async () => {
            try {
                const mensaje = await interaction.channel.messages.fetch(msg.id);
                const reaction = mensaje.reactions.cache.get(EMOJI_SORTEO);

                if (!reaction) {
                    return interaction.channel.send({ content: '❌ Nadie reaccionó al sorteo, fue cancelado.' });
                }

                // Obtener usuarios que reaccionaron (excluir bots)
                const usuarios = await reaction.users.fetch();
                let participantes = [...usuarios.values()].filter(u => !u.bot);

                // Filtrar por rol si se especificó
                if (rolReq) {
                    const members = await interaction.guild.members.fetch();
                    participantes = participantes.filter(u => {
                        const member = members.get(u.id);
                        return member?.roles.cache.has(rolReq.id);
                    });
                }

                if (!participantes.length) {
                    return interaction.channel.send({ content: '❌ No hay participantes válidos para el sorteo.' });
                }

                // Elegir ganador(es) aleatorios sin repetición
                const shuffled = [...participantes].sort(() => Math.random() - 0.5);
                const ganadores = shuffled.slice(0, Math.min(numGanadores, shuffled.length));
                const menciones = ganadores.map(u => `<@${u.id}>`).join(', ');

                const embedGanadores = new EmbedBuilder()
                    .setColor('#00FF7F')
                    .setTitle(`🏆 ¡Sorteo terminado! — ${premio}`)
                    .setDescription(
                        `**${ganadores.length > 1 ? 'Ganadores' : 'Ganador'}:** ${menciones}\n` +
                        `**Premio:** 🎁 ${premio}\n` +
                        `**Participantes:** ${participantes.length}\n\n` +
                        `¡Felicitaciones! 🎊`
                    )
                    .setFooter({ text: `Sorteo organizado por ${interaction.user.username}` })
                    .setTimestamp();

                await interaction.channel.send({
                    content: `¡Felicidades ${menciones}! 🎉`,
                    embeds: [embedGanadores]
                });

            } catch (err) {
                console.error('Error al finalizar sorteo:', err);
            }
        }, duracion * 60_000);
    }
};
