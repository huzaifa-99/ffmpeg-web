import mimeTypes from './mimeTypeWithExtensions.json';

/**
 * Find the mimetype from a file extension
 * @param extension a file extension
 * @returns a string with the mimetype of extension
 */
const getMimeType = (extension = '') => {
  const defaultMimeType = 'text/plain';
  let foundMimeType = defaultMimeType; // set default mime type

  // return default mimetype if extension string is empty
  if (extension.length === 0) return foundMimeType;

  // find the mimetype of the extension
  for (const [mimeType, extensions] of Object.entries(mimeTypes)) {
    if (extensions.includes(extension)) {
      foundMimeType = mimeType;
      break;
    }
  }

  return foundMimeType;
};

export default getMimeType;
