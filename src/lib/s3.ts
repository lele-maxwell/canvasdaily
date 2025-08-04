import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { generateUniqueFileName } from "./utils"

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT!,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!, 
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for MinIO
  tls: false, // Disable TLS for local MinIO
})

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME!

export async function uploadFileToS3(file: File, folder: string = 'uploads'): Promise<string> {
  const fileName = generateUniqueFileName(file.name)
  const key = `${folder}/${fileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: Buffer.from(await file.arrayBuffer()),
    ContentType: file.type,
    ACL: 'public-read',
  })

  await s3Client.send(command)
  
  // For MinIO, construct URL based on endpoint
  const minioEndpoint = process.env.MINIO_ENDPOINT!.replace(/\/$/, '') // Remove trailing slash
  return `${minioEndpoint}/${BUCKET_NAME}/${key}`
}

export async function deleteFileFromS3(fileUrl: string): Promise<void> {
  // Extract key from URL
  const url = new URL(fileUrl)
  const key = url.pathname.substring(1) // Remove leading slash

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  })

  await s3Client.send(command)
}

export async function getSignedUploadUrl(fileName: string, fileType: string, folder: string = 'uploads'): Promise<{ uploadUrl: string; fileUrl: string }> {
  const uniqueFileName = generateUniqueFileName(fileName)
  const key = `${folder}/${uniqueFileName}`

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    ACL: 'public-read',
  })

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }) // 1 hour
  const minioEndpoint = process.env.MINIO_ENDPOINT!.replace(/\/$/, '') // Remove trailing slash
  const fileUrl = `${minioEndpoint}/${BUCKET_NAME}/${key}`

  return { uploadUrl, fileUrl }
}

export const ALLOWED_FILE_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  videos: ['video/mp4', 'video/webm', 'video/quicktime'],
  documents: ['application/pdf', 'text/plain'],
}

export const MAX_FILE_SIZES = {
  image: 10, // 10MB
  video: 100, // 100MB
  document: 5, // 5MB
}