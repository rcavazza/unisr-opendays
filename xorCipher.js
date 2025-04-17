const crypto = require('crypto');

function xorCipher(text, key) {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

function encode(text, key) {
  const xored = xorCipher(text, key);
  return Buffer.from(xored).toString('base64');
}

function decode(encoded, key) {
  const decoded = Buffer.from(encoded, 'base64').toString();
  return xorCipher(decoded, key);
}

function generateKey() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  encode,
  decode,
  generateKey
};