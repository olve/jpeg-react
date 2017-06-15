import React from 'react'

import {Card, CardHeader, CardText} from 'material-ui/Card'
import LinearProgress from 'material-ui/LinearProgress'
import CloseIcon from 'material-ui/svg-icons/navigation/close'

import readFileChunks from '../lib/readFileChunks.worker'

import Jpeg from './Jpeg'

export default class File extends React.Component {

  state = {
    file: this.props.file,
    numChunks: 0,
    chunksRead: 0,
    buffer: null,
    expanded: false,
  }

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

  getFileTypeView() {
    if (!this.state.buffer) return null
    const key = `view-${this.state.file.uuid}`
    switch (this.state.file.type) {
      case 'image/jpeg':
        return <Jpeg file={this.state.file} buffer={this.state.buffer} key={key} />
      default:
        return <p>unknown filetype</p>
    }
  }

  toggleExpanded() {
    this.setState({expanded: !this.state.expanded})
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
            onTouchTap={this.toggleExpanded.bind(this)}>

            { this.state.buffer ? null : <LinearProgress
              className="progress"
              mode="determinate"
              value={Math.floor((this.state.chunksRead/this.state.numChunks) * 100)}
            /> }


          </CardHeader>

          <div className={`content ${this.state.expanded ? 'expanded' : ''}`}>
            { this.getFileTypeView() }
          </div>

      </Card>
    )
  }
}
