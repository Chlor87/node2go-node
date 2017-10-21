import {Transform} from 'stream'

/**
 * @description Formatter is a transform stream that parses id and body from
 * the incoming message and tries to json parse the body.
 * At the moment it will fail silently, if parse throws, returning the original
 * body.
 */
export default class Formatter extends Transform {

  constructor(opts = {objectMode: true}) {
    super(opts)
  }

  _transform(c, e, d) {
    let [id, data] = c.split(';')
    try {
      data = JSON.parse(data)
    } catch (err) {}
    this.push({id, data})
    d()
  }

}
