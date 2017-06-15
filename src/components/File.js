import React from 'react'

import {Card, CardHeader, CardText} from 'material-ui/Card'
import LinearProgress from 'material-ui/LinearProgress'
import CloseIcon from 'material-ui/svg-icons/navigation/close'

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
    const buffer = new ArrayBuffer(chunks[chunks.length-1].end)
    chunks.forEach(chunk => new Uint8Array(buffer).set(chunk.bytes, chunk.start))

    this.setState({
      buffer,
    })

  }

  render() {
    return (
      <Card className="file">

          <CardHeader
            className={`file-header ${this.state.buffer === null ? 'loading' : ''}`}
            title={
              <div className="wrap">
                <p>{this.state.file.name}</p>
                <div
                  onTouchTap={_ => this.props.remove()}
                  className="closebutton"
                  alt="remove file from list"
                  title="remove file from list" >
                  <CloseIcon />
                </div>
              </div>
            }
            showExpandableButton={false}
            actAsExpander={true}>

            { this.state.chunks.length === this.state.chunksRead ? null : <LinearProgress
              className="progress"
              mode="determinate"
              value={Math.floor((this.state.chunksRead/this.state.chunks.length) * 100)}
            /> }


          </CardHeader>



          <CardText expandable={this.state.buffer ? true : false}>

            <p>{this.state.buffer ? ` (${this.state.buffer.byteLength} bytes)` : '(loading)'}</p>

          </CardText>



      </Card>
    )
  }
}
