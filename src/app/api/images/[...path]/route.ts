import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const imagePath = path.join('/')
    const minioEndpoint = process.env.MINIO_ENDPOINT!
    const bucketName = process.env.MINIO_BUCKET_NAME!
    
    // Construct the MinIO URL
    const imageUrl = `${minioEndpoint}/${bucketName}/${imagePath}`
    
    console.log('Fetching image from MinIO:', imageUrl)
    
    // Fetch the image from MinIO
    const response = await fetch(imageUrl)
    
    if (!response.ok) {
      console.error('Image not found in MinIO:', imageUrl, response.status)
      return new NextResponse('Image not found', { status: 404 })
    }
    
    const imageBuffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || 'image/jpeg'
    
    console.log('Successfully fetched image, content-type:', contentType)
    
    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    })
  } catch (error) {
    console.error('Error serving image:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}