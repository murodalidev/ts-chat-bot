import { BotContext } from '../../../interfaces/context.interface'
import { Composer, Markup, Scenes } from 'telegraf'
import { LanguageTexts, SceneIds } from '../../../common/app.constants'
import { message } from 'telegraf/filters'
import { ChatApiService } from '../../../chat-api/chat-api.service'
import { IChatNewMessage } from '../../../interfaces/chat-api.interface'
import { TgBotService } from '../../tg-bot.service'
import { ConfigService } from '@nestjs/config'
const { match } = require('telegraf-i18n')

export class ChatWizard extends Scenes.WizardScene<BotContext> {
  private static chatApiService: ChatApiService
  private static tgBotService: TgBotService
  private static configService: ConfigService

  constructor(chatApiService: ChatApiService, tgBotService: TgBotService, configService) {
    super(SceneIds.chatWithUser, ChatWizard.chatWithOperator())
    ChatWizard.chatApiService = chatApiService
    ChatWizard.tgBotService = tgBotService
    ChatWizard.configService = configService
  }

  static createComposer(handler: (composer: Composer<BotContext>) => void) {
    const composer = new Composer<BotContext>()
    composer.start(ctx => ctx.scene.leave())
    handler(composer)
    return composer
  }

  protected static async checkOperatorConnected(ctx: BotContext, next: () => Promise<void>) {
    const { id: userTgId } = ctx.message.from
    const isChatting = ChatWizard.chatApiService.getUserChatStatus(userTgId)
    if (!isChatting) {
      await ctx.reply(ctx.i18n.t(LanguageTexts.waitOperatorToJoin))
      return
    }
    return next()
  }

  protected static async sendMessageToChatApi(ctx: BotContext, text: string) {
    const { id: userTgId } = ctx.message.from
    const userSocketId = this.chatApiService.getUserSocketId(userTgId)
    const newMessage: IChatNewMessage = { requestId: userSocketId, message: text }
    await ChatWizard.chatApiService.sendMessage(userSocketId, newMessage)
  }

  // step-1
  static chatWithOperator() {
    const map = new Map()
    return ChatWizard.createComposer(composer => {
      composer.use(async (ctx, next) => {
        const { message } = ctx
        if (message) {
          // Middleware for grouped image files
          if ('media_group_id' in message) {
            if (!map.get(ctx.chat.id)) {
              map.set(ctx.chat.id, new Map())
            }
            const userMap = map.get(ctx.chat.id)
            if (!userMap.get(message.media_group_id)) {
              userMap.set(message.media_group_id, {
                resolve: () => {},
                messages: []
              })
            }
            const mediaGroupOptions = userMap.get(message.media_group_id)

            mediaGroupOptions.resolve(false)
            mediaGroupOptions.messages.push(message)
            return new Promise(resolve => {
              mediaGroupOptions.resolve = resolve
              setTimeout(() => resolve(true), 100)
            }).then(value => {
              if (value === true) {
                ctx.mediaGroup = mediaGroupOptions.messages.slice().sort((a, b) => a.message_id - b.message_id)
                userMap.delete(message.media_group_id)
                if (userMap.size === 0) {
                  map.delete(ctx.chat.id)
                }
                return next()
              }
            })
          }
          if ('text' in message) {
            const { text } = message
            const { id: userTgId } = message.from
            const userSocketId = this.chatApiService.getUserSocketId(userTgId)
            const socket = this.chatApiService.getSocket(userSocketId)
            if (!socket && text === ctx.i18n.t(LanguageTexts.startChat)) {
              await this.tgBotService.leaveChatAndDeleteSocket(ctx)
              await ctx.scene.leave()
              await this.tgBotService.createSocketAndSubscribe(ctx)
              return ctx.scene.enter(SceneIds.chatWithUser)
            }
          }
        }
        return next()
      })
      composer.hears(match(LanguageTexts.endChat), async ctx => {
        await ChatWizard.tgBotService.leaveChatAndDeleteSocket(ctx)
        await ctx.reply(
          ctx.i18n.t(LanguageTexts.connectOperator),
          Markup.keyboard([ctx.i18n.t(LanguageTexts.startChat)]).resize()
        )
        return ctx.scene.leave()
      })
      composer.on(message('text'), async ctx => {
        const { text } = ctx.message
        await ChatWizard.sendMessageToChatApi(ctx, text)
      })
      // For grouped images
      composer.on(message('media_group_id'), ChatWizard.checkOperatorConnected, async ctx => {
        const firstMessage = ctx.mediaGroup[0]
        let fullMessage = 'caption' in firstMessage && firstMessage.caption ? firstMessage.caption : ''
        const { message_id } = await ctx.reply(ctx.i18n.t(LanguageTexts.pleaseWait))
        for (const message of ctx.mediaGroup) {
          //@ts-ignore
          const file_id = 'photo' in message ? message.photo.pop().file_id : message.document.file_id
          const fileLink = await ChatWizard.tgBotService.saveFileAndGetLink(ctx, file_id)
          fullMessage += `\n${fileLink}`
        }
        await ctx.deleteMessage(message_id)
        await ChatWizard.sendMessageToChatApi(ctx, fullMessage)
      })
      // For single image file
      composer.on([message('photo'), message('document')], ChatWizard.checkOperatorConnected, async ctx => {
        const caption = 'caption' in ctx.message && ctx.message.caption ? ctx.message.caption : ''
        const file_id = 'photo' in ctx.message ? ctx.message.photo.pop().file_id : ctx.message.document.file_id
        const fileLink = await ChatWizard.tgBotService.saveFileAndGetLink(ctx, file_id)
        const textMessage = `${fileLink} ${caption}`
        await ChatWizard.sendMessageToChatApi(ctx, textMessage)
      })
    })
  }
}
