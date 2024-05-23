import { TelegrafModuleOptions } from 'nestjs-telegraf'
import { ConfigService } from '@nestjs/config'
import { EnvVariables } from '../common/app.constants'
import { SessionMiddleware } from '../middlewares/session.middleware'
import i18n from './i18n.config'

export const getTgBotConfig = async (configService: ConfigService): Promise<TelegrafModuleOptions> => {
  const token = configService.get(EnvVariables.botToken)
  if (!token) throw new Error(`${EnvVariables.botToken} is required!`)
  const session = await SessionMiddleware.getRedisSession(configService)
  return {
    token,
    middlewares: [session, i18n.middleware()]
  }
}
