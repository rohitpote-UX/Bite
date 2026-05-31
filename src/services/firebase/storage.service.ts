/**
 * TiffinFlow Storage Service using Local File URIs / Python Backend Mock
 * Stubbed out Firebase Storage to run standalone.
 */

/**
 * Upload payment screenshot
 * @returns the local imageUri directly to allow instant rendering and zero cloud dependency.
 */
export const uploadPaymentScreenshot = async (
  userId: string,
  paymentId: string,
  imageUri: string
): Promise<string> => {
  console.log('Skipping upload to Firebase Storage, using local URI:', imageUri);
  return imageUri;
};

/**
 * Upload user profile photo
 * @returns local imageUri
 */
export const uploadProfilePhoto = async (
  userId: string,
  imageUri: string
): Promise<string> => {
  console.log('Skipping profile upload to Firebase Storage, using local URI:', imageUri);
  return imageUri;
};

/**
 * Delete a file from storage
 */
export const deleteFile = async (url: string): Promise<void> => {
  console.log('deleteFile stub called:', url);
};
