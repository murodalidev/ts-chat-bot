import { Inject, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CACHE_MANAGER } from '@nestjs/cache-manager'
import { Cache } from 'cache-manager'
import { chatApiAccessToken, ChatApiEvents, EnvVariables } from '../common/app.constants'
import { io, Socket } from 'socket.io-client'
import { IChatListener, IChatNewMessage, IChatUser } from '../interfaces/chat-api.interface'

@Injectable()
export class ChatApiService {
  public ioChatInstances: Map<string, Socket>
  public userSockets: Map<number, string>
  public isUserChatting: Map<number, boolean>

  constructor(private readonly configService: ConfigService, @Inject(CACHE_MANAGER) private readonly cache: Cache) {
    this.ioChatInstances = new Map<string, Socket>()
    this.userSockets = new Map<number, string>()
    this.isUserChatting = new Map<number, boolean>()
  }

  protected async getAuthData(): Promise<string> {
    const chatApiHost = this.configService.get(EnvVariables.chatApiHost)
    const chatApiUsername = this.configService.get(EnvVariables.chatApiUsername)
    const chatApiPassword = this.configService.get(EnvVariables.chatApiPassword)
    const res = await fetch(`${chatApiHost}/api/users/login`, {
      method: 'POST',
      body: JSON.stringify({ login: chatApiUsername, password: chatApiPassword }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    if (!res.ok) throw new Error('API auth error.')
    const data = await res.json()
    return data?.access_token
  }

  protected async getToken() {
    const oldToken = await this.cache.get<undefined | string>(chatApiAccessToken)
    if (!oldToken) {
      const newToken = await this.getAuthData()
      // Save token in cache with expire time 2.5 hours
      await this.cache.set(chatApiAccessToken, newToken, 2.5 * 3600 * 1000)
      return newToken
    }
    return oldToken
  }

  getUserChatStatus(userTgId: number) {
    return this.isUserChatting.get(userTgId) || false
  }

  setUserChatStatus(userTgId: number, isChatting: boolean) {
    this.isUserChatting.set(userTgId, isChatting)
  }

  getUserSocketId(userTgId: number) {
    return this.userSockets.get(userTgId)
  }

  async createSocket(requestId: string, userTgId: number) {
    const token = await this.getToken()
    const chatApiHost = this.configService.get(EnvVariables.chatApiHost)
    const newSocket = io(chatApiHost, {
      transports: ['websocket'],
      query: {
        token
      },
      path: '/api/ws/chats'
    })
    this.ioChatInstances.set(requestId, newSocket)
    this.userSockets.set(userTgId, requestId)
    return newSocket
  }

  getSocket(requestId: string) {
    return this.ioChatInstances.get(requestId)
  }

  async subscribeToChatEvent(requestId: string, listener: IChatListener) {
    const socket = this.getSocket(requestId)
    socket.on(ChatApiEvents.chatEvent, listener)
  }

  async subscribeToChannelErrors(requestId: string, listener: IChatListener) {
    const socket = this.getSocket(requestId)
    socket.on(ChatApiEvents.channelErrors, listener)
  }

  async startChat(requestId: string, user: IChatUser) {
    const socket = this.getSocket(requestId)
    socket.emit(ChatApiEvents.startChat, user)
  }

  async sendMessage(requestId: string, newMessage: IChatNewMessage) {
    const socket = this.getSocket(requestId)
    if (socket) socket.emit(ChatApiEvents.sendMessage, newMessage)
  }

  async sendLeaveAndDeleteSocket(requestId: string, userTgId: number) {
    const socket = this.getSocket(requestId)
    this.userSockets.delete(userTgId)
    this.isUserChatting.delete(userTgId)
    if (socket) {
      socket.emit(ChatApiEvents.sendLeave, { requestId })
      await this.disconnectSocket(requestId)
    }
  }

  async disconnectSocket(requestId: string) {
    const socket = this.getSocket(requestId)
    if (socket) {
      socket.disconnect()
      this.ioChatInstances.delete(requestId)
    }
  }
}
