import { Module } from '@nestjs/common'
import { AiController } from './ai.controller'
import { GenerateImageService } from './services/generate-image.service'
import { GetGenerationStatusService } from './services/get-generation-status.service'
import { HttpModule } from '@nestjs/axios'

@Module({
  imports: [HttpModule],
  controllers: [AiController],
  providers: [GenerateImageService, GetGenerationStatusService],
})
export class AiModule {}
