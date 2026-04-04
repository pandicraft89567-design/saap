const clientId = process.env.CLIENT_ID;

console.log('=== INFORMACIÓN DE INVITACIÓN DEL BOT ===');
console.log(`Client ID: ${clientId}`);
console.log('');

// Enlace con permisos básicos y comandos slash
const basicUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=2147483647&scope=bot%20applications.commands`;
console.log('ENLACE DE INVITACIÓN (Básico):');
console.log(basicUrl);
console.log('');

// Enlace solo con comandos slash (mínimo)
const minimalUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&scope=applications.commands`;
console.log('ENLACE DE INVITACIÓN (Solo comandos):');
console.log(minimalUrl);
console.log('');

console.log('INSTRUCCIONES:');
console.log('1. Expulsa el bot actual del servidor');
console.log('2. Usa el enlace básico para invitarlo nuevamente');
console.log('3. Si no funciona, prueba el enlace mínimo');
console.log('4. Asegúrate de que en Discord Developer Portal:');
console.log('   - La aplicación tenga Bot habilitado');
console.log('   - Slash Commands esté habilitado');
console.log('   - El token sea regenerado si es necesario');