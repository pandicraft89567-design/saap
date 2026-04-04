const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Jimp = require('jimp');

const FILTER_NAMES = {
    greyscale:  'Escala de grises',
    invert:     'Colores invertidos',
    sepia:      'Sepia',
    blur:       'Desenfoque',
    pixelate:   'Pixelado',
    posterize:  'Posterizado',
    brightness: 'Brillo aumentado',
    contrast:   'Alto contraste',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('imagen')
        .setNameLocalizations({ 'en-US': 'image', 'en-GB': 'image' })
        .setDescription('Aplica efectos visuales al avatar de alguien')
        .setDescriptionLocalizations({ 'en-US': "Apply visual effects to someone's avatar", 'en-GB': "Apply visual effects to someone's avatar" })
        .addStringOption(option =>
            option.setName('efecto')
                .setNameLocalizations({ 'en-US': 'effect', 'en-GB': 'effect' })
                .setDescription('Efecto visual a aplicar')
                .setDescriptionLocalizations({ 'en-US': 'Visual effect to apply', 'en-GB': 'Visual effect to apply' })
                .setRequired(true)
                .addChoices(
                    { name: '⬛ Escala de grises',   value: 'greyscale'  },
                    { name: '🔄 Colores invertidos', value: 'invert'     },
                    { name: '🟤 Sepia',              value: 'sepia'      },
                    { name: '🌫️ Desenfoque',         value: 'blur'       },
                    { name: '🟦 Pixelado',           value: 'pixelate'   },
                    { name: '🎨 Posterizado',        value: 'posterize'  },
                    { name: '☀️ Brillo aumentado',   value: 'brightness' },
                    { name: '⚡ Alto contraste',     value: 'contrast'   }
                ))
        .addUserOption(option =>
            option.setName('miembro')
                .setNameLocalizations({ 'en-US': 'member', 'en-GB': 'member' })
                .setDescription('Miembro del servidor (opcional, por defecto tú mismo)')
                .setDescriptionLocalizations({ 'en-US': 'Server member (optional, defaults to yourself)', 'en-GB': 'Server member (optional, defaults to yourself)' })
        ),

    async execute(interaction) {
        try { await interaction.deferReply(); } catch { return; }

        const targetUser = interaction.options.getUser('miembro') || interaction.user;
        const effectType = interaction.options.getString('efecto');
        const avatarUrl  = targetUser.displayAvatarURL({ extension: 'png', size: 512 });

        try {
            const image = await Jimp.read(avatarUrl);

            switch (effectType) {
                case 'greyscale':  image.greyscale();      break;
                case 'invert':     image.invert();         break;
                case 'sepia':      image.sepia();          break;
                case 'blur':       image.blur(5);          break;
                case 'pixelate':   image.pixelate(10);     break;
                case 'posterize':  image.posterize(5);     break;
                case 'brightness': image.brightness(0.5);  break;
                case 'contrast':   image.contrast(0.7);    break;
            }

            const buffer     = await image.getBufferAsync(Jimp.MIME_PNG);
            const attachment = new AttachmentBuilder(buffer, { name: 'imagen.png' });

            const embed = new EmbedBuilder()
                .setTitle(`🎨 Efecto: ${FILTER_NAMES[effectType]}`)
                .setDescription(`> Avatar de **${targetUser.displayName || targetUser.username}**`)
                .setImage('attachment://imagen.png')
                .setColor('#FF69B4')
                .setFooter({ text: `Soledad ❣ • Pedido por ${interaction.user.username}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });

        } catch (error) {
            console.error('Error en /imagen:', error);
            await interaction.editReply({ content: '❌ No pude procesar la imagen. Inténtalo de nuevo.' });
        }
    },
};
