const { Client, GatewayIntentBits, ContextMenuCommandBuilder, ApplicationCommandType, InteractionResponseFlags } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    allowedMentions: {
        parse: [],
        repliedUser: false
    }
});

const userCooldowns = new Map();
const userCooldownMessages = new Map();
const userOverflowMessages = new Map();
const COOLDOWN_TIME = 3000;

// slang responses written by ai bruh
const yesResponses = [
    'Yes',
    'Absolutely',
    'ofc',
    'no shit'
];

const noResponses = [
    'No',
    'nah fam',
    'ofc not'
];

const maybeResponses = [
    'maybe',
    'idk',
    'could be',
    'might be true',
    'possibly',
    'who knows',
    'unclear tbh',
    'hard to say',
    'idk bout that one chief'
];

client.once('clientReady', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const contextCommand = new ContextMenuCommandBuilder()
        .setName('Is this true?')
        .setType(ApplicationCommandType.Message);
    
    try {
        await client.application.commands.create(contextCommand);
        console.log('Context menu command registered!');
    } catch (error) {
        console.error('Failed to register context menu command:', error);
    }
    
    setInterval(() => {
        const now = Date.now();
        for (const [userId, timestamp] of userCooldowns.entries()) {
            if (now - timestamp > COOLDOWN_TIME) {
                userCooldowns.delete(userId);
                userCooldownMessages.delete(userId);
                
                if (userOverflowMessages.has(userId)) {
                    const messages = userOverflowMessages.get(userId);
                    messages.forEach(msg => {
                        msg.delete().catch(() => {});
                    });
                    userOverflowMessages.delete(userId);
                }
            }
        }
    }, 60000);
});

client.on('messageCreate', async message => {    
    if (message.mentions.has(client.user) && message.content.toLowerCase().includes('is this true')) {
        if (message.reference && message.reference.messageId) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                if (repliedMessage.author.bot) {
                    message.reply('ur not creating an infinite loop buddy 😭🙏');
                    return;
                }
            } catch (error) {
                
            }
        }
        
        const userId = message.author.id;
        const now = Date.now();
        
        if (userCooldowns.has(userId)) {
            const expirationTime = userCooldowns.get(userId) + COOLDOWN_TIME;
            if (now < expirationTime) {
                if (!userCooldownMessages.has(userId)) {
                    const cooldownMessage = await message.reply(`chill bro, you'll be able to use me again <t:${Math.floor(expirationTime / 1000)}:R>`);
                    
                    userCooldownMessages.set(userId, true);
                    
                    if (!userOverflowMessages.has(userId)) {
                        userOverflowMessages.set(userId, []);
                    }
                    userOverflowMessages.get(userId).push(message);
                    
                    setTimeout(() => {
                        cooldownMessage.delete().catch(() => {});
                        userCooldownMessages.delete(userId);
                        
                        if (userOverflowMessages.has(userId)) {
                            const messages = userOverflowMessages.get(userId);
                            messages.forEach(msg => {
                                msg.delete().catch(() => {});
                            });
                            userOverflowMessages.delete(userId);
                        }
                    }, expirationTime - now);
                } else {
                    if (!userOverflowMessages.has(userId)) {
                        userOverflowMessages.set(userId, []);
                    }
                    userOverflowMessages.get(userId).push(message);
                }
                return;
            }
        }
        
        userCooldowns.set(userId, now);
        
        const randomValue = Math.random();
        let response;
        
        if (randomValue < 0.2) {
            response = maybeResponses[Math.floor(Math.random() * maybeResponses.length)];
        } else if (randomValue < 0.6) {
            response = yesResponses[Math.floor(Math.random() * yesResponses.length)];
        } else {
            response = noResponses[Math.floor(Math.random() * noResponses.length)];
        }
        
        if (message.reference && message.reference.messageId) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                const quotedContent = repliedMessage.content || '*[no text content]*';
                message.reply(`> <@${repliedMessage.author.id}>: ${quotedContent}\n${response} `);
            } catch (error) {
                message.reply(response);
            }
        } else {
            message.reply(response);
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isMessageContextMenuCommand()) return;
    if (interaction.commandName !== 'Is this true?') return;
    
    const targetMessage = interaction.targetMessage;
    if (targetMessage.author.bot) {
        await interaction.reply({ 
            content: 'ur not creating an infinite loop buddy 😭🙏',
            // flags: InteractionResponseFlags.Ephemeral
        });
        return;
    }
    
    const userId = interaction.user.id;
    const now = Date.now();
    
    if (userCooldowns.has(userId)) {
        const expirationTime = userCooldowns.get(userId) + COOLDOWN_TIME;
        if (now < expirationTime) {
            if (!userCooldownMessages.has(userId)) {
                await interaction.reply({ 
                    content: `you're on a cooldown, you'll be able to use gork again <t:${Math.floor(expirationTime / 1000)}:R>`,
                    flags: InteractionResponseFlags.Ephemeral
                });
                userCooldownMessages.set(userId, true);
                setTimeout(() => {
                    userCooldownMessages.delete(userId);
                }, expirationTime - now);
            } else {
                await interaction.reply({ 
                    content: 'chill bro slow down',
                    flags: InteractionResponseFlags.Ephemeral
                });
            }
            return;
        }
    }
    
    userCooldowns.set(userId, now);
    
    const randomValue = Math.random();
    let response;
    
    if (randomValue < 0.2) {
        response = maybeResponses[Math.floor(Math.random() * maybeResponses.length)];
    } else if (randomValue < 0.6) {
        response = yesResponses[Math.floor(Math.random() * yesResponses.length)];
    } else {
        response = noResponses[Math.floor(Math.random() * noResponses.length)];
    }
    
    const quotedContent = targetMessage.content || '*[no text content]*';
    
    await interaction.reply(`> <@${targetMessage.author.id}>: ${quotedContent}\n${response}`);
});

client.login(process.env.DISCORD_TOKEN);
