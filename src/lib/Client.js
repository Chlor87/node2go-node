import net from 'net'
import os from 'os'
import path from 'path'
import {spawn} from 'child_process'

import Splitter from './Splitter'
import Formatter from './Formatter'

import {randStringGen, defer, decoder} from './utils'

/**
 * name of the acknowledgement message sent by Go counterpart, that informs
 * client that the server is up and running
 * @type {string}
 */
const ack = 'ACK'

export default class Client {

  /**
   *
   * @param {string} execPath - compiled Go binary
   * @param {function} gen - generator function returning random strings
   * @param {boolean} dev - flag that decides if the Client should run a binary, or try
   * to go run the file. Only single file commands are supported.
   */
  constructor({execPath, gen = randStringGen, dev = false}) {
    this.gen = gen()
    this.execPath = execPath
    this.opMap = new Map()
    this.dev = dev
  }

  /**
   *
   * @description get the next value from the generator
   * @returns {*} - string by default, can be anything
   */
  getId() {
    return this.gen.next().value
  }

  /**
   *
   * @description spawn
   * I don't use `inherit` on streams in order to be able to listen for events
   * they generate during initialization phase.
   *
   * 1. generate unix domain socket path (/tmp/go2node-${random string}.sock)
   * 2. spawn child process, either with a compiled binary or with go run
   *    command
   * 3. connect child's stderr to parent's
   * 3a. listen to errors and reject, if error was the first event fired by the
   *     child - reject
   * 3b. wait for acknowledgement, that the socket was created and the server is
   *     up and running - connect child's stdout to parent's and resolve
   * @returns {Promise}
   */
  spawn() {
    return new Promise((resolve, reject) => {
      let {dev} = this
      this.sockPath = path.join(os.tmpdir(), `go2node-${this.getId()}.sock`)
      let command   = dev ? 'go' : this.execPath,
          stdArgs   = ['--addr', this.sockPath],
          args      = dev ? ['run', this.execPath, ...stdArgs] : stdArgs,
          childProc = this.childProc = spawn(command, args, {
            stdio: ['ignore', 'pipe', 'pipe']
          })

      childProc.on('error', reject)
      childProc.stderr.pipe(process.stderr)
      childProc.stderr.on('data', chk => {
        reject(decoder.end(chk))
      })

      childProc.stdout.on('data', chk => {
        if (~decoder.end(chk).search(ack)) {
          this.childProc.stdout.pipe(process.stdout)
          resolve()
        }
      })
    })
  }

  /**
   *
   * @description create a client and wait for connection or error
   * @returns {Promise}
   */
  connect() {
    return new Promise((resolve, reject) => {
      this.client = net.createConnection(this.sockPath)
      this.client.on('connect', resolve)
      this.client.on('error', reject)
    })
  }

  /**
   *
   * @description Read client's stream, split it on newlines and format it.
   * Then pick appropriate promise from the map and resolve it or reject, if
   * Go's response has `error` field. Remove the entry from map.
   */
  async run() {
    let {opMap} = this
    this.client
      .pipe(new Splitter('\n'))
      .pipe(new Formatter())
      .on('data', ({id, data}) => {
        let {resolve, reject} = opMap.get(id)
        data.hasOwnProperty('error') ? reject(data.error) : resolve(data)
        opMap.delete(id)
      })
  }

  /**
   *
   * @description just a shortcut for startup procedure
   */
  async start() {
    await this.spawn()
    await this.connect()
    this.run()
  }

  /**
   *
   * @description disconnect the client and kill the child
   */
  stop() {
    this.client.end()
    this.childProc.kill('SIGINT')
  }

  /**
   *
   * @description call sends data to child.
   * 1. generate message id
   * 2. create message `${id};${function name};${json}`
   * 3. set the promise in the map, using id as key
   *
   * @param {string} fnName - the name of the function to be called in Go
   * counterpart
   * @param {Object|Array|*} data - anything that's JSON.stringify can take
   * @returns {Promise}
   */
  async call(fnName = '', data) {
    let id       = this.getId(),
        msg      = `${id};${fnName};${JSON.stringify(data)}\n`,
        deferred = defer()
    this.opMap.set(id, deferred)
    this.client.write(msg)
    return deferred.promise
  }

}
