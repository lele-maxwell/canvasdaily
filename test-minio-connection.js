const { S3Client, CreateBucketCommand, ListBucketsCommand, PutObjectCommand } = require("@aws-sdk/client-s3");

// Load environment variables
require('dotenv').config();

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Required for MinIO
  tls: process.env.MINIO_USE_SSL === 'true',
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME;

async function testMinIOConnection() {
  try {
    console.log('🔍 Testing MinIO connection...');
    console.log('Endpoint:', process.env.MINIO_ENDPOINT);
    console.log('Bucket:', BUCKET_NAME);
    
    // List buckets to test connection
    const listCommand = new ListBucketsCommand({});
    const buckets = await s3Client.send(listCommand);
    console.log('✅ Connected to MinIO successfully!');
    console.log('📦 Available buckets:', buckets.Buckets?.map(b => b.Name) || []);
    
    // Check if our bucket exists
    const bucketExists = buckets.Buckets?.some(bucket => bucket.Name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`🔨 Creating bucket: ${BUCKET_NAME}`);
      const createCommand = new CreateBucketCommand({
        Bucket: BUCKET_NAME,
      });
      await s3Client.send(createCommand);
      console.log('✅ Bucket created successfully!');
    } else {
      console.log('✅ Bucket already exists!');
    }
    
    // Test upload with a small test file
    console.log('🧪 Testing file upload...');
    const testContent = 'Hello from Canvas Daily!';
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: 'test/connection-test.txt',
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });
    
    await s3Client.send(uploadCommand);
    console.log('✅ Test file uploaded successfully!');
    
    const fileUrl = `${process.env.MINIO_ENDPOINT}/${BUCKET_NAME}/test/connection-test.txt`;
    console.log('📁 File URL:', fileUrl);
    
    console.log('🎉 MinIO setup is working correctly!');
    
  } catch (error) {
    console.error('❌ MinIO connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testMinIOConnection();