import { Module } from '@nestjs/common'
import { TgBotModule } from './tg-bot/tg-bot.module'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TelegrafModule } from 'nestjs-telegraf'
import { getTgBotConfig } from './configs/tg-bot.config'
import { ChatApiModule } from './chat-api/chat-api.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { UsersModule } from './users/users.module'
import { envFilePath } from './common/utils'
import { getDbConfig } from './configs/db.config'
import { ScheduleModule } from '@nestjs/schedule'
import { CacheModule } from '@nestjs/cache-manager'
import { getCacheConfig } from './configs/cache.config'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: getCacheConfig
    }),
    TelegrafModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTgBotConfig
    }),
    TgBotModule,
    ChatApiModule,
    TypeOrmModule.forRootAsync({
      useFactory: () => ({ ...getDbConfig(), entities: [], autoLoadEntities: true })
    }),
    UsersModule,
    ScheduleModule.forRoot()
  ]
})
export class AppModule {}
