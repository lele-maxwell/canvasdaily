/**
 * Converts a MinIO URL to a proxied URL that goes through our Next.js API
 * This solves CORS issues and ensures images are properly served
 */
export function getProxiedImageUrl(imageUrl: string): string {
  if (!imageUrl) return ''
  
  // If it's not a MinIO URL, return as-is (for external URLs like Unsplash)
  if (!isMinioUrl(imageUrl)) {
    return imageUrl
  }
  
  try {
    const url = new URL(imageUrl)
    const bucketName = 'canvasdaily-uploads' // Hard-coded since env vars aren't available on client
    
    // Extract the path after the bucket name
    // MinIO URL format: http://10.223.54.231:9000/canvasdaily-uploads/uploads/filename.jpg
    const pathParts = url.pathname.split('/')
    const bucketIndex = pathParts.indexOf(bucketName)
    
    if (bucketIndex === -1) {
      console.warn('Bucket name not found in MinIO URL:', imageUrl)
      return imageUrl // Return original URL as fallback
    }
    
    // Get everything after the bucket name
    const imagePath = pathParts.slice(bucketIndex + 1).join('/')
    
    // Return the proxied URL
    return `/api/images/${imagePath}`
  } catch (error) {
    console.error('Error converting MinIO URL to proxy URL:', error)
    return imageUrl // Return original URL as fallback
  }
}

/**
 * Checks if a URL is a MinIO URL that needs proxying
 */
export function isMinioUrl(url: string): boolean {
  if (!url) return false
  
  try {
    // Check if URL contains the MinIO endpoint pattern
    return url.includes('10.223.54.231:9000') || url.includes('canvasdaily-uploads')
  } catch {
    return false
  }
}