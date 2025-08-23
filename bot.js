const { Client, GatewayIntentBits } = require('discord.js');
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
const COOLDOWN_TIME = 1000;

// slang responses written by ai
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

client.once('clientReady', () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    setInterval(() => {
        const now = Date.now();
        for (const [userId, timestamp] of userCooldowns.entries()) {
            if (now - timestamp > COOLDOWN_TIME) {
                userCooldowns.delete(userId);
                userCooldownMessages.delete(userId);
            }
        }
    }, 60000);
});

client.on('messageCreate', async message => {    
    if (message.mentions.has(client.user) && message.content.toLowerCase().includes('is this true')) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (userCooldowns.has(userId)) {
            const expirationTime = userCooldowns.get(userId) + COOLDOWN_TIME;
            if (now < expirationTime) {
                if (!userCooldownMessages.has(userId)) {
                    const cooldownMessage = await message.reply(`chill bro, you'll be able to use me again <t:${Math.floor(expirationTime / 1000)}:R>`);
                    
                    userCooldownMessages.set(userId, true);
                    
                    setTimeout(() => {
                        cooldownMessage.delete().catch(() => {});
                        userCooldownMessages.delete(userId);
                    }, expirationTime - now);
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

client.login(process.env.DISCORD_TOKEN);
