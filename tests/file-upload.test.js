
const { 
  validateFile, 
  validateFileExtension, 
  validateFileMagicNumbers, 
  validateFileName,
  FileUploadError,
  KYC_UPLOAD_CONFIG 
} = require('../lib/upload')

// Mock file objects
const createMockFile = (name, type, size, content = new Uint8Array([0xFF, 0xD8, 0xFF])) => ({
  name,
  type,
  size,
  arrayBuffer: jest.fn().mockResolvedValue(content.buffer),
  slice: jest.fn().mockReturnValue({
    arrayBuffer: jest.fn().mockResolvedValue(content.buffer)
  })
})

describe('File Upload Security', () => {
  test('should validate file size limits', async () => {
    const largeFile = createMockFile('test.jpg', 'image/jpeg', 20 * 1024 * 1024) // 20MB

    await expect(validateFile(largeFile, KYC_UPLOAD_CONFIG))
      .rejects.toThrow(FileUploadError)
  })

  test('should validate MIME types', async () => {
    const invalidFile = createMockFile('test.exe', 'application/x-executable', 1024)

    await expect(validateFile(invalidFile, KYC_UPLOAD_CONFIG))
      .rejects.toThrow(FileUploadError)
  })

  test('should validate empty files', async () => {
    const emptyFile = createMockFile('test.jpg', 'image/jpeg', 0)

    await expect(validateFile(emptyFile, KYC_UPLOAD_CONFIG))
      .rejects.toThrow(FileUploadError)
  })

  test('should validate file extension matches MIME type', async () => {
    const mismatchFile = createMockFile('test.pdf', 'image/jpeg', 1024)

    await expect(validateFileExtension(mismatchFile))
      .rejects.toThrow(FileUploadError)
  })

  test('should validate JPEG magic numbers', async () => {
    const invalidJpeg = createMockFile(
      'test.jpg', 
      'image/jpeg', 
      1024, 
      new Uint8Array([0x00, 0x00, 0x00]) // Invalid JPEG signature
    )

    await expect(validateFileMagicNumbers(invalidJpeg))
      .rejects.toThrow(FileUploadError)
  })

  test('should validate PNG magic numbers', async () => {
    const validPng = createMockFile(
      'test.png', 
      'image/png', 
      1024, 
      new Uint8Array([0x89, 0x50, 0x4E, 0x47])
    )

    await expect(validateFileMagicNumbers(validPng))
      .resolves.not.toThrow()
  })

  test('should reject dangerous file extensions', async () => {
    await expect(validateFileName('malware.exe'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('script.php'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('batch.bat'))
      .rejects.toThrow(FileUploadError)
  })

  test('should reject directory traversal attempts', async () => {
    await expect(validateFileName('../../../etc/passwd'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('..\\windows\\system32\\config'))
      .rejects.toThrow(FileUploadError)
  })

  test('should reject files with invalid characters', async () => {
    await expect(validateFileName('file<script>.jpg'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('file|pipe.jpg'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('file"quote.jpg'))
      .rejects.toThrow(FileUploadError)
  })

  test('should reject Windows reserved names', async () => {
    await expect(validateFileName('CON.jpg'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('PRN.pdf'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('COM1.png'))
      .rejects.toThrow(FileUploadError)
  })

  test('should reject hidden files', async () => {
    await expect(validateFileName('.htaccess'))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('.env'))
      .rejects.toThrow(FileUploadError)
  })

  test('should reject files with trailing whitespace', async () => {
    await expect(validateFileName('file.jpg '))
      .rejects.toThrow(FileUploadError)

    await expect(validateFileName('file.pdf\t'))
      .rejects.toThrow(FileUploadError)
  })

  test('should reject overly long file names', async () => {
    const longName = 'a'.repeat(300) + '.jpg'
    
    await expect(validateFileName(longName))
      .rejects.toThrow(FileUploadError)
  })

  test('should accept valid files', async () => {
    const validFile = createMockFile('document.jpg', 'image/jpeg', 1024 * 1024)

    await expect(validateFile(validFile, KYC_UPLOAD_CONFIG))
      .resolves.not.toThrow()
  })

  test('should accept valid PDF files', async () => {
    const validPdf = createMockFile(
      'document.pdf', 
      'application/pdf', 
      2 * 1024 * 1024,
      new Uint8Array([0x25, 0x50, 0x44, 0x46]) // PDF signature
    )

    await expect(validateFile(validPdf, KYC_UPLOAD_CONFIG))
      .resolves.not.toThrow()
  })
})

console.log('File Upload Security tests defined')
