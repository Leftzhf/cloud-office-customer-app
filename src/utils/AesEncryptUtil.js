import CryptoJS from 'crypto-js/crypto-js'

/**
 * AES加密 ：字符串 key iv  返回base64
 */
export function Encrypt(word, keyStr) {
  let key, iv, ivStr
  if (!keyStr) {
    throw new Error('keyStr 不能为空')
  }
  ivStr = keyStr
  key = CryptoJS.enc.Utf8.parse(keyStr)
  iv = CryptoJS.enc.Utf8.parse(ivStr)
  let srcs = CryptoJS.enc.Utf8.parse(word)
  var encrypted = CryptoJS.AES.encrypt(srcs, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding
  })
  // console.log("-=-=-=-", encrypted.ciphertext)
  return CryptoJS.enc.Base64.stringify(encrypted.ciphertext)
}

/**
 * AES 解密 ：字符串 key iv  返回base64
 */
export function Decrypt(word, keyStr) {
  let key, iv, ivStr
  if (!keyStr) {
    throw new Error('keyStr 不能为空')
  }
  ivStr = keyStr
  key = CryptoJS.enc.Utf8.parse(keyStr)
  iv = CryptoJS.enc.Utf8.parse(ivStr)

  const base64 = CryptoJS.enc.Base64.parse(word)
  const src = CryptoJS.enc.Base64.stringify(base64)

  var decrypt = CryptoJS.AES.decrypt(src, key, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding
  })

  var decryptedStr = decrypt.toString(CryptoJS.enc.Utf8)
  return decryptedStr.toString()
}
