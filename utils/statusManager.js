const { ActivityType } = require('discord.js');

// Rotaciones de estado por fase (cada 30 s = 2 min por fase)
const ROTATIONS_PER_PHASE = 4;

// Fases del ciclo de dispositivo:
//   0 = 📱 móvil  + online
//   1 = 🟢 normal + online
//   2 = 🌙 normal + idle
const PHASES = ['mobile-online', 'desktop-online', 'desktop-idle'];

class StatusManager {
    constructor(client) {
        this.client = client;
        this.statusInterval = null;
        this.currentStatusIndex = 0;  // índice dentro de statusMessages
        this.rotationCount = 0;       // cuántas rotaciones en la fase actual
        this.phaseIndex = 0;          // índice en PHASES
        this.statusMessages = [];
    }

    initialize() {
        this.updateStatusMessages();
        this.startStatusRotation();
        console.log('✅ Sistema de estado dinámico iniciado (📱 → 🟢 → 🌙)');
    }

    updateStatusMessages() {
        const guildCount   = this.client.guilds.cache.size;
        const userCount    = this.client.guilds.cache.reduce((acc, g) => acc + g.memberCount, 0);
        const channelCount = this.client.channels.cache.size;

        this.statusMessages = [
            { name: `${guildCount} servidor${guildCount !== 1 ? 'es' : ''}`, type: ActivityType.Watching },
            { name: `Shivers · Ed Sheeran`,                                   type: ActivityType.Listening },
            { name: `memes y anime`,                                          type: ActivityType.Playing },
            { name: `/ayuda para comandos`,                                   type: ActivityType.Playing },
            { name: `${channelCount} canal${channelCount !== 1 ? 'es' : ''}`, type: ActivityType.Watching },
            { name: `Shivers · Ed Sheeran`,                                   type: ActivityType.Listening },
            { name: `${userCount} usuario${userCount !== 1 ? 's' : ''}`,      type: ActivityType.Watching },
            { name: `abrazos virtuales`,                                      type: ActivityType.Playing },
        ];

        console.log(`📊 Estados actualizados: ${guildCount} servidores, ${userCount} usuarios`);
    }

    startStatusRotation() {
        this.setNextStatus();
        this.statusInterval = setInterval(() => this.setNextStatus(), 30_000);
    }

    /** Devuelve el presenceStatus y si necesitamos pedir reconexión */
    _currentPhase() {
        return PHASES[this.phaseIndex];
    }

    async setNextStatus() {
        if (this.statusMessages.length === 0) this.updateStatusMessages();

        const phase  = this._currentPhase();
        const status = this.statusMessages[this.currentStatusIndex];

        // Determinar el estado de presencia según la fase
        const presenceStatus = phase === 'desktop-idle' ? 'idle' : 'online';

        try {
            this.client.user.setPresence({
                status: presenceStatus,
                activities: [{ name: status.name, type: status.type }],
            });
        } catch (_) { /* el cliente puede no estar listo aún */ }

        const icon = phase === 'mobile-online' ? '📱' : phase === 'desktop-online' ? '🟢' : '🌙';
        console.log(`🔄 [${icon}] ${presenceStatus.toUpperCase()}: ${this.getActivityTypeName(status.type)} ${status.name}`);

        // Avanzar índice de mensaje
        this.currentStatusIndex = (this.currentStatusIndex + 1) % this.statusMessages.length;

        // Avanzar fase cada ROTATIONS_PER_PHASE rotaciones
        this.rotationCount++;
        if (this.rotationCount >= ROTATIONS_PER_PHASE) {
            this.rotationCount = 0;
            const prevPhase = this._currentPhase();
            this.phaseIndex = (this.phaseIndex + 1) % PHASES.length;
            const nextPhase = this._currentPhase();
            await this._onPhaseChange(prevPhase, nextPhase);
        }
    }

    async _onPhaseChange(from, to) {
        console.log(`🔁 Cambiando fase: ${from} → ${to}`);

        // Reconectar solo cuando cambia el tipo de dispositivo (móvil ↔ escritorio)
        const wasM = from === 'mobile-online';
        const isM  = to   === 'mobile-online';

        if (wasM !== isM) {
            await global.switchDeviceMode?.(this.client, isM);
        }
    }

    onGuildUpdate() {
        console.log('🔄 Actualizando estados por cambio en servidores...');
        this.updateStatusMessages();
    }

    stop() {
        if (this.statusInterval) {
            clearInterval(this.statusInterval);
            this.statusInterval = null;
            console.log('⏹️ Sistema de estado dinámico detenido');
        }
    }

    getActivityTypeName(type) {
        switch (type) {
            case ActivityType.Playing:   return 'Jugando';
            case ActivityType.Streaming: return 'Transmitiendo';
            case ActivityType.Listening: return 'Escuchando';
            case ActivityType.Watching:  return 'Viendo';
            case ActivityType.Competing: return 'Compitiendo';
            default:                     return 'Desconocido';
        }
    }

    setCustomStatus(message, type = ActivityType.Playing, duration = null) {
        this.client.user.setPresence({
            status: 'online',
            activities: [{ name: message, type }],
        });
        console.log(`🎯 Estado personalizado: ${this.getActivityTypeName(type)} ${message}`);
        if (duration) setTimeout(() => this.setNextStatus(), duration);
    }

    getStats() {
        return {
            guilds:   this.client.guilds.cache.size,
            users:    this.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0),
            channels: this.client.channels.cache.size,
            uptime:   process.uptime(),
        };
    }
}

module.exports = StatusManager;
