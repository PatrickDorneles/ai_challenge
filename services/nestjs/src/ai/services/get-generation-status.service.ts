import { PRISMA } from '@/src/constants/providers'
import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { generation_status as GenerationStatus, PrismaClient } from '@prisma/client'
import { plainToInstance } from 'class-transformer'
import { GetGenerationStatusResponseDto } from '../dtos/get-generation-status.response.dto'

@Injectable()
export class GetGenerationStatusService {
  constructor(
    @Inject(PRISMA)
    private readonly prisma: PrismaClient
  ) { }

  async getGenerationStatus(generationId: string) {
    if (!generationId) {
      throw new BadRequestException('Generation id is required')
    }

    const generation = await this.prisma.generations.findUnique({
      where: { generationId },
    })

    if (!generation) {
      throw new NotFoundException('Generation not found')
    }

    return plainToInstance(GetGenerationStatusResponseDto, {
      status: generation.status,
      prompt: generation.prompt,
      imageUrls: generation.status === GenerationStatus.COMPLETE ? generation.imageUrls : undefined,
    })
  }
}
