/**
 * Calculate reading time based on content
 * Assumes average reading speed of 200 words per minute
 */
function calculateReadingTime(content) {
  if (!content) return 0;

  // Remove HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');
  
  // Count words
  const words = plainText.trim().split(/\s+/).length;
  
  // Calculate reading time (200 words per minute is average)
  const readingTimeMinutes = Math.ceil(words / 200);
  
  return readingTimeMinutes;
}

module.exports = { calculateReadingTime };
