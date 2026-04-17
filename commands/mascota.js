const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require('discord.js');
const axios = require('axios');

const PETS = {
    neko: {
        nombre: 'Neko 🐱',
        descripcion: 'Gatitas mágicas del anime',
        color: '#FFB6C1',
        emoji: '🐱',
        origen: 'Nekopara, Cat Planet Cuties, Ne-ko',
        apis: [
            { url: 'https://api.waifu.pics/sfw/neko',            key: 'url'              },
            { url: 'https://nekos.best/api/v2/neko?amount=1',     key: 'results.0.url'    },
            { url: 'https://nekos.life/api/v2/img/neko',          key: 'url'              },
        ],
    },
    kitsune: {
        nombre: 'Kitsune 🦊',
        descripcion: 'Zorros de múltiples colas, espíritus mágicos',
        color: '#FF8C00',
        emoji: '🦊',
        origen: 'Sewayaki Kitsune no Senko-san, Naruto, Inuyasha',
        apis: [
            { url: 'https://nekos.best/api/v2/kitsune?amount=1',  key: 'results.0.url'    },
            { url: 'https://nekos.life/api/v2/img/foxgirl',        key: 'url'              },
            { url: 'https://api.waifu.pics/sfw/neko',              key: 'url'              },
        ],
    },
    okami: {
        nombre: 'Okami 🐺',
        descripcion: 'Chicas lobo salvajes y fieles',
        color: '#708090',
        emoji: '🐺',
        origen: 'Spice and Wolf, Wolf\'s Rain',
        apis: [
            { url: 'https://api.waifu.pics/sfw/awoo',             key: 'url'              },
            { url: 'https://nekos.best/api/v2/neko?amount=1',     key: 'results.0.url'    },
        ],
    },
    usagi: {
        nombre: 'Usagi 🐰',
        descripcion: 'Conejitas tiernas y veloces',
        color: '#FADADD',
        emoji: '🐰',
        origen: 'Is the Order a Rabbit?, Beastars, Sailor Moon',
        apis: [
            { url: 'https://nekos.life/api/v2/img/kemonomimi',    key: 'url'              },
            { url: 'https://api.waifu.pics/sfw/pat',               key: 'url'              },
            { url: 'https://nekos.best/api/v2/neko?amount=1',     key: 'results.0.url'    },
        ],
    },
    ryuu: {
        nombre: 'Ryuu 🐉',
        descripcion: 'Dragones poderosos y adorables del anime',
        color: '#8A2BE2',
        emoji: '🐉',
        origen: 'Miss Kobayashi\'s Dragon Maid, Fairy Tail',
        apis: [
            { url: 'https://nekos.life/api/v2/img/lizard',        key: 'url'              },
            { url: 'https://api.waifu.pics/sfw/dance',             key: 'url'              },
            { url: 'https://nekos.best/api/v2/kitsune?amount=1',  key: 'results.0.url'    },
        ],
    },
    kuma: {
        nombre: 'Kuma 🐻',
        descripcion: 'Osos adorables y poderosos',
        color: '#8B4513',
        emoji: '🐻',
        origen: 'Kuma Kuma Kuma Bear, Shirokuma Cafe',
        apis: [
            { url: 'https://api.waifu.pics/sfw/cuddle',           key: 'url'              },
            { url: 'https://nekos.life/api/v2/img/cuddle',        key: 'url'              },
            { url: 'https://nekos.best/api/v2/neko?amount=1',     key: 'results.0.url'    },
        ],
    },
    chocho: {
        nombre: 'Chocho 🦋',
        descripcion: 'Hadas y mariposas mágicas del anime',
        color: '#DA70D6',
        emoji: '🦋',
        origen: 'Fairy Tail, The Ancient Magus Bride',
        apis: [
            { url: 'https://api.waifu.pics/sfw/smile',            key: 'url'              },
            { url: 'https://nekos.life/api/v2/img/tickle',        key: 'url'              },
            { url: 'https://nekos.best/api/v2/neko?amount=1',     key: 'results.0.url'    },
        ],
    },
    ningyo: {
        nombre: 'Ningyo 🧜',
        descripcion: 'Sirenas y criaturas del mar del anime',
        color: '#00CED1',
        emoji: '🧜',
        origen: 'Muromi-san, Mermaid Melody, My Bride is a Mermaid',
        apis: [
            { url: 'https://api.waifu.pics/sfw/wave',             key: 'url'              },
            { url: 'https://nekos.life/api/v2/img/neko',          key: 'url'              },
            { url: 'https://nekos.best/api/v2/kitsune?amount=1',  key: 'results.0.url'    },
        ],
    },
    slime: {
        nombre: 'Slime 💚',
        descripcion: 'Slimes y criaturas mágicas del isekai',
        color: '#7CFC00',
        emoji: '💚',
        origen: 'That Time I Got Reincarnated as a Slime',
        apis: [
            { url: 'https://api.waifu.pics/sfw/nom',              key: 'url'              },
            { url: 'https://nekos.life/api/v2/img/feed',          key: 'url'              },
            { url: 'https://nekos.best/api/v2/neko?amount=1',     key: 'results.0.url'    },
        ],
    },
    tanuki: {
        nombre: 'Tanuki 🦝',
        descripcion: 'Mapaches mágicos del folklore japonés',
        color: '#D2691E',
        emoji: '🦝',
        origen: 'Uchouten Kazoku, Pom Poko',
        apis: [
            { url: 'https://api.waifu.pics/sfw/wink',             key: 'url'              },
            { url: 'https://nekos.life/api/v2/img/kemonomimi',    key: 'url'              },
            { url: 'https://nekos.best/api/v2/kitsune?amount=1',  key: 'results.0.url'    },
        ],
    },
};

function getNestedValue(obj, path) {
    return path.split('.').reduce((acc, part) => {
        if (acc === null || acc === undefined) return undefined;
        return isNaN(part) ? acc[part] : acc[parseInt(part)];
    }, obj);
}

async function fetchGif(pet) {
    for (const api of pet.apis) {
        try {
            const res = await axios.get(api.url, {
                timeout: 8000,
                headers: { 'User-Agent': 'SoledadBot/1.0' },
            });
            const url = getNestedValue(res.data, api.key);
            if (url && typeof url === 'string' && url.startsWith('http')) return url;
        } catch {}
    }
    return null;
}

function buildSelectMenu(sessionId) {
    const options = Object.entries(PETS).map(([key, p]) => ({
        label: p.nombre,
        description: p.descripcion.slice(0, 50),
        value: key,
        emoji: p.emoji,
    }));
    return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
            .setCustomId(`pet_select_${sessionId}`)
            .setPlaceholder('🐾 Elige tu mascota favorita...')
            .addOptions(options)
    );
}

function buildMenuEmbed() {
    const lista = Object.values(PETS)
        .map(p => `${p.emoji} **${p.nombre}** — ${p.descripcion}`)
        .join('\n');
    return new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('🐾 Mascotas del Anime')
        .setDescription(`¡Elige tu mascota favorita del menú de abajo!\n\n${lista}`)
        .setFooter({ text: 'Soledad ❣ — Mascotas' })
        .setTimestamp();
}

async function showPet(interaction, key) {
    const pet = PETS[key];
    if (!pet) return;

    const loadEmbed = new EmbedBuilder()
        .setColor(pet.color)
        .setTitle(`${pet.emoji} ${pet.nombre}`)
        .setDescription('⏳ Cargando GIF...')
        .setFooter({ text: 'Soledad ❣ — Mascotas' });

    await interaction.editReply({ embeds: [loadEmbed], components: [] });

    const gifUrl = await fetchGif(pet);

    const newRow = buildSelectMenu(`${interaction.user.id}_${Date.now()}`);

    if (!gifUrl) {
        const errEmbed = new EmbedBuilder()
            .setColor('#ED4245')
            .setTitle('❌ No se encontró GIF')
            .setDescription('No pude cargar el GIF ahora. ¡Intenta de nuevo!')
            .setFooter({ text: 'Soledad ❣ — Mascotas' });
        await interaction.editReply({ embeds: [errEmbed], components: [newRow] });
        return newRow;
    }

    const petEmbed = new EmbedBuilder()
        .setColor(pet.color)
        .setTitle(`${pet.emoji} ${pet.nombre}`)
        .setDescription(`*${pet.descripcion}*\n\n📺 **Origen:** ${pet.origen}`)
        .setImage(gifUrl)
        .setFooter({ text: 'Soledad ❣ — Mascotas • Elige otra del menú' })
        .setTimestamp();

    await interaction.editReply({ embeds: [petEmbed], components: [newRow] });
    return newRow;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mascota')
        .setDescription('Muestra un GIF de tu mascota de anime favorita'),

    async execute(interaction) {
        await interaction.deferReply();

        const sessionId = `${interaction.user.id}_${Date.now()}`;
        const msg = await interaction.editReply({
            embeds: [buildMenuEmbed()],
            components: [buildSelectMenu(sessionId)],
        });

        const handleCollector = (message) => {
            const collector = message.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 90000,
            });

            collector.on('collect', async (sel) => {
                await sel.deferUpdate().catch(() => {});
                collector.stop('selected');
                const key = sel.values[0];
                await showPet(interaction, key);

                const newMsg = await interaction.fetchReply().catch(() => null);
                if (newMsg) handleCollector(newMsg);
            });

            collector.on('end', async (_, reason) => {
                if (reason === 'time') {
                    await interaction.editReply({ components: [] }).catch(() => {});
                }
            });
        };

        handleCollector(msg);
    },
};
