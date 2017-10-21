import {StringDecoder} from 'string_decoder'

/**
 *
 * @description single instance of StringDecoder is all we need
 */
export const decoder = new StringDecoder('utf8')

/**
 * @description a seed for default generator
 * @type {string}
 */
const defaultCharset = '0123456789abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ'

/**
 *
 * @param {number} len - random string length
 * @param {string} charSet - character set of which the random string should
 * consist of
 * @yields {string}
 */
export function * randStringGen(len = 6, charSet = defaultCharset) {
  let cl = charSet.length
  while (true) {
    let out = ''
    for (let i = 0; i <= len; i++) {
      out += charSet[~~(Math.random() * cl)]
    }
    yield out
  }
}

/**
 *
 * @description I know it's an anti-pattern to defer promises, but I need to
 * create them in one place and finalize in the other
 * @returns {{promise: Promise, resolve: function, reject: function}}
 */
export const defer = ()=> {
  let deferred = {}
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })
  return deferred
}
