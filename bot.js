const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
require('dotenv').config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const userCooldowns = new Map();
const userCooldownMessages = new Map();
const COOLDOWN_TIME = 10000;

const yesResponses = [
    'Yes',
    'Absolutely',
    'fr bruh',
    'ngl that\'s facts',
    'lowkey yeah',
    'icl that\'s true',
    'deadass',
    'no cap',
    'periodt',
    'that\'s bussin ngl'
];

const noResponses = [
    'No',
    'Nah bruh',
    'cap',
    'that\'s mid tbh',
    'icl that ain\'t it',
    'nah ts weird',
    'bruh what 💀',
    'that\'s lowkey false',
    'nah fam',
    'idk bout that one chief'
];

client.once('clientReady', () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
    
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
    if (message.author.bot) return;
    
    if (message.mentions.has(client.user) && message.content.toLowerCase().includes('is this true')) {
        const userId = message.author.id;
        const now = Date.now();
        
        if (userCooldowns.has(userId)) {
            const expirationTime = userCooldowns.get(userId) + COOLDOWN_TIME;
            if (now < expirationTime) {
                if (!userCooldownMessages.has(userId)) {
                    const timeLeft = Math.ceil((expirationTime - now) / 1000);
                    const cooldownMessage = await message.reply(`bruh chill, wait <t:${Math.floor(expirationTime / 1000)}:R> 💀`);
                    
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
        
        if (message.reference && message.reference.messageId) {
            try {
                const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
                const prompt = repliedMessage.content;
                
                if (prompt && prompt.trim() !== '') {
                    await message.channel.sendTyping();
                    
                    const promptTemplate = fs.readFileSync('prompt.md', 'utf8');
                    const fullPrompt = promptTemplate.replace('{CONTENT}', prompt);
                    
                    const result = await model.generateContent(fullPrompt);
                    const response = result.response;
                    const text = response.text();
                    
                    message.reply(text.trim());
                } else {
                    const isYes = Math.random() < 0.5;
                    const response = isYes 
                        ? yesResponses[Math.floor(Math.random() * yesResponses.length)]
                        : noResponses[Math.floor(Math.random() * noResponses.length)];
                    message.reply(response);
                }
            } catch (error) {
                console.error('Error fetching replied message or Gemini API:', error);
                const isYes = Math.random() < 0.5;
                const response = isYes 
                    ? yesResponses[Math.floor(Math.random() * yesResponses.length)]
                    : noResponses[Math.floor(Math.random() * noResponses.length)];
                message.reply(response);
            }
        } else {
            const isYes = Math.random() < 0.5;
            const response = isYes 
                ? yesResponses[Math.floor(Math.random() * yesResponses.length)]
                : noResponses[Math.floor(Math.random() * noResponses.length)];
            message.reply(response);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
