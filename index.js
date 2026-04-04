// Cargar variables de entorno desde .env (necesario fuera de Replit)
require('dotenv').config();

// ── PARCHE MÓVIL: debe ejecutarse ANTES de require('discord.js') ──────────────
// Parcheamos @discordjs/ws en caché para que discord.js use nuestro manager
// que lee global.BOT_IS_MOBILE y pasa los identifyProperties correctos.
{
    global.BOT_IS_MOBILE = true; // Empieza en modo móvil 📱

    const dws    = require('@discordjs/ws');
    const OrigWS = dws.WebSocketManager;

    class MobileAwareWSManager extends OrigWS {
        constructor(options) {
            super({
                ...options,
                identifyProperties: global.BOT_IS_MOBILE
                    ? { browser: 'Discord iOS', device: 'Discord iOS', os: 'iOS' }
                    : { browser: 'discord.js',  device: 'discord.js',  os: process.platform },
            });
        }
    }

    // Función global para cambiar de modo y reconectar
    global.switchDeviceMode = async (client, mobile) => {
        global.BOT_IS_MOBILE = mobile;
        const wsManager = client?.ws?._ws;
        if (!wsManager) return;

        wsManager.options.identifyProperties = mobile
            ? { browser: 'Discord iOS', device: 'Discord iOS', os: 'iOS' }
            : { browser: 'discord.js',  device: 'discord.js',  os: process.platform };

        try {
            await wsManager.destroy({ code: 1000 });
            await wsManager.connect();
            console.log(`🔄 Modo dispositivo → ${mobile ? '📱 Móvil' : '🖥️ Escritorio'}`);
        } catch (e) {
            console.error('Error al cambiar modo de dispositivo:', e.message);
        }
    };

    const cached = require.cache[require.resolve('@discordjs/ws')];
    if (cached) cached.exports = { ...dws, WebSocketManager: MobileAwareWSManager };
}
// ─────────────────────────────────────────────────────────────────────────────

const { Client, GatewayIntentBits, Collection } = require("discord.js");
const fs = require("fs");
const path = require("path");
const config = require("./config");
const { Client: PgClient } = require("pg");

async function initDatabase() {
    const db = new PgClient({ connectionString: process.env.DATABASE_URL });
    await db.connect();
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS economy (
                user_id VARCHAR(30) PRIMARY KEY,
                balance INTEGER NOT NULL DEFAULT 0,
                last_daily TIMESTAMP,
                last_work TIMESTAMP,
                bio TEXT,
                premium_until TIMESTAMP
            )
        `);
        await db.query(`ALTER TABLE economy ADD COLUMN IF NOT EXISTS bio TEXT`);
        await db.query(`ALTER TABLE economy ADD COLUMN IF NOT EXISTS premium_until TIMESTAMP`);
        await db.query(`ALTER TABLE economy ADD COLUMN IF NOT EXISTS last_work TIMESTAMP`);
        await db.query(`ALTER TABLE economy ADD COLUMN IF NOT EXISTS solecoins_diamante INTEGER DEFAULT 0`);
        await db.query(`ALTER TABLE economy ADD COLUMN IF NOT EXISTS solecoins_ultra INTEGER DEFAULT 0`);
        await db.query(`ALTER TABLE economy ADD COLUMN IF NOT EXISTS last_horoscopo DATE`);
        await db.query(`
            INSERT INTO economy (user_id, balance, solecoins_diamante, solecoins_ultra)
            VALUES ('738425516155076629', 2147483647, 2147483647, 2147483647)
            ON CONFLICT (user_id) DO UPDATE SET
                balance = 2147483647,
                solecoins_diamante = 2147483647,
                solecoins_ultra = 2147483647
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS server_ads (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(30) NOT NULL,
                server_name VARCHAR(100),
                description TEXT,
                invite_url TEXT NOT NULL,
                expires_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `);
        await db.query(`
            CREATE TABLE IF NOT EXISTS guild_settings (
                guild_id VARCHAR(30) PRIMARY KEY,
                language VARCHAR(10) NOT NULL DEFAULT 'es',
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `);
        console.log("✅ Base de datos inicializada correctamente.");
    } catch (err) {
        console.error("❌ Error al inicializar la base de datos:", err.message);
    } finally {
        await db.end();
    }
}

initDatabase();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildEmojisAndStickers,
    ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Comando cargado: ${command.data.name}`);
    } else {
        console.log(`⚠️ El comando en ${file} no tiene la estructura requerida.`);
    }
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event.once) {
        client.once(event.name, (...args) => {
            console.log(`🔥 Evento ejecutado (once): ${event.name}`);
            event.execute(...args);
        });
    } else {
        client.on(event.name, (...args) => {
            console.log(`🔥 Evento ejecutado: ${event.name}`);
            event.execute(...args);
        });
    }
    console.log(`✅ Evento cargado: ${event.name}`);
}

process.on("unhandledRejection", (error) => {
    console.error("Error no manejado:", error);
});

client.login(config.token);
