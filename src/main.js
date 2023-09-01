import { Telegraf, session } from 'telegraf';
import { message } from 'telegraf/filters';
import { code } from 'telegraf/format';
import config from 'config';
import { ogg } from './ogg.js';
import { openai } from './openai.js';


const bot = new Telegraf(config.get('TELEGRAM_TOKEN'));
bot.use(session());

bot.command('new', async (ctx) => {
    ctx.session = getNewSession();
    await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('new', async (ctx) => {
    ctx.session = getNewSession();
    await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.command('start', async (ctx) => {
    ctx.session = getNewSession();
    await ctx.reply('Жду вашего голосового или текстового сообщения')
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= getNewSession();
    try {
        await ctx.reply(code('Сообщение принял. Жду ответ от сервера'))
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id);
        const userId = String(ctx.message.from.id);
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)

        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Ваш запрос: ${text}`))

        const responseText = await getResponseFromOpenAi(ctx, text);

        await ctx.reply(responseText)
    } catch (error) {
        console.log('Error while voice message: ', error.message);
    }
})

bot.on(message('text'), async (ctx) => {
    ctx.session ??= getNewSession();
    try {
        await ctx.reply(code('Сообщение принял. Жду ответ от сервера'))
        const responseText = await getResponseFromOpenAi(ctx, ctx.message.text);
        await ctx.reply(responseText)
    } catch (error) {
        await ctx.reply('Произошла ошибка во время запроса к openAI.')
        console.log('Error while text message: ', error.message);
    }
})

bot.command('bot', async (ctx) => {
    ctx.session ??= getNewSession();
    const text = ctx.message.text.slice(4);
    try {
        await ctx.reply(code('Сообщение принял. Жду ответ от сервера'))
        const responseText = getResponseFromOpenAi(ctx, text);
        await ctx.reply(responseText)
    } catch (error) {
        await ctx.reply('Произошла ошибка во время запроса к openAI.')
        console.log('Error while bot message: ', error.message);
    }
})

const getResponseFromOpenAi = async (ctx, text) => {
    ctx.session.messages.push({
        role: openai.roles.USER,
        content: text
    });

    const response = await openai.chat(ctx.session.messages);

    ctx.session.messages.push({
        role: openai.roles.ASSISTANT,
        content: response.content
    })

    return response.content;
}

function getNewSession() {
    return {
        messages: []
    }
}

bot.launch();

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

