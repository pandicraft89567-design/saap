module.exports = {
    token: process.env.NEW_DISCORD_TOKEN || process.env.DISCORD_TOKEN || 'tu_token_aqui',
    clientId: process.env.NEW_CLIENT_ID || process.env.CLIENT_ID || 'tu_client_id_aqui',
    
    // Configuración de APIs
    apis: {
        meme: 'https://meme-api.com/gimme',
        anime: 'https://api.waifu.pics/sfw',
        backup_meme: 'https://api.imgflip.com/get_memes'
    },
    
    // Mensajes de bienvenida
    welcomeMessages: [
        '¡Bienvenido/a {user} al servidor! 🎉',
        '¡Hola {user}! Esperamos que disfrutes tu estadía aquí 😊',
        '¡Un nuevo miembro ha llegado! Bienvenido/a {user} 🌟',
        '¡{user} se ha unido a la aventura! ¡Bienvenido/a! 🚀',
        '¡Saludos {user}! Que tengas una gran experiencia en el servidor 💫'
    ],
    
    // Mensajes de bienvenida para bots
    botWelcomeMessages: [
        '¡Un nuevo bot {user} se ha unido para ayudar! 🤖',
        '¡Bienvenido bot {user}! Esperamos que seas útil 🔧',
        '{user} ha sido añadido como bot del servidor 🛠️',
        '¡Nuevo asistente digital! Bienvenido {user} ⚡',
        '{user} está listo para servir al servidor 🚀'
    ],
    
    // Configuración de colores para embeds
    colors: {
        primary: '#7289DA',
        success: '#57F287',
        warning: '#FEE75C',
        error: '#ED4245',
        anime: '#FF69B4',
        meme: '#FFA500'
    }
};
