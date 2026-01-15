import request from 'supertest'
import sinon from 'sinon'
import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import { AppModule } from '../src/app.module'
import { PRISMA } from '../src/constants/providers'
import { GenerateImageService } from '../src/ai/services/generate-image.service'
import { HttpService } from '@nestjs/axios'

class TestGenerateImageService extends GenerateImageService {
  public backgroundTasks: Promise<void>[] = []

  protected runInBackground(fn: () => Promise<void>) {
    this.backgroundTasks.push(fn())
  }
}

describe('Generation Retry (E2E)', () => {
  let app: INestApplication
  let moduleRef: TestingModule

  const prismaMock = {
    generations: {
      create: sinon.stub(),
      update: sinon.stub(),
    },
  }

  // HttpService mock with axiosRef.post stub
  const httpServiceMock = {
    axiosRef: {
      post: sinon.stub(),
    },
  }

  beforeAll(async () => {
    // required by your ConfigService (throws if missing)
    process.env.AI_REQUEST_MAX_ATTEMPTS = '5'
    process.env.AI_REQUEST_BACKOFF_BASE_MS = '1'
    process.env.AI_REQUEST_BACKOFF_MAX_MS = '2'

    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PRISMA)
      .useValue(prismaMock)
      .overrideProvider(HttpService)
      .useValue(httpServiceMock)
      .overrideProvider(GenerateImageService)
      .useClass(TestGenerateImageService)
      .compile()

    app = moduleRef.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
    await moduleRef.close()
  })

  beforeEach(() => {
    sinon.resetHistory()
    prismaMock.generations.create.resetHistory()
    prismaMock.generations.update.resetHistory()
    httpServiceMock.axiosRef.post.resetHistory()
  })

  it('retries on transient errors and eventually succeeds', async () => {
    const generationId = 'gen-e2e-1'
    prismaMock.generations.create.resolves({
      generationId,
      prompt: 'hello',
    })

    // fail twice, succeed once
    httpServiceMock.axiosRef.post.onCall(0).rejects(new Error('network'))
    httpServiceMock.axiosRef.post.onCall(1).rejects(new Error('network'))
    httpServiceMock.axiosRef.post.onCall(2).resolves({ data: { ok: true } })

    const res = await request(app.getHttpServer())
      .post('/api/generation')
      .send({ prompt: 'hello' })
      .expect(201)

    expect(res.body).toEqual({ generationId })

    // wait for background retry loop
    const svc = moduleRef.get(GenerateImageService) as unknown as TestGenerateImageService
    await Promise.all(svc.backgroundTasks)

    // outbound called 3 times
    sinon.assert.callCount(httpServiceMock.axiosRef.post, 3)

    // attemptCount should have been written at least 1,2,3
    const attemptCounts = prismaMock.generations.update
      .getCalls()
      .map((c: any) => c.args[0]?.data?.attemptCount)
      .filter((v: any) => typeof v === 'number')

    expect(attemptCounts).toEqual(expect.arrayContaining([1, 2, 3]))
  })
})
