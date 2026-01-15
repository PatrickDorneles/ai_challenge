import { TestingModule, Test } from '@nestjs/testing'
import sinon from 'sinon'
import { PRISMA } from '@/src/constants/providers'
import { mockGeneration } from "../mocks/generation.mock"
import { GetGenerationStatusService } from './get-generation-status.service'


describe('GetGenerationStatusService', () => {
  let module: TestingModule
  let service: GetGenerationStatusService
  let prismaMock = {
    generations: { findUnique: sinon.stub() },
  }

  beforeAll(async () => {
    module = await Test.createTestingModule({
      providers: [GetGenerationStatusService, {
        provide: PRISMA,
        useValue: prismaMock,
      }],
    }).compile()

    service = module.get<GetGenerationStatusService>(GetGenerationStatusService)
  })

  afterAll(async () => {
    await module.close()
  })

  beforeEach(() => {
    sinon.resetHistory()
  })

  describe('getStatus', () => {
    it('should return the generation status', async () => {
      const generationId = 'test-generation-id'
      const mockedGeneration = mockGeneration({ status: 'COMPLETE' })

      prismaMock.generations.findUnique = sinon.stub().resolves(mockedGeneration)

      const { status } = await service.getGenerationStatus(generationId)

      expect(status).toBe('COMPLETE')
      expect(prismaMock.generations.findUnique.calledOnce).toBe(true)
    })

    it('should throw NotFoundException if generation not found', async () => {
      const generationId = 'non-existent-id'

      prismaMock.generations.findUnique = sinon.stub().resolves(null)

      await expect(service.getGenerationStatus(generationId)).rejects.toThrow('Generation not found')
      expect(prismaMock.generations.findUnique.calledOnce).toBe(true)
    })

    it('should throw BadRequestException if generationId is not provided', async () => {
      await expect(service.getGenerationStatus('')).rejects.toThrow('Generation id is required')
    })
  })
})
