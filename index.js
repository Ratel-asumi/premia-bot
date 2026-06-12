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

// ⚠️ ВСТАВЬТЕ ВАШ ТОКЕН (в кавычках)
const TOKEN = process.env.TOKEN;
const CHANNEL_ID = '1494290117269913690';

// Сегодняшние люди (19 мая)
const people = [
    { id: '833740291202482176', name: 'Тайлер Фостер', amount: '28', status: '⬜ НЕ ВЫДАНО', done: false },
    { id: '234734984131248128', name: 'Ден Картер', amount: '22', status: '⬜ НЕ ВЫДАНО', done: false },
    { id: '1476353140201750771', name: 'Вивьен Блэквуд', amount: '32', status: '⬜ НЕ ВЫДАНО', done: false },
    { id: '1118564313557385346', name: 'Дакота Акоста', amount: '20', status: '⬜ НЕ ВЫДАНО', done: false },
];

function createHeader() {
    return `\`\`\`ansi
[1;34m📖 ПРЕМИИ ЗА 10, 11 ИЮНЯ (БУХ.КНИГА)[0m
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
[47;30m  Каждый нажимает галочку под своим именем. Повторное нажатие снимает отметку.  [0m
[33m✅ нажмите на галочку, чтобы отметить получение [0m
\`\`\``;
}

function createPersonMessage(person) {
    // Выбираем цвет статуса: красный для "НЕ ВЫДАНО", зелёный для "ВЫДАНО"
    const statusColor = person.status === '⬜ НЕ ВЫДАНО' ? '1;31m' : '1;32m';
    const ansiBlock = `\`\`\`ansi
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
[36m▸ ${person.name}[0m     [31m-${person.amount}[0m[32m$[0m    [${statusColor}${person.status}[0m
[36m━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━[0m
\`\`\``;
    const mention = `<@${person.id}>`;
    return ansiBlock.replace(/\n```$/, '```') + mention;
}

// Извлекает ID пользователя из упоминания в конце сообщения
function extractUserIdFromMessage(content) {
    const match = content.match(/<@!?(\d+)>$/);
    return match ? match[1] : null;
}

// Переключает статус в тексте сообщения
function toggleStatusInMessage(content) {
    if (content.includes('⬜ НЕ ВЫДАНО')) {
        // Заменяем красный цвет на зелёный и текст
        return content.replace(/\[1;31m⬜ НЕ ВЫДАНО\[0m/g, '[1;32m✅ ВЫДАНО[0m');
    } else if (content.includes('✅ ВЫДАНО')) {
        // Заменяем зелёный цвет на красный и текст
        return content.replace(/\[1;32m✅ ВЫДАНО\[0m/g, '[1;31m⬜ НЕ ВЫДАНО[0m');
    }
    return null;
}

client.once('ready', async () => {
    console.log(`✅ Бот ${client.user.tag} запущен!`);
    const channel = client.channels.cache.get(CHANNEL_ID);
    if (!channel) {
        console.error(`❌ Канал с ID ${CHANNEL_ID} не найден!`);
        return;
    }
    try {
        // Отправляем только если сегодня ещё не отправляли (можно удалить старые вручную)
        await channel.send(createHeader());
        for (const person of people) {
            const message = await channel.send(createPersonMessage(person));
            await message.react('✅');
            console.log(`✅ Сообщение для ${person.name} отправлено`);
        }
        console.log(`✅ Все сообщения отправлены!`);
    } catch (error) {
        console.error('Ошибка при отправке:', error);
    }
});

// Добавление реакции ✅
client.on('messageReactionAdd', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== '✅') return;

    const message = reaction.message;
    if (message.author.id !== client.user.id) return;

    const content = message.content;
    const targetUserId = extractUserIdFromMessage(content);
    if (!targetUserId) return;

    if (user.id !== targetUserId) {
        await reaction.users.remove(user.id);
        console.log(`⚠️ ${user.tag} пытался отметить чужое сообщение`);
        return;
    }

    const newContent = toggleStatusInMessage(content);
    if (!newContent) return;

    try {
        await message.edit(newContent);
        console.log(`✅ ${user.tag} изменил статус в сообщении`);
    } catch (err) {
        console.error('Ошибка при обновлении:', err);
    }
});

// Удаление реакции ✅
client.on('messageReactionRemove', async (reaction, user) => {
    if (user.bot) return;
    if (reaction.partial) await reaction.fetch();
    if (reaction.emoji.name !== '✅') return;

    const message = reaction.message;
    if (message.author.id !== client.user.id) return;

    const content = message.content;
    const targetUserId = extractUserIdFromMessage(content);
    if (!targetUserId) return;
    if (user.id !== targetUserId) return;

    const newContent = toggleStatusInMessage(content);
    if (!newContent) return;

    try {
        await message.edit(newContent);
        console.log(`↩️ ${user.tag} снял отметку в сообщении`);
    } catch (err) {
        console.error('Ошибка при обновлении:', err);
    }
});

// ========== ВЕБ-СЕРВЕР ДЛЯ RAILWAY ==========
const app = express();
app.get('/', (req, res) => res.send('Бот работает!'));
app.listen(process.env.PORT || 3000, () => console.log('Сервер запущен для пингов'));
// ===========================================

client.login(TOKEN);
