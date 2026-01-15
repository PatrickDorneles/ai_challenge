import { Controller, Post, Body, Get, Param } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { AiGenerateImageRequestDto } from './dtos/ai-generate-image.request.dto'
import { GenerateImageService } from './services/generate-image.service'
import { GetGenerationStatusService } from './services/get-generation-status.service'
import { GetGenerationStatusResponseDto } from './dtos/get-generation-status.response.dto'

@ApiTags('images')
@Controller('api/generation')
export class AiController {
  constructor(
    private readonly generateImageService: GenerateImageService,
    private readonly getGenerationStatusService: GetGenerationStatusService
  ) { }

  @Post()
  @ApiOperation({ summary: 'Generate images based on a text prompt' })
  @ApiResponse({
    status: 201,
    description: 'The image generation request has been accepted',
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  generateImage(@Body() aiRequest: AiGenerateImageRequestDto) {
    return this.generateImageService.generateImage(aiRequest.prompt)
  }

  @Get(':generationId')
  @ApiOperation({ summary: 'Get the status of an image generation request' })
  @ApiResponse({
    status: 200,
    description: 'The image generation status has been retrieved',
  })
  @ApiResponse({ status: 400, description: 'Invalid generation ID' })
  @ApiResponse({ status: 404, description: 'Generation not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  getGenerationStatus(@Param('generationId') generationId: string): Promise<GetGenerationStatusResponseDto> {
    return this.getGenerationStatusService.getGenerationStatus(generationId)
  }
}
