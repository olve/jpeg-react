import React from 'react'

import readFileChunks from '../lib/readFileChunks.worker'


export default class File extends React.Component {

  state = {
    file: this.props.file,
    chunks: [],
    chunksRead: 0,
    buffer: null,
  }
  worker = new readFileChunks

  static propTypes = {
    file: React.PropTypes.object.isRequired,
    remove: React.PropTypes.func.isRequired,
  }

  componentDidMount() {
    this.readFile()
  }
  componentWillUnmount() {
    this.worker.terminate()
    this.state = {}
  }

  readFile() {
    this.worker.onmessage = ({data}) => {

      this.setState({chunks: data.chunks}, _ => {

        this.worker.onmessage = this.receiveChunk.bind(this)
        this.worker.postMessage({}) //request next chunk

      })

    }

    this.worker.postMessage(this.state.file)
  }

  receiveChunk({data}) {

    const chunks = [ ...this.state.chunks ]
    chunks[this.state.chunksRead].bytes = data.chunk

    this.setState({chunks, chunksRead: this.state.chunksRead+1}, _ => {
      if (this.state.chunksRead === chunks.length) {
        this.worker.terminate()
        this.joinChunks()
      }
      else {
        this.worker.postMessage({}) //request next chunk
      }
    })
  }

  joinChunks() {
    const {chunks} = this.state
    console.log(chunks)
    const buffer = new ArrayBuffer(chunks[chunks.length-1].end)
    chunks.forEach(chunk => new Uint8Array(buffer).set(chunk.bytes, chunk.start))

    this.setState({
      buffer,
    })

  }




  render() {
    return (
      <div>
        <button onClick={_ => this.props.remove() }>Remove</button>
        <p>
          <span>{this.state.file.name}</span>
          <span>{this.state.buffer ? ` (${this.state.buffer.byteLength} bytes)` : '(loading)'}</span>
        </p>
      </div>
    )
  }
}
