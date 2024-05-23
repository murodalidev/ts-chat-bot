import { Ctx, Hears, InjectBot, Start, TELEGRAF_STAGE, Update } from 'nestjs-telegraf'
import { BotContext } from '../interfaces/context.interface'
import { TgBotService } from './tg-bot.service'
import { LanguageTexts, SceneIds, userErrorsPrefix } from '../common/app.constants'
import { Inject, Logger, OnModuleInit } from '@nestjs/common'
import { Scenes, Telegraf } from 'telegraf'
import { UserInfoWizard } from './scenes/wizards/user-info.wizard'
import { ChatApiService } from '../chat-api/chat-api.service'
import { ChatWizard } from './scenes/wizards/chat.wizard'
import { UsersService } from '../users/users.service'
import { ConfigService } from '@nestjs/config'
import { startChatKeyboard } from './keyboards'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { IUserErrorsData } from '../interfaces/tg-bot.interfaces'
const { match } = require('telegraf-i18n')

@Update()
export class TgBotUpdate implements OnModuleInit {
  async onModuleInit() {
    this.bot.catch((err, ctx) => {
      if (err instanceof Error) {
        this.logger.error(`${err.message} \n ${err.stack}`)
      }
      ctx.reply(ctx.i18n.t(LanguageTexts.tryLater))
    })
  }

  constructor(
    private readonly tgBotService: TgBotService,
    private readonly chatApiService: ChatApiService,
    private readonly usersService: UsersService,
    private readonly logger: Logger,
    private readonly configService: ConfigService,
    @InjectBot() private readonly bot: Telegraf<BotContext>,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @Inject(TELEGRAF_STAGE) private readonly stage: Scenes.Stage<BotContext>
  ) {
    stage.register(new UserInfoWizard(usersService), new ChatWizard(chatApiService, tgBotService, configService))
    bot.use(stage.middleware())
  }

  @Start()
  async onStart(@Ctx() ctx: BotContext) {
    await ctx.scene.enter(SceneIds.getUserInfo)
  }

  @Hears(match(LanguageTexts.startChat))
  async onChatStart(@Ctx() ctx: BotContext) {
    const { id: tgId } = ctx.message.from
    const { username: botUsername } = ctx.botInfo
    const existingUser = await this.usersService.findByTgIdOrPhone(tgId, '')
    if (existingUser) {
      ctx.session.fullName = existingUser.fullName
      ctx.session.phoneNumber = existingUser.phoneNumber
    }
    const { phoneNumber, fullName } = ctx.session
    if (!phoneNumber || !fullName) {
      await ctx.replyWithHTML(ctx.i18n.t(LanguageTexts.introduceYourself, { botUsername }))
      return
    }
    const userErrorSessionKey = `${userErrorsPrefix}/${tgId}`
    const userErrorData = await this.cache.get<IUserErrorsData | undefined>(userErrorSessionKey)
    if (!userErrorData || !userErrorData.isBlocked) {
      await this.tgBotService.createSocketAndSubscribe(ctx)
      await ctx.scene.enter(SceneIds.chatWithUser)
      return
    }
    const leftBlockTime = await this.cache.store.ttl(userErrorSessionKey)
    await ctx.reply(
      ctx.i18n.t(LanguageTexts.tooManyRequests, { blockLeftTime: Math.ceil(leftBlockTime / (60 * 1000)) }),
      startChatKeyboard(ctx)
    )
  }

  @Hears(match(LanguageTexts.endChat))
  async onEndChat(@Ctx() ctx: BotContext) {
    await this.tgBotService.leaveChatAndDeleteSocket(ctx, true)
    await ctx.reply(ctx.i18n.t(LanguageTexts.connectOperator), startChatKeyboard(ctx))
  }
}
