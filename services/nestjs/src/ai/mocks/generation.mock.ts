import { core_models, generation_status, generations } from "@prisma/client";

export function mockGeneration(props: Partial<generations> = {}): generations {
  return {
    id: 'mock-id',
    generationId: 'mock-generation-id',
    prompt: 'A beautiful landscape painting',
    status: generation_status.PENDING,
    imageUrls: [],
    attemptCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    public: false,
    flagged: false,
    nsfw: false,
    imageHeight: 1024,
    imageWidth: 1024,
    coreModel: core_models.SD,
    lastError: null,
    lastAttemptAt: null,
    ...props,
  }
}
