import {Transform} from 'stream'
import {decoder} from './utils'

/**
 * @description Splitter decodes incoming buffer to utf8 string and splits the
 * chunks on a given character.
 */
export default class Splitter extends Transform {

  /**
   *
   * @param {string} char - split character
   * @param {Object} opts - NodeJS stream opts
   */
  constructor(char = '\n', opts = {objectMode: true}) {
    super(opts)
    this.char = char
    this.prev = ''
  }

  _transform(c, e, d) {
    this.prev += decoder.write(c)
    let split = this.prev.split(this.char)
    this.prev = split.pop()
    split.forEach(e => {
      this.push(e)
    })
    d()
  }

  _flush(d) {
    this.prev += decoder.end()
    if (this.prev) {
      this.push(this.prev)
    }
    d()
  }

}
