import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing'
import sinon from 'sinon'
import { AiController } from './ai.controller'
import { GenerateImageService } from './services/generate-image.service'
import { GetGenerationStatusService } from './services/get-generation-status.service'
import { INestApplication, NotFoundException } from '@nestjs/common';

describe('AIController', () => {
  let app: INestApplication
  let module: TestingModule

  let generateImageService = sinon.createStubInstance(GenerateImageService)
  let getGenerationStatusService = sinon.createStubInstance(GetGenerationStatusService)

  beforeAll(async () => {
    module = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        {
          provide: GenerateImageService,
          useValue: generateImageService,
        },
        {
          provide: GetGenerationStatusService,
          useValue: getGenerationStatusService,
        },
      ],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(() => {
    sinon.resetHistory()
  })

  describe('POST /generate-image', () => {
    it('should call generateImage service method', async () => {
      const prompt = 'A beautiful sunset over the mountains'

      generateImageService.generateImage.resolves({ generationId: 'test-generation-id' })

      const response = await request(app.getHttpServer())
        .post('/api/generation')
        .send({ prompt })
        .expect(201)

      expect(response.body).toEqual({ generationId: 'test-generation-id' })
      expect(generateImageService.generateImage.calledOnceWith(prompt)).toBe(true)

    })
  })


  describe('GET /generation/:generationId', () => {
    it('should call getGenerationStatus service method', async () => {
      const generationId = 'test-generation-id'
      const mockStatus = {
        generationId,
        status: 'COMPLETE',
        imageUrl: 'http://example.com/image.png',
      }

      getGenerationStatusService.getGenerationStatus.resolves(mockStatus as any)

      const response = await request(app.getHttpServer())
        .get(`/api/generation/${generationId}`)
        .expect(200)

      expect(response.body).toEqual(mockStatus)
      expect(getGenerationStatusService.getGenerationStatus.calledOnceWith(generationId)).toBe(true)
    })

    it('should return 404 if generation not found', async () => {
      const generationId = 'non-existent-id'

      getGenerationStatusService.getGenerationStatus.rejects(new NotFoundException('Generation not found'))

      const response = await request(app.getHttpServer())
        .get(`/api/generation/${generationId}`)
        .expect(404)

      expect(response.body).toEqual({ message: 'Generation not found', statusCode: 404, error: 'Not Found' })
      expect(getGenerationStatusService.getGenerationStatus.calledOnceWith(generationId)).toBe(true)
    })
  })

  afterAll(async () => {
    await app.close()
  })
})
