const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// ── Evaluador de matemáticas seguro (sin eval) ────────────────────────────
function safeMath(expr) {
    const clean = expr.replace(/\s+/g, '').replace(/[^0-9+\-*/.()%^]/g, '');
    if (!clean) throw new Error('Expresión vacía');
    if (clean.length > 200) throw new Error('Expresión demasiado larga');
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${clean.replace(/\^/g, '**')})`)();
    if (!isFinite(result)) throw new Error('Resultado inválido');
    return result;
}

// ── Generador de contraseña ────────────────────────────────────────────────
function generatePassword(length, upper, numbers, symbols) {
    const lower   = 'abcdefghijklmnopqrstuvwxyz';
    const up      = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums    = '0123456789';
    const syms    = '!@#$%^&*()_+-=[]{}|;:,.<>?';

    let pool = lower;
    if (upper)   pool += up;
    if (numbers) pool += nums;
    if (symbols) pool += syms;

    let password = '';
    for (let i = 0; i < length; i++) {
        password += pool[Math.floor(Math.random() * pool.length)];
    }
    return password;
}

// ── Formatos de timestamp de Discord ─────────────────────────────────────
const TS_FORMATS = {
    corta:    { flag: 't', label: 'Hora corta',    example: '16:20'                  },
    larga:    { flag: 'T', label: 'Hora larga',    example: '16:20:30'               },
    fecha:    { flag: 'd', label: 'Fecha corta',   example: '20/04/2021'             },
    fechalarga: { flag: 'D', label: 'Fecha larga', example: '20 de abril de 2021'    },
    completo: { flag: 'f', label: 'Fecha y hora',  example: '20 de abril de 2021 16:20' },
    relativo: { flag: 'R', label: 'Relativo',      example: 'hace 2 meses'           },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('herramientas')
        .setDescription('Herramientas útiles: calculadora, contraseñas, timestamps y más')

        // ── calcular ───────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('calcular')
            .setDescription('Calcula una expresión matemática')
            .addStringOption(opt => opt
                .setName('expresion')
                .setDescription('Ej: (25 * 4) + 100 / 2, 2^10, 15 % 4')
                .setRequired(true)
            )
        )

        // ── password ───────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('password')
            .setDescription('Genera una contraseña segura aleatoria')
            .addIntegerOption(opt => opt
                .setName('longitud')
                .setDescription('Número de caracteres (4–64, por defecto 16)')
                .setMinValue(4).setMaxValue(64)
                .setRequired(false)
            )
            .addBooleanOption(opt => opt
                .setName('mayusculas')
                .setDescription('Incluir letras mayúsculas (por defecto: sí)')
                .setRequired(false)
            )
            .addBooleanOption(opt => opt
                .setName('numeros')
                .setDescription('Incluir números (por defecto: sí)')
                .setRequired(false)
            )
            .addBooleanOption(opt => opt
                .setName('simbolos')
                .setDescription('Incluir símbolos !@#$... (por defecto: no)')
                .setRequired(false)
            )
        )

        // ── timestamp ──────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('timestamp')
            .setDescription('Convierte una fecha a formato de Discord (<t:...>)')
            .addStringOption(opt => opt
                .setName('fecha')
                .setDescription('Fecha y hora en cualquier formato, ej: "25 dic 2025 20:00" o "2025-12-25"')
                .setRequired(true)
            )
            .addStringOption(opt => opt
                .setName('formato')
                .setDescription('Formato de visualización (por defecto: completo)')
                .setRequired(false)
                .addChoices(
                    { name: 'Hora corta   (16:20)',             value: 'corta'     },
                    { name: 'Hora larga   (16:20:30)',          value: 'larga'     },
                    { name: 'Fecha corta  (20/04/2025)',        value: 'fecha'     },
                    { name: 'Fecha larga  (20 de abril 2025)', value: 'fechalarga' },
                    { name: 'Completo     (20 abril 2025 16:20)', value: 'completo' },
                    { name: 'Relativo     (hace 2 meses)',      value: 'relativo'  },
                )
            )
        )

        // ── base64 ─────────────────────────────────────────────────────────
        .addSubcommand(sub => sub
            .setName('base64')
            .setDescription('Codifica o decodifica texto en Base64')
            .addStringOption(opt => opt
                .setName('accion')
                .setDescription('¿Codificar o decodificar?')
                .setRequired(true)
                .addChoices(
                    { name: 'Codificar (texto → Base64)', value: 'encode' },
                    { name: 'Decodificar (Base64 → texto)', value: 'decode' },
                )
            )
            .addStringOption(opt => opt
                .setName('texto')
                .setDescription('Texto a procesar')
                .setRequired(true)
            )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        // ── CALCULAR ───────────────────────────────────────────────────────
        if (sub === 'calcular') {
            const expr = interaction.options.getString('expresion');
            try {
                const result = safeMath(expr);
                const formatted = Number.isInteger(result)
                    ? result.toLocaleString()
                    : parseFloat(result.toFixed(10)).toLocaleString();

                const embed = new EmbedBuilder()
                    .setTitle('🧮 Calculadora')
                    .setColor('#5865F2')
                    .addFields(
                        { name: '📥 Expresión', value: `\`\`\`${expr}\`\`\``,  inline: false },
                        { name: '📤 Resultado', value: `\`\`\`${formatted}\`\`\``, inline: false }
                    )
                    .setFooter({ text: 'Operadores: + - * / % ^ ( )' })
                    .setTimestamp();

                return interaction.reply({ embeds: [embed] });
            } catch (err) {
                return interaction.reply({
                    content: `❌ No pude calcular esa expresión. Usa solo números y operadores \`+ - * / % ^ ( )\`.\n**Ejemplo:** \`(25 * 4) + 100 / 2\``,
                    flags: 64
                });
            }
        }

        // ── PASSWORD ───────────────────────────────────────────────────────
        if (sub === 'password') {
            const length  = interaction.options.getInteger('longitud')   ?? 16;
            const upper   = interaction.options.getBoolean('mayusculas') ?? true;
            const numbers = interaction.options.getBoolean('numeros')    ?? true;
            const symbols = interaction.options.getBoolean('simbolos')   ?? false;

            const password = generatePassword(length, upper, numbers, symbols);

            const tipoStr = [
                'minúsculas',
                upper   ? 'mayúsculas' : null,
                numbers ? 'números'    : null,
                symbols ? 'símbolos'   : null,
            ].filter(Boolean).join(', ');

            const embed = new EmbedBuilder()
                .setTitle('🔐 Contraseña Generada')
                .setColor('#2ECC71')
                .setDescription(`\`\`\`${password}\`\`\``)
                .addFields(
                    { name: '📏 Longitud',    value: `${length} caracteres`, inline: true },
                    { name: '🔤 Tipos',       value: tipoStr,                inline: true },
                )
                .setFooter({ text: 'Solo tú puedes ver este mensaje. No la compartas.' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }

        // ── TIMESTAMP ──────────────────────────────────────────────────────
        if (sub === 'timestamp') {
            const fechaStr = interaction.options.getString('fecha');
            const formato  = interaction.options.getString('formato') ?? 'completo';

            const date = new Date(fechaStr);
            if (isNaN(date.getTime())) {
                return interaction.reply({
                    content: `❌ No reconocí esa fecha. Prueba con formatos como:\n\`2025-12-25\`, \`25 Dec 2025 20:00\`, \`December 25 2025\``,
                    flags: 64
                });
            }

            const unix    = Math.floor(date.getTime() / 1000);
            const fmt     = TS_FORMATS[formato];
            const preview = `<t:${unix}:${fmt.flag}>`;
            const code    = `\`<t:${unix}:${fmt.flag}>\``;

            const embed = new EmbedBuilder()
                .setTitle('🕐 Timestamp de Discord')
                .setColor('#FFA500')
                .addFields(
                    { name: '📅 Fecha ingresada',  value: date.toUTCString(),       inline: false },
                    { name: '🔢 Unix timestamp',   value: `\`${unix}\``,            inline: true  },
                    { name: '📋 Formato',          value: fmt.label,                inline: true  },
                    { name: '📤 Código a pegar',   value: code,                     inline: false },
                    { name: '👁️ Vista previa',     value: preview,                  inline: false },
                )
                .setFooter({ text: 'Pega el código en cualquier mensaje de Discord' })
                .setTimestamp();

            return interaction.reply({ embeds: [embed] });
        }

        // ── BASE64 ─────────────────────────────────────────────────────────
        if (sub === 'base64') {
            const accion = interaction.options.getString('accion');
            const texto  = interaction.options.getString('texto');

            let resultado;
            try {
                if (accion === 'encode') {
                    resultado = Buffer.from(texto, 'utf8').toString('base64');
                } else {
                    resultado = Buffer.from(texto, 'base64').toString('utf8');
                }
            } catch {
                return interaction.reply({ content: '❌ No se pudo procesar el texto. Asegúrate de que sea Base64 válido.', flags: 64 });
            }

            if (resultado.length > 1900) {
                return interaction.reply({ content: '❌ El resultado es demasiado largo para mostrarse en Discord.', flags: 64 });
            }

            const embed = new EmbedBuilder()
                .setTitle(accion === 'encode' ? '🔒 Texto → Base64' : '🔓 Base64 → Texto')
                .setColor(accion === 'encode' ? '#E74C3C' : '#3498DB')
                .addFields(
                    { name: '📥 Entrada',   value: `\`\`\`${texto.slice(0, 900)}\`\`\``,    inline: false },
                    { name: '📤 Resultado', value: `\`\`\`${resultado.slice(0, 900)}\`\`\``, inline: false }
                )
                .setTimestamp();

            return interaction.reply({ embeds: [embed], flags: 64 });
        }
    },
};
