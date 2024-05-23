import { ConfigService } from '@nestjs/config'
import { CacheModuleOptions } from '@nestjs/cache-manager'
import { EnvVariables } from '../common/app.constants'
import { redisStore } from 'cache-manager-redis-yet'

export const getCacheConfig = async (configService: ConfigService): Promise<CacheModuleOptions> => {
  const redisHost = configService.get(EnvVariables.redisHost)
  const redisPort = configService.get(EnvVariables.redisPort)
  if (!redisHost || !redisPort) {
    throw new Error('Error while connecting to Redis cache.')
  }
  return {
    store: await redisStore({
      socket: {
        host: redisHost,
        port: redisPort
      }
    })
  }
}
