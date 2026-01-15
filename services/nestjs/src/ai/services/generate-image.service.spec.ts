import { Test, TestingModule } from "@nestjs/testing"
import sinon from 'sinon'
import { GenerateImageService } from "./generate-image.service"
import { PRISMA } from "@/src/constants/providers"
import { ConfigService } from "@/src/config/config.service"
import { mockGeneration } from "../mocks/generation.mock"
import { HttpService } from "@nestjs/axios"
import { generation_status } from "@prisma/client"

class TestGenerateImageService extends GenerateImageService {
  logger = {
    log: sinon.stub(),
    error: sinon.stub(),
    warn: sinon.stub(),
    debug: sinon.stub(),
    verbose: sinon.stub(),
  } as unknown as GenerateImageService['logger']

  public backgroundTasks: Promise<void>[] = []

  protected runInBackground(fn: () => Promise<void>) {
    // store the promise so tests can await it deterministically
    const p = fn()
    this.backgroundTasks.push(p)
  }
}


describe("GenerateImageService", () => {
  let module: TestingModule
  let service: TestGenerateImageService

  let prismaMock = {
    generations: { create: sinon.stub(), update: sinon.stub(), },
  }

  const configServiceStub = sinon.createStubInstance(ConfigService)
  const httpServiceStub = {
    axiosRef: {
      post: sinon.stub(),
    },
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: GenerateImageService,
          useClass: TestGenerateImageService,
        },
        {
          provide: PRISMA,
          useValue: prismaMock,
        },
        {
          provide: ConfigService,
          useValue: configServiceStub,
        },
        {
          provide: HttpService,
          useValue: httpServiceStub,
        }
      ],
    }).compile()

    service = module.get<TestGenerateImageService>(GenerateImageService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(() => {
    sinon.resetHistory()

    httpServiceStub.axiosRef.post.reset()
    service.backgroundTasks = []

    configServiceStub.get.withArgs('AI_REQUEST_MAX_ATTEMPTS', Number).returns(3)
    configServiceStub.get.withArgs('AI_REQUEST_BACKOFF_BASE_MS', Number).returns(100)
    configServiceStub.get.withArgs('AI_REQUEST_BACKOFF_MAX_MS', Number).returns(1000)
  })



  describe('generateImage', () => {
    it('should create a generation record and call the AI endpoint', async () => {
      const prompt = 'A futuristic cityscape at dusk'
      const generationId = 'test-generation-id'
      const mockedGeneration = mockGeneration({ generationId, prompt })

      prismaMock.generations.create.resolves(mockedGeneration)
      prismaMock.generations.update.resolves(mockedGeneration)

      httpServiceStub.axiosRef.post.resolves({ data: { generationId } })

      const result = await service.generateImage(prompt)
      await Promise.all(service.backgroundTasks)

      expect(result).toEqual({ generationId })

      expect(prismaMock.generations.create.calledOnce).toBe(true)
      expect(prismaMock.generations.create.firstCall.args[0].data.prompt).toBe(prompt)

      sinon.assert.calledOnce(httpServiceStub.axiosRef.post)

      expect(httpServiceStub.axiosRef.post.firstCall.args[0]).toBe('http://mock-ai:3001/generate')
      expect(httpServiceStub.axiosRef.post.firstCall.args[1]).toEqual({ prompt, generationId })

      expect(prismaMock.generations.update.called).toBe(true)
    })

    it('should retry on retriable errors and eventually succeed', async () => {
      const prompt = 'A serene beach at sunrise, for the second time'
      const generationId = 'test-generation-id'
      const mockedGeneration = mockGeneration({ generationId, prompt })

      prismaMock.generations.create.resolves(mockedGeneration)
      prismaMock.generations.update.resolves(mockedGeneration)


      httpServiceStub.axiosRef.post.onFirstCall().rejects(new Error('Network error'))
      httpServiceStub.axiosRef.post.onSecondCall().resolves({ data: { generationId } })

      const result = await service.generateImage(prompt)
      await Promise.all(service.backgroundTasks)

      expect(result).toEqual({ generationId })


      sinon.assert.calledTwice(httpServiceStub.axiosRef.post)
    })

    it('should fail after max retries on retriable errors', async () => {
      const prompt = 'A serene beach at sunrise, for the third time'
      const generationId = 'test-generation-id-3'
      const mockedGeneration = mockGeneration({ generationId, prompt })

      prismaMock.generations.create.resolves(mockedGeneration)
      prismaMock.generations.update.resolves(mockedGeneration)


      httpServiceStub.axiosRef.post.rejects(new Error('Server error'))

      await expect(service.generateImage(prompt)).resolves.toEqual({ generationId })

      const backgroundTasks = service.backgroundTasks
      await Promise.all(backgroundTasks)

      sinon.assert.calledThrice(httpServiceStub.axiosRef.post)
      sinon.assert.calledWithMatch(prismaMock.generations.update, {
        where: { generationId }, data: { status: generation_status.FAILED },
      })
    })
  })
})
