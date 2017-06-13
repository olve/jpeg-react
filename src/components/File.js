import React from 'react'

import readFile from '../lib/readFile.worker'


export default class File extends React.Component {

  state = {
    data: this.props.file,
    buffer: null
  }

  static propTypes = {
    file: React.PropTypes.object.isRequired,
    remove: React.PropTypes.func.isRequired,
  }

  componentDidMount() {
    this.readFile()
  }

  readFile() {
    const worker = new readFile
    worker.onmessage = ({data: buffer}) => this.setState({buffer}, worker.terminate())
    worker.postMessage(this.state.data)
  }

  render() {
    return (
      <div>
        <button onClick={_ => this.props.remove() }>Remove</button>
        <p>
          <span>{this.state.data.name}</span>
          <span>{this.state.buffer ? ` (${this.state.buffer.byteLength} bytes)` : '(loading)'}</span>
        </p>
      </div>
    )
  }
}
