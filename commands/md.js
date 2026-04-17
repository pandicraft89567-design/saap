const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

const PROTECTED_ID = '832641595110719509';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseColor(hex) {
    if (!hex) return '#4a90e2';
    const clean = hex.startsWith('#') ? hex : `#${hex}`;
    return /^#[0-9A-Fa-f]{6}$/.test(clean) ? clean : '#4a90e2';
}

async function resolveTargets(interaction, opts) {
    const targets = [];

    const user = opts.getUser('usuario');
    const role = opts.getRole('rol');

    if (!user && !role) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor('#ff6b6b')
                .setTitle('❌ Faltan destinatarios')
                .setDescription('Debes indicar un **usuario** o un **rol** como destino.')
                .setTimestamp()]
        });
        return null;
    }

    if (user) {
        if (user.id === interaction.user.id) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff6b6b').setTitle('❌ Error').setDescription('No puedes enviarte un MD a ti mismo.').setTimestamp()] });
            return null;
        }
        if (user.id === PROTECTED_ID) {
            await interaction.editReply({ content: '❤️ No, ella es mi novia así que no puedes hacer eso...', flags: 64 });
            return null;
        }
        if (user.bot) {
            await interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff6b6b').setTitle('❌ Error').setDescription('No puedes enviar MDs a otros bots.').setTimestamp()] });
            return null;
        }
        targets.push(user);
    }

    if (role) {
        await interaction.guild.members.fetch();
        role.members.forEach(m => {
            if (!m.user.bot && m.id !== interaction.user.id && !targets.find(u => u.id === m.user.id)) {
                targets.push(m.user);
            }
        });
    }

    return targets;
}

async function sendToAll(targets, buildMessage, interaction, label) {
    let ok = 0, fail = 0;

    if (targets.length > 1) {
        await interaction.editReply({
            embeds: [new EmbedBuilder()
                .setColor('#ffd43b')
                .setTitle('📨 Enviando mensajes...')
                .setDescription(`Enviando a **${targets.length}** usuario(s). Espera un momento.`)
                .setTimestamp()]
        });
    }

    for (const user of targets) {
        try {
            const payload = buildMessage(user);
            await user.send(payload);
            ok++;
        } catch {
            fail++;
        }
        if (targets.length > 1) await sleep(600);
    }

    const resultEmbed = new EmbedBuilder()
        .setColor(fail === 0 ? '#51cf66' : ok === 0 ? '#ff6b6b' : '#ffd43b')
        .setTitle(fail === 0 ? '✅ Mensajes enviados' : ok === 0 ? '❌ Error al enviar' : '⚠️ Envío parcial')
        .addFields(
            { name: '📨 Tipo', value: label, inline: true },
            { name: '✅ Enviados', value: `${ok}`, inline: true },
            { name: '❌ Fallidos', value: `${fail}`, inline: true }
        )
        .setFooter({ text: fail > 0 ? 'Algunos usuarios tienen los DMs desactivados.' : 'Soledad ❣' })
        .setTimestamp();

    await interaction.editReply({ embeds: [resultEmbed] });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('md')
        .setDescription('Envía mensajes directos a usuarios o a todos los de un rol')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)

        // ── TRADICIONAL ─────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('tradicional')
            .setDescription('MD con embed completo (con info del servidor y opción anónimo)')
            .addStringOption(o => o.setName('mensaje').setDescription('Mensaje a enviar').setRequired(true).setMaxLength(1500))
            .addUserOption(o => o.setName('usuario').setDescription('Usuario destinatario').setRequired(false))
            .addRoleOption(o => o.setName('rol').setDescription('Enviar a todos los usuarios de este rol').setRequired(false))
            .addBooleanOption(o => o.setName('anonimo').setDescription('Enviar como mensaje anónimo del servidor').setRequired(false))
        )

        // ── NORMAL ──────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('normal')
            .setDescription('MD como texto simple, sin embed')
            .addStringOption(o => o.setName('mensaje').setDescription('Mensaje a enviar').setRequired(true).setMaxLength(1500))
            .addUserOption(o => o.setName('usuario').setDescription('Usuario destinatario').setRequired(false))
            .addRoleOption(o => o.setName('rol').setDescription('Enviar a todos los usuarios de este rol').setRequired(false))
        )

        // ── EMBED ───────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('embed')
            .setDescription('MD con embed personalizado (color, imagen, título)')
            .addStringOption(o => o.setName('mensaje').setDescription('Contenido / descripción del embed').setRequired(true).setMaxLength(1500))
            .addUserOption(o => o.setName('usuario').setDescription('Usuario destinatario').setRequired(false))
            .addRoleOption(o => o.setName('rol').setDescription('Enviar a todos los usuarios de este rol').setRequired(false))
            .addStringOption(o => o.setName('titulo').setDescription('Título del embed').setRequired(false).setMaxLength(256))
            .addStringOption(o => o.setName('color').setDescription('Color hex del embed (ej: FF5733)').setRequired(false).setMaxLength(7))
            .addStringOption(o => o.setName('imagen').setDescription('URL de imagen para el embed').setRequired(false))
        ),

    async execute(interaction) {
        await interaction.deferReply({ flags: 64 });

        const sub     = interaction.options.getSubcommand();
        const opts    = interaction.options;
        const mensaje = opts.getString('mensaje');

        const targets = await resolveTargets(interaction, opts);
        if (!targets) return;

        // ── TRADICIONAL ──────────────────────────────────────────────────────
        if (sub === 'tradicional') {
            const anonimo = opts.getBoolean('anonimo') ?? false;

            if (anonimo && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setColor('#ff6b6b').setTitle('❌ Sin permisos').setDescription('Solo los administradores pueden enviar mensajes anónimos.').setTimestamp()] });
            }

            await sendToAll(targets, (user) => {
                const embed = new EmbedBuilder()
                    .setColor('#4a90e2')
                    .setTitle('📩 Mensaje privado')
                    .setDescription(mensaje)
                    .addFields(
                        { name: '🏠 Servidor', value: interaction.guild.name, inline: true },
                        { name: '📅 Fecha',    value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                    )
                    .setTimestamp();

                if (anonimo) {
                    embed.setAuthor({ name: `Mensaje anónimo desde ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() ?? undefined });
                    embed.setFooter({ text: 'Mensaje anónimo • No responder a este mensaje' });
                } else {
                    embed.setAuthor({ name: `${interaction.user.displayName} desde ${interaction.guild.name}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });
                    embed.setFooter({ text: `Enviado por ${interaction.user.username} • ${interaction.guild.name}`, iconURL: interaction.guild.iconURL() ?? undefined });
                }
                return { embeds: [embed] };
            }, interaction, anonimo ? '📩 Embed anónimo' : '📩 Embed con autor');
        }

        // ── NORMAL ───────────────────────────────────────────────────────────
        if (sub === 'normal') {
            const header = `💬 **Mensaje de ${interaction.guild.name}**\n\n`;
            await sendToAll(targets, () => ({
                content: header + mensaje,
            }), interaction, '💬 Texto simple');
        }

        // ── EMBED ─────────────────────────────────────────────────────────────
        if (sub === 'embed') {
            const titulo = opts.getString('titulo') ?? null;
            const color  = parseColor(opts.getString('color'));
            const imagen = opts.getString('imagen') ?? null;

            await sendToAll(targets, () => {
                const embed = new EmbedBuilder()
                    .setColor(color)
                    .setDescription(mensaje)
                    .setFooter({ text: `${interaction.guild.name} • Mensaje del servidor`, iconURL: interaction.guild.iconURL() ?? undefined })
                    .setTimestamp();

                if (titulo) embed.setTitle(titulo);
                if (imagen)  embed.setImage(imagen);

                return { embeds: [embed] };
            }, interaction, '🎨 Embed personalizado');
        }
    },
};
