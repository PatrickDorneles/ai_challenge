import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { PrismaClient, generations, generation_status as GenerationStatus } from '@prisma/client'

const prisma = new PrismaClient()

export const callback = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'No body provided' }),
      }
    }

    const data = JSON.parse(event.body)
    console.log('Received callback data:', data)

    const updatedGeneration = await prisma.generations.update({
      where: {
        generationId: data.generationId,
      },
      data: {
        status: GenerationStatus.COMPLETE,
        updatedAt: new Date(),
        imageUrls: data.imageUrls,
      },
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Callback processed successfully',
        data: updatedGeneration.generationId,
      }),
    }
  } catch (error) {
    console.error('Error processing callback:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process callback' }),
    }
  }
}
