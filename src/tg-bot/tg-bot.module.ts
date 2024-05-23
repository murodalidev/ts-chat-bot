import { Logger, Module } from '@nestjs/common'
import { TgBotUpdate } from './tg-bot.update'
import { TgBotService } from './tg-bot.service'
import { ChatApiModule } from '../chat-api/chat-api.module'
import { UsersModule } from '../users/users.module'
import { TypeOrmModule } from '@nestjs/typeorm'
import { FileEntity } from './entity/file.entity'

@Module({
  providers: [TgBotUpdate, TgBotService, Logger],
  imports: [ChatApiModule, UsersModule, TypeOrmModule.forFeature([FileEntity])]
})
export class TgBotModule {}
