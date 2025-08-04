require('dotenv').config();
const { S3Client, GetBucketPolicyCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: process.env.MINIO_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
  tls: false,
});

const BUCKET_NAME = process.env.MINIO_BUCKET_NAME;

async function checkAndSetBucketPolicy() {
  try {
    console.log('🔍 Checking bucket policy for:', BUCKET_NAME);
    
    // Try to get current policy
    try {
      const getPolicyCommand = new GetBucketPolicyCommand({ Bucket: BUCKET_NAME });
      const policy = await s3Client.send(getPolicyCommand);
      console.log('📋 Current bucket policy:', policy.Policy);
    } catch (error) {
      if (error.name === 'NoSuchBucketPolicy') {
        console.log('📋 No bucket policy found, will create one');
      } else {
        console.error('❌ Error getting bucket policy:', error.message);
      }
    }
    
    // Set public read policy
    const publicReadPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: '*',
          Action: 's3:GetObject',
          Resource: `arn:aws:s3:::${BUCKET_NAME}/*`
        }
      ]
    };
    
    console.log('🔧 Setting public read policy...');
    
    const putPolicyCommand = new PutBucketPolicyCommand({
      Bucket: BUCKET_NAME,
      Policy: JSON.stringify(publicReadPolicy)
    });
    
    await s3Client.send(putPolicyCommand);
    console.log('✅ Bucket policy set successfully!');
    
    // Verify the policy was set
    const verifyCommand = new GetBucketPolicyCommand({ Bucket: BUCKET_NAME });
    const verifyPolicy = await s3Client.send(verifyCommand);
    console.log('✅ Verified policy:', JSON.parse(verifyPolicy.Policy));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAndSetBucketPolicy();