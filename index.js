const { Client, GatewayIntentBits, Partials } = require('discord.js');
const express = require('express');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Message, Partials.Reaction]
});

// ⚠️ ВСТАВЬТЕ ВАШ НОВЫЙ ТОКЕН
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1494290117269913690';

const people = [
    { id: '234734984131248128', name: 'Ден Картер', amount: '30', status: '⬜ НЕ ВЫДАНО', done: false },
    { id: '450198219167891457', name: 'Глен Клири', amount: '36', status: '⬜ НЕ ВЫДАНО', done: false },
    { id: '1320767099299299389', name: 'Дейв Терамонт', amount: '23', status: '⬜ НЕ ВЫДАНО', done: false },
    { id: '1476353140201750771', name: 'Вивьен Блэквуд', amount: '20', status: '⬜ НЕ ВЫДАНО', done: false }
];

function createHeader() {
    return `\`\`\`ansi
[1;34m📖 ПРЕМИИ ЗА 19 МАЯ (БУХ.КНИГА)[0m
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
[47;30m  Каждый нажимает галочку под своим именем. Повторное нажатие снимает отметку.  [0m
[33m✅ нажмите на галочку, чтобы отметить получение [0m
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
\`\`\``;
}

function createPersonMessage(person) {
    const ansiBlock = `\`\`\`ansi
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
[36m▸ ${person.name}[0m     [31m-${person.amount}[0m[32m$[0m    [1;31m${person.status}[0m
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
\`\`\``;
    const mention = `<@${person.id}>`;
    // Убираем последний перевод строки после закрывающих ``` и приклеиваем тег без лишних переносов
    return ansiBlock.replace(/\n```$/, '```') + mention;
}

const personMessages = new Map();

client.once('ready', async () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error(`❌ Канал с ID ${CHANNEL_ID} не найден!`);
        return;
    }
    try {
        await channel.send(createHeader());
        for (const person of people) {
            const message = await channel.send(createPersonMessage(person));
            await message.react('✅');
            personMessages.set(message.id, { id: person.id, name: person.name });
            console.log(`✅ Сообщение для ${person.name} отправлено`);
        }
        console.log(`✅ Все сообщения отправлены!`);
    } catch (error) {
        console.error('Ошибка при отправке:', error);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== '✅') return;
    const message = reaction.message;
    const info = personMessages.get(message.id);
    if (!info) return;
    if (user.id !== info.id) {
        await reaction.users.remove(user.id);
        console.log(`⚠️ ${user.tag} пытался отметить ${info.name}, но не имеет прав`);
        return;
    }
    const person = people.find(p => p.id === info.id);
    if (!person || person.done) return;
    person.status = '✅ ВЫДАНО';
    person.done = true;
    try {
        await message.edit(createPersonMessage(person));
        console.log(`✅ ${user.tag} отметил(а) получение для ${info.name}`);
    } catch (err) { console.error(err); }
});

client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== '✅') return;
    const message = reaction.message;
    const info = personMessages.get(message.id);
    if (!info) return;
    if (user.id !== info.id) return;
    const person = people.find(p => p.id === info.id);
    if (!person || !person.done) return;
    person.status = '⬜ НЕ ВЫДАНО';
    person.done = false;
    try {
        await message.edit(createPersonMessage(person));
        console.log(`↩️ ${user.tag} снял(а) отметку для ${info.name}`);
    } catch (err) { console.error(err); }
});

// ========== ВЕБ-СЕРВЕР ДЛЯ RAILWAY ==========
const app = express();
app.get('/', (req, res) => res.send('Бот работает!'));
app.listen(process.env.PORT || 3000, () => console.log('Сервер запущен для пингов'));
// ===========================================

client.login(TOKEN);
