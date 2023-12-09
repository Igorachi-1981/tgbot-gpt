import { Telegraf, session } from 'telegraf'
import { editedChannelPost, message } from 'telegraf/filters'
import { code } from 'telegraf/format'
import config from 'config'
import { ogg } from './ogg.js'
import { openai } from './openai.js'

const bot = new Telegraf(config.get('TELEGRAM_TOKEN'))
bot.use(session())

const INITIAL_SESSION = {
    messages: [],
}

bot.command('new', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Новый разговор')
})

bot.command('start', async (ctx) => {
    ctx.session = INITIAL_SESSION
    await ctx.reply('Давай поговорим!')
})

bot.on(message('voice'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(code('Распознаю текст, ожидайте!'))
        await ctx.sendChatAction("typing")
        const link = await ctx.telegram.getFileLink(ctx.message.voice.file_id)
        const userId = String(ctx.message.from.id)
        const oggPath = await ogg.create(link.href, userId)
        const mp3Path = await ogg.toMp3(oggPath, userId)
        const text = await openai.transcription(mp3Path)
        await ctx.reply(code(`Вы сказали: ${text}`))
        await ctx.sendChatAction("typing")
        ctx.session.messages.push({role: openai.roles.USER, content: text})
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({role: openai.roles.ASSISTANT, content: response.content})
        await ctx.reply(response.content)
    } catch (e) {
        console.log(e.message)
    }
})

bot.on(message('text'), async (ctx) => {
    ctx.session ??= INITIAL_SESSION
    try {
        await ctx.reply(code('Я думаю, ожидайте...'))
        await ctx.sendChatAction("typing")
        
        ctx.session.messages.push({
            role: openai.roles.USER,
            content: ctx.message.text
        })
        const response = await openai.chat(ctx.session.messages)
        ctx.session.messages.push({
            role: openai.roles.ASSISTANT, 
            content: response.content
        })
        await ctx.reply(response.content)
    } catch (e) {
        console.log(e.message)
    }
})
bot.launch()

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))