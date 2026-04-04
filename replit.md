# replit.md

## Overview

This repository contains a Discord bot built with Node.js and Discord.js v14. The bot is designed to provide entertainment and social interaction features in Spanish-speaking Discord servers. It includes functionality for sending memes, anime content, virtual hugs, and automatic welcome messages for new server members.

## System Architecture

The bot follows a modular architecture with clear separation of concerns:

- **Main Entry Point**: `index.js` - Initializes the bot, loads commands and events
- **Configuration**: `config.js` - Centralized configuration for tokens, API endpoints, and bot settings
- **Commands**: Located in `/commands/` directory - Slash commands for user interactions
- **Events**: Located in `/events/` directory - Discord event handlers
- **Utilities**: Located in `/utils/` directory - Helper functions for API calls and embed creation

## Key Components

### Bot Client
- Uses Discord.js v14 with necessary gateway intents
- Implements slash commands using Discord's interaction system
- Supports command collection and dynamic loading

### Command System
- **Slash Commands**: Modern Discord interaction system
- **Available Commands**:
  - `/meme` - Fetches memes from various categories
  - `/anime` - Provides anime images and GIFs
  - `/abrazo` - Social interaction command for virtual hugs
  - `/ayuda` - Help command showing all available features
  - `/ia` - AI chat integration
  - `/language` - Persistent server language preference (ES/EN)
  - `/yt` - YouTube video search

## Data Flow

1. **Bot Initialization**: Bot starts, loads commands and events, registers slash commands globally
2. **User Interaction**: User executes slash command in Discord
3. **Command Processing**: Bot receives interaction, validates command, executes handler
4. **API Integration**: Commands make external API calls when needed (memes, anime content, AI)
5. **Response Generation**: Bot creates embeds with fetched content and sends response
6. **Event Handling**: Bot responds to Discord events like new member joins

## External Dependencies

### Core Dependencies
- **discord.js**: Discord API wrapper for bot functionality
- **axios**: HTTP client for external API requests
- **openai**: For AI chat functionality (Replit integration)
- **pg**: PostgreSQL client for database storage

### External APIs
- **meme-api.com**: Primary meme source
- **api.waifu.pics**: Anime content source
- **api.imgflip.com**: Backup meme source

### Environment Variables
- `DISCORD_TOKEN`: Bot authentication token
- `CLIENT_ID`: Discord application client ID

## Deployment Strategy

The bot is configured for Replit deployment with:
- **Runtime**: Node.js 20
- **Auto-installation**: Dependencies installed on startup
- **Process**: Single-process deployment running `node index.js`
- **Workflow**: Parallel execution setup for development

## Changelog

- Comandos NSFW eliminados para mantener un entorno seguro y familiar
- Comandos Social, Utilidades, Moderación y Gaming siguen operativos
- Sistema de bienvenidas corregido y funcional con /welcomeset, /welcomeconfig y /welcometest
- June 17, 2025. Bot migrado a nueva aplicación Discord con estado dinámico
  - Bot migrado exitosamente a nueva aplicación "Soledad ❣#6263" (ID: 766405066860527688)
  - Sistema de estado dinámico implementado con rotación automática cada 30 segundos
  - Estados dinámicos muestran: servidores, usuarios, canales, comandos y actividades
- June 17, 2025. Bot completamente funcional y conectado a Discord
  - Bot conectado exitosamente como "Hytell#2502"
  - 4 comandos slash registrados globalmente
  - Todos los eventos funcionando correctamente
  - APIs de memes y anime integradas
  - Sistema de bienvenidas automáticas implementado
- June 17, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.