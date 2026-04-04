const { pgTable, varchar } = require('drizzle-orm/pg-core');

const guildSettings = pgTable('guild_settings', {
    guildId: varchar('guild_id', { length: 255 }).primaryKey(),
    language: varchar('language', { length: 5 }).default('es'),
    welcomeChannelId: varchar('welcome_channel_id', { length: 255 }),
});

module.exports = { guildSettings };