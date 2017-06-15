import React from 'react'

import {Card, CardHeader, CardText} from 'material-ui/Card'
import LinearProgress from 'material-ui/LinearProgress'
import CloseIcon from 'material-ui/svg-icons/navigation/close'

import readFileChunks from '../lib/readFileChunks.worker'
//import joinFileChunks from '../lib/joinFileChunks.worker'



export default class File extends React.Component {

  state = {
    file: this.props.file,
    numChunks: 0,
    chunksRead: 0,
    buffer: null,
  }

  get fileReadComplete() { return this.chunksRead === this.chunks.length }

  tempBuffer = new ArrayBuffer(this.props.file.size)
  tempArray = new Uint8Array(this.tempBuffer)

  readWorker = new readFileChunks

  static propTypes = {
    file: React.PropTypes.object.isRequired,
    remove: React.PropTypes.func.isRequired,
  }

  componentDidMount() {
    this.readFile()
  }
  componentWillUnmount() {
    this.readWorker.terminate()
    this.state = {}
  }



  readFile() {
    this.readWorker.onmessage = ({data}) => {

      this.setState({numChunks: data.numChunks}, _ => {

        this.readWorker.onmessage = this.receiveChunk.bind(this)
        this.readWorker.postMessage({}) //request next chunk

      })

    }

    this.readWorker.postMessage(this.state.file)
  }

  receiveChunk({data}) {

    this.tempArray.set(data.bytes, data.start)

    this.setState({chunksRead: 1+this.state.chunksRead}, _ => {
      if   (this.state.chunksRead !== this.state.numChunks) this.readWorker.postMessage({}) //request next chunk
      else {
        this.setState({buffer: this.tempBuffer}, _ => this.tempBuffer = null)
        this.readWorker.terminate()
      }
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

            { this.state.numChunks === this.state.chunksRead ? null : <LinearProgress
              className="progress"
              mode="determinate"
              value={Math.floor((this.state.chunksRead/this.state.numChunks) * 100)}
            /> }


          </CardHeader>



          <CardText expandable={this.state.buffer !== null ? true : false}>

            <p>{this.state.buffer ? ` (${this.state.buffer.byteLength} bytes)` : '(loading)'}</p>

          </CardText>



      </Card>
    )
  }
}
