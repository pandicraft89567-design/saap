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
        origen: 'Muchos animes: Nekopara, Cat Planet Cuties, etc.',
        fuente: 'api',
        endpoints: [
            { tipo: 'waifu', url: 'https://api.waifu.pics/sfw/neko' },
            { tipo: 'nekos', url: 'https://nekos.best/api/v2/neko?amount=1' },
        ],
    },
    kitsune: {
        nombre: 'Kitsune 🦊',
        descripcion: 'Zorros de múltiples colas, espíritus mágicos',
        color: '#FF8C00',
        emoji: '🦊',
        origen: 'Naruto, Inuyasha, Sewayaki Kitsune no Senko-san',
        fuente: 'api',
        endpoints: [
            { tipo: 'nekos', url: 'https://nekos.best/api/v2/kitsune?amount=1' },
            { tipo: 'waifu', url: 'https://api.waifu.pics/sfw/neko' },
        ],
    },
    okami: {
        nombre: 'Okami 🐺',
        descripcion: 'Chicas lobo salvajes y fieles',
        color: '#708090',
        emoji: '🐺',
        origen: 'Spice and Wolf, Wolf\'s Rain, Ookami to Koushinryou',
        fuente: 'api',
        endpoints: [
            { tipo: 'waifu', url: 'https://api.waifu.pics/sfw/awoo' },
            { tipo: 'nekos', url: 'https://nekos.best/api/v2/neko?amount=1' },
        ],
    },
    usagi: {
        nombre: 'Usagi 🐰',
        descripcion: 'Conejitas tiernas y veloces',
        color: '#FADADD',
        emoji: '🐰',
        origen: 'Is the Order a Rabbit?, Beastars, Sailor Moon',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/0wnJeicOO04AAAAC/anime-bunny.gif',
            'https://media1.tenor.com/m/I7jnOJUcpAQAAAAC/cocoa-hoto.gif',
            'https://media1.tenor.com/m/kT3TQlVOz-UAAAAC/bunny-girl.gif',
            'https://media1.tenor.com/m/RV5aVBXlMacAAAAC/anime-rabbit.gif',
            'https://media1.tenor.com/m/9SJk7OT4eCIAAAAC/is-the-order-a-rabbit.gif',
            'https://media1.tenor.com/m/5J1jdqVnr8oAAAAC/rabbit-anime.gif',
            'https://media1.tenor.com/m/oOk9WNpX9oEAAAAC/usagi-bunny.gif',
            'https://media1.tenor.com/m/r7gk93q9SQUAAAAC/anime-cute.gif',
        ],
    },
    ryuu: {
        nombre: 'Ryuu 🐉',
        descripcion: 'Dragones poderosos y adorables del anime',
        color: '#8A2BE2',
        emoji: '🐉',
        origen: 'Miss Kobayashi\'s Dragon Maid, Fairy Tail, Dragon Ball',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/bsVMKalDQjEAAAAC/dragon-maid-kanna.gif',
            'https://media1.tenor.com/m/nSLqxGvvklEAAAAC/kanna-dragon-maid.gif',
            'https://media1.tenor.com/m/E7ZhAMl8BJIAAAAC/kobayashi-dragon.gif',
            'https://media1.tenor.com/m/BkxC9eXlH5YAAAAC/anime-dragon.gif',
            'https://media1.tenor.com/m/YRLmwxVb4ncAAAAC/dragon-cute.gif',
            'https://media1.tenor.com/m/JjzMr2lVfM4AAAAC/kanna-kamui-dragon.gif',
            'https://media1.tenor.com/m/VQgbg_yKcQ4AAAAC/tohru-dragon-maid.gif',
            'https://media1.tenor.com/m/dRRiMT9Dw0AAAAAC/dragon-maid-anime.gif',
        ],
    },
    kuma: {
        nombre: 'Kuma 🐻',
        descripcion: 'Osos adorables y poderosos',
        color: '#8B4513',
        emoji: '🐻',
        origen: 'Kuma Kuma Kuma Bear, Shirokuma Cafe, Polar Bear Cafe',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/Xx1hfBgUSoIAAAAC/kuma-bear-anime.gif',
            'https://media1.tenor.com/m/3xNgkAJLZGMAAAAC/yuna-kuma-bear.gif',
            'https://media1.tenor.com/m/9BKN9r8WKCAAAAAC/kuma-anime-bear.gif',
            'https://media1.tenor.com/m/j8LJKoVyoUoAAAAC/shirokuma-polar-bear.gif',
            'https://media1.tenor.com/m/cqkT7SWbwsAAAAC/anime-bear-cute.gif',
            'https://media1.tenor.com/m/f8Lx6JJibLQAAAAC/bear-hug-anime.gif',
            'https://media1.tenor.com/m/k7v6Nb82PuoAAAAC/kuma-kuma-bear.gif',
            'https://media1.tenor.com/m/YJhfMEqSmKEAAAAC/bear-anime.gif',
        ],
    },
    chocho: {
        nombre: 'Chocho 🦋',
        descripcion: 'Hadas y mariposas mágicas del anime',
        color: '#DA70D6',
        emoji: '🦋',
        origen: 'Fairy Tail, The Ancient Magus Bride, Moribito',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/0QvhH3JFdaYAAAAC/fairy-tail-anime.gif',
            'https://media1.tenor.com/m/gXB3Wt5MsCMAAAAC/anime-fairy.gif',
            'https://media1.tenor.com/m/Gyx0M5QXAVMAAAAC/butterfly-anime.gif',
            'https://media1.tenor.com/m/n3UB-2cxq-YAAAAC/mahou-shoujo-magical.gif',
            'https://media1.tenor.com/m/KE0KYxNdj7QAAAAC/anime-wings-fairy.gif',
            'https://media1.tenor.com/m/cJGJUSmjMfoAAAAC/fairy-magical-anime.gif',
            'https://media1.tenor.com/m/fDv68M5Sz0MAAAAC/anime-butterfly.gif',
            'https://media1.tenor.com/m/EWrEq0pINJkAAAAC/fairy-tail-magic.gif',
        ],
    },
    sakana: {
        nombre: 'Ningyo 🧜',
        descripcion: 'Sirenas y criaturas del mar del anime',
        color: '#00CED1',
        emoji: '🧜',
        origen: 'Muromi-san, Mermaid Melody, My Bride is a Mermaid',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/V7FHt0wqeKUAAAAC/mermaid-anime.gif',
            'https://media1.tenor.com/m/k_OG0GAbfGQAAAAC/mermaid-melody-anime.gif',
            'https://media1.tenor.com/m/V6MGVXX0C9AAAAAC/anime-mermaid.gif',
            'https://media1.tenor.com/m/fW_8m-yjP2kAAAAC/seto-no-hanayome-mermaid.gif',
            'https://media1.tenor.com/m/xKh6CW4VdbUAAAAC/anime-water-sea.gif',
            'https://media1.tenor.com/m/dVWvwF8KLHAAAAAC/mermaid-princess-anime.gif',
            'https://media1.tenor.com/m/2U37AMLPN2cAAAAC/anime-girl-ocean.gif',
            'https://media1.tenor.com/m/vBX8EUC-Z9AAAAAC/ningyo-anime-mermaid.gif',
        ],
    },
    slime: {
        nombre: 'Slime 💚',
        descripcion: 'Slimes y criaturas mágicas del isekai',
        color: '#7CFC00',
        emoji: '💚',
        origen: 'That Time I Got Reincarnated as a Slime, Dragon Quest',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/kI0ik7l3C5oAAAAC/rimuru-tempest-slime.gif',
            'https://media1.tenor.com/m/aYqzqDLz8NQAAAAC/tensura-rimuru.gif',
            'https://media1.tenor.com/m/2vxT8UM1GcEAAAAC/slime-anime-rimuru.gif',
            'https://media1.tenor.com/m/0EqYzJLSuswAAAAC/rimuru-slime-isekai.gif',
            'https://media1.tenor.com/m/aU4gGpnmf3QAAAAC/tensura-slime-rimuru.gif',
            'https://media1.tenor.com/m/lhZLJAkVdQcAAAAC/slime-cute-anime.gif',
            'https://media1.tenor.com/m/lPg1lA7MlYsAAAAC/rimuru-cute-slime.gif',
            'https://media1.tenor.com/m/Xu-e3lkgFrYAAAAC/anime-slime-rimuru-tempest.gif',
        ],
    },
    tanuki: {
        nombre: 'Tanuki 🦝',
        descripcion: 'Mapaches mágicos del folklore japonés',
        color: '#D2691E',
        emoji: '🦝',
        origen: 'Uchouten Kazoku, Pom Poko, folklore japonés',
        fuente: 'pool',
        pool: [
            'https://media1.tenor.com/m/a_OqnhBRxLAAAAAC/tanuki-anime.gif',
            'https://media1.tenor.com/m/Y_GjcRMIoDoAAAAC/raccoon-anime-cute.gif',
            'https://media1.tenor.com/m/8WQIUI4ePF4AAAAC/uchouten-kazoku-tanuki.gif',
            'https://media1.tenor.com/m/pVTtLLdqJGMAAAAC/raccoon-dog-anime.gif',
            'https://media1.tenor.com/m/QMxhlJkVeMgAAAAC/tanuki-magical-anime.gif',
            'https://media1.tenor.com/m/A13QWWzCu6YAAAAC/anime-raccoon.gif',
            'https://media1.tenor.com/m/1vU6mHOj95YAAAAC/tanuki-cute.gif',
            'https://media1.tenor.com/m/yYJXHRMzEj4AAAAC/pom-poko-tanuki.gif',
        ],
    },
};

async function fetchGif(pet) {
    if (pet.fuente === 'pool') {
        const idx = Math.floor(Math.random() * pet.pool.length);
        return pet.pool[idx];
    }

    for (const ep of pet.endpoints) {
        try {
            const res = await axios.get(ep.url, {
                timeout: 8000,
                headers: { 'User-Agent': 'SoledadBot/1.0' },
            });
            if (ep.tipo === 'waifu' && res.data?.url) return res.data.url;
            if (ep.tipo === 'nekos' && res.data?.results?.[0]?.url) return res.data.results[0].url;
        } catch {}
    }

    if (pet.pool) {
        return pet.pool[Math.floor(Math.random() * pet.pool.length)];
    }
    return null;
}

function buildSelectMenu(sessionId) {
    const options = Object.entries(PETS).map(([key, p]) => ({
        label: p.nombre,
        description: p.descripcion,
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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mascota')
        .setDescription('Muestra un GIF de tu mascota de anime favorita'),

    async execute(interaction) {
        await interaction.deferReply();

        const sessionId = `${interaction.user.id}_${Date.now()}`;
        const menuEmbed = buildMenuEmbed();
        const selectRow = buildSelectMenu(sessionId);

        const msg = await interaction.editReply({ embeds: [menuEmbed], components: [selectRow] });

        const collector = msg.createMessageComponentCollector({
            filter: i => i.user.id === interaction.user.id,
            time: 60000,
        });

        collector.on('collect', async (sel) => {
            await sel.deferUpdate().catch(() => {});

            const key = sel.values[0];
            const pet = PETS[key];
            if (!pet) return;

            const loadEmbed = new EmbedBuilder()
                .setColor(pet.color)
                .setTitle(`${pet.emoji} ${pet.nombre}`)
                .setDescription('⏳ Buscando GIF...')
                .setFooter({ text: 'Soledad ❣ — Mascotas' });

            await interaction.editReply({ embeds: [loadEmbed], components: [] });

            const gifUrl = await fetchGif(pet);

            if (!gifUrl) {
                const errEmbed = new EmbedBuilder()
                    .setColor('#ED4245')
                    .setTitle('❌ Error')
                    .setDescription('No pude encontrar un GIF ahora. Intenta de nuevo.')
                    .setFooter({ text: 'Soledad ❣ — Mascotas' });
                return interaction.editReply({ embeds: [errEmbed], components: [selectRow] });
            }

            const petEmbed = new EmbedBuilder()
                .setColor(pet.color)
                .setTitle(`${pet.emoji} ${pet.nombre}`)
                .setDescription(`*${pet.descripcion}*\n\n📺 **Origen:** ${pet.origen}`)
                .setImage(gifUrl)
                .setFooter({ text: `Soledad ❣ — Mascotas • Usa /mascota para elegir otra` })
                .setTimestamp();

            const newRow = buildSelectMenu(`${interaction.user.id}_${Date.now()}`);
            await interaction.editReply({ embeds: [petEmbed], components: [newRow] });

            collector.stop();

            const msg2 = await interaction.fetchReply();
            const collector2 = msg2.createMessageComponentCollector({
                filter: i => i.user.id === interaction.user.id,
                time: 60000,
            });

            collector2.on('collect', async (sel2) => {
                await sel2.deferUpdate().catch(() => {});
                const key2 = sel2.values[0];
                const pet2 = PETS[key2];
                if (!pet2) return;

                const gifUrl2 = await fetchGif(pet2);
                if (!gifUrl2) return;

                const embed2 = new EmbedBuilder()
                    .setColor(pet2.color)
                    .setTitle(`${pet2.emoji} ${pet2.nombre}`)
                    .setDescription(`*${pet2.descripcion}*\n\n📺 **Origen:** ${pet2.origen}`)
                    .setImage(gifUrl2)
                    .setFooter({ text: `Soledad ❣ — Mascotas • Usa /mascota para elegir otra` })
                    .setTimestamp();

                const newRow2 = buildSelectMenu(`${interaction.user.id}_${Date.now()}`);
                await interaction.editReply({ embeds: [embed2], components: [newRow2] });

                collector2.resetTimer();
            });

            collector2.on('end', async (_, reason) => {
                if (reason === 'time') {
                    await interaction.editReply({ components: [] }).catch(() => {});
                }
            });
        });

        collector.on('end', async (_, reason) => {
            if (reason === 'time') {
                await interaction.editReply({ components: [] }).catch(() => {});
            }
        });
    },
};
