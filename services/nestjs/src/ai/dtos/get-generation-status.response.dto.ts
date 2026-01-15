import { ApiProperty } from '@nestjs/swagger'
import { generation_status } from '@prisma/client'
import { Exclude, Expose } from 'class-transformer'

@Exclude()
export class GetGenerationStatusResponseDto {
  @Expose()
  @ApiProperty({
    description: 'The current status of the image generation',
    example: 'COMPLETED',
  })
  status: generation_status

  @Expose()
  @ApiProperty({
    description: 'The text prompt used for image generation',
    example: 'A beautiful sunset over a calm ocean',
  })
  prompt: string

  @Expose()
  @ApiProperty({
    description: 'The URLs of the generated images',
    example: ["https://example.com/image1.png", "https://example.com/image2.png"],
  })
  imageUrls?: string[]
}
