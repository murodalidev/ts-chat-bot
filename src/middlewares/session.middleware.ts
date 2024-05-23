import { ConfigService } from '@nestjs/config'
import type RedisSessionType from 'telegraf-session-redis'
import { EnvVariables, sessionPrefix } from '../common/app.constants'
const RedisSession: typeof RedisSessionType = require('telegraf-session-redis')

export class SessionMiddleware {
  protected static redisSession: RedisSessionType

  static async getRedisSession(configService: ConfigService) {
    if (!this.redisSession) {
      const redisHost = configService.get(EnvVariables.redisHost)
      const redisPort = configService.get(EnvVariables.redisPort)
      if (!redisHost || !redisPort) {
        throw new Error('Error while connecting to Redis.')
      }
      this.redisSession = new RedisSession({
        store: {
          host: redisHost,
          port: redisPort,
          prefix: sessionPrefix
        },
        ttl: 3 * 3600
      })
    }
    return this.redisSession
  }
}
