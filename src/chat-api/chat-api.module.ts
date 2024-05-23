import { Module } from '@nestjs/common'
import { ChatApiService } from './chat-api.service'

@Module({
  providers: [ChatApiService],
  exports: [ChatApiService]
})
export class ChatApiModule {}
