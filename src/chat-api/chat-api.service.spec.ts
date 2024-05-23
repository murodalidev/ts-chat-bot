import { Test, TestingModule } from '@nestjs/testing'
import { ChatApiService } from './chat-api.service'

describe('ChatApiService', () => {
  let service: ChatApiService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatApiService]
    }).compile()

    service = module.get<ChatApiService>(ChatApiService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
