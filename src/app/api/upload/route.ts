import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadFileToS3, ALLOWED_FILE_TYPES, MAX_FILE_SIZES } from '@/lib/s3'
import { validateFileType, validateFileSize } from '@/lib/utils'

// POST /api/upload - Upload file to MinIO
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Determine file category
    let category: 'image' | 'video' | 'document' = 'document'
    let allowedTypes: string[] = []
    let maxSize = 5

    if (ALLOWED_FILE_TYPES.images.includes(file.type)) {
      category = 'image'
      allowedTypes = ALLOWED_FILE_TYPES.images
      maxSize = MAX_FILE_SIZES.image
    } else if (ALLOWED_FILE_TYPES.videos.includes(file.type)) {
      category = 'video'
      allowedTypes = ALLOWED_FILE_TYPES.videos
      maxSize = MAX_FILE_SIZES.video
    } else if (ALLOWED_FILE_TYPES.documents.includes(file.type)) {
      category = 'document'
      allowedTypes = ALLOWED_FILE_TYPES.documents
      maxSize = MAX_FILE_SIZES.document
    }

    // Validate file type
    if (!validateFileType(file, allowedTypes)) {
      return NextResponse.json(
        { success: false, error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size
    if (!validateFileSize(file, maxSize)) {
      return NextResponse.json(
        { success: false, error: `File too large. Maximum size: ${maxSize}MB` },
        { status: 400 }
      )
    }

    // Upload to MinIO
    const folder = `submissions/${category}s`
    const fileUrl = await uploadFileToS3(file, folder)

    return NextResponse.json({
      success: true,
      data: {
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        category
      }
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}