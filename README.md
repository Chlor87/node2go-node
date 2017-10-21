# Node2Go

## Description

This is the JavaScript part of the library.
Node2Go is an easy way to call predefined Go functions from NodeJS with json data going back and forth.
Im aware of the fact, that there's a library similar to this one on Github. It's called [gonode](https://github.com/jgranstrom/gonode).
I just wanted to write one myself, for fun mostly.
 
## Features
* ES6 ready
* async execution
* JSON format communication
* no dependencies besides babel (ES6 only modules)
* simple API - not yet documented in this file

To be continued...

## Example

Also found in the example directory
```javascript
/**
 * It's a pretty naive example, of course Go's recursive fibonacci will be
 * faster than Node's one.
 *
 * It's more of a general presentation of how to use this library.
 */

/**
 * Import the Client
 */
import GoClient from '../index'

async function main() {

  /**
   *
   * @description Create the client instance. The only required param is the
   * execPath to a Go binary.
   * @type {Client}
   */
  let go = new GoClient({execPath: '../go/bin/fibonacci'})

  try {

    /**
     *
     * @description start - spawn the child process, connect to it and start
     * listening for incoming messages. Remember to catch potential errors.
     */
    await go.start()
    console.log('Spawned, connected to socket, ready to read and write.')

    let res = await Promise.all([
      time(fibonacci, 'NodeJS', n),

      /**
       * @description normally it look's as simple as:
       * await go.call('fibonacci', {n})
       */
      time(go.call.bind(go), 'Go', 'fibonacci', {n})
    ])

    console.log(JSON.stringify(res, null, 2))

    /**
     * @description Remember to stop the client at some point. Killing the
     * master process also kills the child, but this is the graceful way.
     */
    go.stop()

  } catch(err) {
    console.log(err)
  }
}

main()

/**
 *
 * @type {number} - the fibonacci sequence will be calculated for this number
 */
const n = 30

/**
 *
 * @description just the usual recursive fibonacci sequence algorithm
 * @param {number} n
 * @returns {number}
 */
function fibonacci(n) {
  return !n ? n : n <= 2 ? 1 : fibonacci(n-2) + fibonacci(n - 1)
}

/**
 *
 * @description measure the time the passed function took to complete
 * @param {function} fn
 * @param {string} label
 * @param {*} args
 * @returns {{label: {string}, res: *, time: string}}
 */
async function time(fn, label, ...args) {
  let start = Date.now()
  let res = await Promise.resolve(fn(...args))
  return {label, res, time: `${((Date.now() - start) / 1e3).toFixed(3)}s`}
}

```

