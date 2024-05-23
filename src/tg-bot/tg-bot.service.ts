import { Inject, Injectable, Logger } from '@nestjs/common'
import { ChatApiService } from '../chat-api/chat-api.service'
import { BotContext } from '../interfaces/context.interface'
import { randomUUID } from 'crypto'
import { EnvVariables, LanguageTexts, sessionPrefix, userErrorsPrefix } from '../common/app.constants'
import { endChatKeyboard, startChatKeyboard } from './keyboards'
import { ConfigService } from '@nestjs/config'
import { Markup } from 'telegraf'
import { CreateFileDto } from './dto/create-file.dto'
import { InjectRepository } from '@nestjs/typeorm'
import { FileEntity } from './entity/file.entity'
import { In, Repository } from 'typeorm'
import { unlink, writeFile } from 'fs/promises'
import { join } from 'path'
import { getDiffInMinutes, getFileMimeType, isValidImageFile, splitArrayToChunks } from '../common/utils'
import { Cron, CronExpression } from '@nestjs/schedule'
import { SessionMiddleware } from '../middlewares/session.middleware'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { IUserErrorsData } from '../interfaces/tg-bot.interfaces'

@Injectable()
export class TgBotService {
  constructor(
    private readonly chatApiService: ChatApiService,
    private readonly configService: ConfigService,
    private readonly logger: Logger,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    @InjectRepository(FileEntity) private readonly filesRepository: Repository<FileEntity>
  ) {}

  protected async forceClearSession(userTgId: number) {
    const redisSessionKey = `${userTgId}:${userTgId}`
    const session = await SessionMiddleware.getRedisSession(this.configService)
    session.client.get(redisSessionKey, (getError, getReply) => {
      if (getError) {
        this.logger.error(`Error while force clearing ${userTgId} scene state.`)
        return
      }
      const userSessionState = JSON.parse(getReply)
      session.client.set(
        redisSessionKey,
        JSON.stringify({ ...userSessionState, __scenes: {} }),
        (setError, setReply) => {
          if (setError || setReply !== 'OK') {
            this.logger.error(`Error while force updating ${userTgId} scene state.`)
          }
        }
      )
    })
  }

  async leaveChatAndDeleteSocket(ctx: BotContext, forceLeaveScene = false) {
    const { id: userTgId } = ctx.message.from
    const userSocketId = this.chatApiService.getUserSocketId(userTgId)
    await this.chatApiService.sendLeaveAndDeleteSocket(userSocketId, userTgId)
    if (forceLeaveScene) {
      // This is for clearing scene state outside of scene
      await this.forceClearSession(userTgId)
      return
    }
    await ctx.scene.leave()
  }

  async registerUserErrors(ctx: BotContext) {
    const { id: userTgId } = ctx.message.from
    const sessionKey = `${userErrorsPrefix}/${userTgId}`
    const errorsInInterval = await this.configService.get<number>(EnvVariables.errorsInInterval)
    const userBlockedTime = await this.configService.get<number>(EnvVariables.userBlockedTime)
    let userErrorsData = await this.cache.get<IUserErrorsData>(sessionKey)
    if (!userErrorsData) {
      userErrorsData = { errorTimes: [], isBlocked: false }
      userErrorsData.errorTimes.push(new Date())
      // For the first time put expire time 24 hour
      await this.cache.set(sessionKey, userErrorsData, 24 * 60 * 60 * 1000)
    } else {
      const [firstErrorTime] = userErrorsData.errorTimes
      const diffInMinutes = getDiffInMinutes(new Date(firstErrorTime), new Date())
      userErrorsData.errorTimes.push(new Date())
      // User will be blocked if more than 50 request sent during 3 minutes
      // or user request cancelled in sequence during 3 minutes
      if (diffInMinutes > errorsInInterval || userErrorsData.errorTimes.length >= 50) {
        userErrorsData.isBlocked = true
        await this.cache.set(sessionKey, userErrorsData, userBlockedTime * 60 * 1000)
      } else {
        const oldTTL = await this.cache.store.ttl(sessionKey)
        await this.cache.set(sessionKey, userErrorsData, oldTTL)
      }
    }
  }

  async openUserBlock(ctx: BotContext) {
    const { id: userTgId } = ctx.message.from
    const sessionKey = `${userErrorsPrefix}/${userTgId}`
    await this.cache.del(sessionKey)
  }

  async chatEndedError(ctx: BotContext) {
    await this.leaveChatAndDeleteSocket(ctx, true)
    await ctx.reply(ctx.i18n.t(LanguageTexts.chatEndedError), startChatKeyboard(ctx))
  }

  async createSocketAndSubscribe(ctx: BotContext) {
    const isTestRequest = this.configService.get(EnvVariables.isTestRequest) === 'true'
    const { id: userTgId } = ctx.message.from
    const userSocketId = this.chatApiService.getUserSocketId(userTgId)
    // This is for not creating additional sockets
    if (userSocketId) return userSocketId
    const requestId = randomUUID()
    const { phoneNumber, fullName } = ctx.session
    const lang = ctx.i18n.locale()
    await this.chatApiService.createSocket(requestId, userTgId)
    await this.chatApiService.subscribeToChatEvent(requestId, async chatResponse => {
      const { eventData } = chatResponse
      const { type, status } = eventData
      // Waiting for operator to connect
      if (type === 'StatusEvent' && status === 'chat_ok') {
        await ctx.reply(ctx.i18n.t(LanguageTexts.waitingOperator), Markup.removeKeyboard())
      }

      // Timeout or all operators are busy
      if (
        type === 'StatusEvent' &&
        (status === 'chat_request_rejected_by_agent' || status === 'chat_timedout_waiting_for_agent')
      ) {
        await this.leaveChatAndDeleteSocket(ctx, true)
        await ctx.reply(ctx.i18n.t(LanguageTexts.operatorsBusyError), startChatKeyboard(ctx))
      }

      // Operator connected and can chat with user
      if (type === 'PresenceEvent' && status === 'joined') {
        this.chatApiService.setUserChatStatus(userTgId, true)
        await this.openUserBlock(ctx)
        await ctx.reply(ctx.i18n.t(LanguageTexts.operatorJoined), endChatKeyboard(ctx))
      }

      // Operator left chat and chat must be finished
      if (type === 'PresenceEvent' && status === 'left') await this.chatEndedError(ctx)

      // Send operator response to user
      if (type === 'MessageEvent') {
        const { body, from } = eventData
        if (from !== 'me') await ctx.reply(body, endChatKeyboard(ctx))
      }

      // Chat ended or connection lost
      if (type === 'StatusEvent' && status === 'chat_finished_error') {
        await this.registerUserErrors(ctx)
        await this.chatEndedError(ctx)
      }
    })
    await this.chatApiService.subscribeToChannelErrors(requestId, async chatResponse => {
      this.logger.log(`Response from channelErrors => `, chatResponse)
      await this.leaveChatAndDeleteSocket(ctx, true)
      await ctx.reply(ctx.i18n.t(LanguageTexts.tryLater))
    })
    await this.chatApiService.startChat(requestId, {
      userPhone: phoneNumber,
      userName: fullName,
      lang,
      requestId,
      isTestRequest
    })
    return requestId
  }

  async createFileEntity(createFileDto: CreateFileDto) {
    const newFile = this.filesRepository.create(createFileDto)
    await this.filesRepository.save(newFile)
    return newFile
  }

  async downloadAndSaveLocalFile(filePath: string) {
    const botToken = this.configService.get(EnvVariables.botToken)
    const fileURL = `https://api.telegram.org/file/bot${botToken}/${filePath}`
    const fileMimeType = getFileMimeType(filePath)
    const fileName = `${randomUUID()}.${fileMimeType}`
    const relativeFilePath = join('media/images', fileName)
    const absoluteFilePath = join(process.cwd(), relativeFilePath)
    try {
      const response = await fetch(fileURL)
      const blob = await response.blob()
      const arrayBuffer = await blob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      await writeFile(absoluteFilePath, buffer)
      return { localFilePath: relativeFilePath, fileName }
    } catch (e) {
      await unlink(absoluteFilePath)
      throw new Error('Error while saving image file.')
    }
  }

  async saveFileAndGetLink(ctx: BotContext, fileId: string) {
    const mediaHost = this.configService.get(EnvVariables.mediaHost)
    const { file_path } = await ctx.telegram.getFile(fileId)
    const fileMimeType = getFileMimeType(file_path)
    if (isValidImageFile(fileMimeType)) {
      const { fileName, localFilePath } = await this.downloadAndSaveLocalFile(file_path)
      await this.createFileEntity({ fileName })
      return `${mediaHost}/${localFilePath}`
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async deleteOldFiles() {
    const deleteFilesOlderThan = this.configService.get(EnvVariables.deleteFilesOlderThan)
    const oldFilesQuery = `"createdAt" < date(now()) - ${deleteFilesOlderThan}`
    const queryBuilder = this.filesRepository.createQueryBuilder()
    const oldFiles = await queryBuilder.where(oldFilesQuery).getMany()
    if (oldFiles.length) {
      const chunkedArray = splitArrayToChunks(oldFiles, 500)
      for (const chunkedArrayElement of chunkedArray) {
        const deletedFileIds = []
        for (const { fileName, id } of chunkedArrayElement) {
          const filePath = join(process.cwd(), 'media/images', fileName)
          try {
            await unlink(filePath)
            deletedFileIds.push(id)
          } catch (e) {
            this.logger.error(`Error while deleting old file: ${id}. ${fileName} \n ${e.message}`)
          }
        }
        await this.filesRepository.delete({ id: In(deletedFileIds) })
      }
    }
  }
}
