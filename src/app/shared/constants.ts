export const WORD_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export const DOCUMENT_TYPES = ['application/pdf', 'application/msword', WORD_MIME];

export const WEB_SAFE_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'image/avif',
];

export const ALLOWED_TYPES = [...WEB_SAFE_IMAGE_TYPES, ...DOCUMENT_TYPES];