import { ConfigService } from '@/src/config/config.service'
import { PRISMA } from '@/src/constants/providers'
import { sleep } from '@/src/utils/sleep.function'
import { toErrorString } from '@/src/utils/to-error-string.function'
import { HttpService } from '@nestjs/axios'
import { Inject, Injectable, Logger } from '@nestjs/common'
import { generation_status, PrismaClient } from '@prisma/client'
import axios from 'axios'

@Injectable()
export class GenerateImageService {
  protected readonly logger = new Logger(GenerateImageService.name)

  constructor(
    @Inject(PRISMA) private readonly prisma: PrismaClient,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) { }


  private getRetryConfig() {
    const maxAttempts = this.configService.get('AI_REQUEST_MAX_ATTEMPTS', Number)
    const baseMs = this.configService.get('AI_REQUEST_BACKOFF_BASE_MS', Number)
    const maxMs = this.configService.get('AI_REQUEST_BACKOFF_MAX_MS', Number)

    return { maxAttempts, baseMs, maxMs }
  }

  private computeDelayMs(attempt: number, baseMs: number, maxMs: number) {
    const exp = Math.min(maxMs, baseMs * Math.pow(2, attempt - 1))
    const jitter = 0.8 + Math.random() * 0.4
    return Math.round(exp * jitter)
  }

  private isRetriableError(err: unknown) {
    if (!axios.isAxiosError(err)) return true
    const status = err.response?.status
    if (typeof status === 'number') {
      // 4xx errors are not retriable, because they're usually client errors
      if (status >= 400 && status < 500) return false
      return status >= 500
    }
    return true
  }


  private async processImageGeneration(prompt: string, generationId: string) {
    const { maxAttempts, baseMs, maxMs } = this.getRetryConfig()
    const mockAiUrl = this.configService.get('MOCK_AI_URL', String)
    const url = `${mockAiUrl}/generate`

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const now = new Date()


      await this.prisma.generations.update({
        where: { generationId },
        data: {
          attemptCount: attempt,
          lastAttemptAt: now,
        },
      })

      this.logger.log(
        `AI request attempt ${attempt}/${maxAttempts} generationId=${generationId}`,
      )

      try {
        const response = await this.httpService.axiosRef.post(
          url,
          { prompt, generationId },
        )

        this.logger.log(`AI request succeeded generationId=${generationId} attempt=${attempt}`)

        return response.data
      } catch (err) {
        const errStr = toErrorString(err)
        const retriable = this.isRetriableError(err)

        await this.prisma.generations.update({
          where: { generationId },
          data: {
            lastError: errStr.slice(0, 1500),
          },
        })

        if (!retriable || attempt === maxAttempts) {
          this.logger.error(
            `AI request failed (no more retries) generationId=${generationId} attempt=${attempt}/${maxAttempts} retriable=${retriable} error=${errStr}`,
          )

          await this.prisma.generations.update({
            where: { generationId },
            data: {
              status: generation_status.FAILED,
            },
          })

          throw err
        }

        const delayMs = this.computeDelayMs(attempt, baseMs, maxMs)

        this.logger.warn(
          `AI request failed; retrying generationId=${generationId} attempt=${attempt}/${maxAttempts} in ${delayMs}ms error=${errStr}`,
        )

        await sleep(delayMs)
      }
    }
  }

  protected runInBackground(fn: () => Promise<void>) {
    Promise.resolve().then(fn)
  }

  async generateImage(prompt: string) {
    try {
      const generation = await this.prisma.generations.create({
        data: {
          prompt,
          imageHeight: 1024,
          imageWidth: 1024,
          coreModel: 'SDXL',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      const generationId = generation.generationId

      this.runInBackground(async () => {
        try {
          await this.processImageGeneration(prompt, generationId)
        } catch (error) {
          this.logger.error('Background processing failed:', error)

          await this.prisma.generations.update({
            where: { generationId },
            data: {
              updatedAt: new Date(),
              status: generation_status.FAILED,
            },
          })
        }
      })

      return { generationId }
    } catch (error) {
      throw new Error(`Failed to initiate image generation: ${error}`)
    }
  }
}
