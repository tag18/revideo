/**
 * Regex for sanitizing project names and filenames.
 * Allows alphanumeric characters, dashes, underscores, and Chinese characters.
 */
export const FILENAME_SANITIZATION_REGEX = /[^a-zA-Z0-9-_\u4e00-\u9fa5]/g;
