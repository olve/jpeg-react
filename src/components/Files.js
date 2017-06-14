/*global window:true*/
/*eslint no-undef: "error"*/

import React from 'react'
import uuid4 from 'uuid/v4'
import { MuiThemeProvider} from 'material-ui'

import File from './File'

export default class Files extends React.Component {

  state = {
    files: [],
  }

  componentDidMount() {
    window.addEventListener('dragenter', this.cancelEvent)
    window.addEventListener('dragover', this.cancelEvent)
    window.addEventListener('dragleave', this.cancelEvent)
    window.addEventListener('drop', this.onDrop.bind(this))
  }

  componentWillUnmount() {
    window.removeEventListener('dragenter', this.cancelEvent)
    window.removeEventListener('dragover', this.cancelEvent)
    window.removeEventListener('dragleave', this.cancelEvent)
    window.removeEventListener('drop', this.cancelEvent)
  }

  cancelEvent(event) {
    event.stopPropagation()
    event.preventDefault()
    return event
  }

  addFiles(newFiles) {
    const files = newFiles.map(file => {
      file.uuid = uuid4() //<File /> elements need static key={}, otherwise their constructor will call whenever this.state.files changes
      return file
    })
    this.setState({files: [ ...this.state.files, ...files ] })
  }

  onDrop(event) {
    if(event.dataTransfer.files.length) {
      this.cancelEvent(event)
      event.dataTransfer.dropEffect = 'copy'
      this.addFiles([...Array.from(event.dataTransfer.files)])
    }
  }

  onFileSelect(event) {
    this.addFiles(Array.from(event.target.files))
    event.target.value = null
  }

  removeFile(index) {
    const files = [ ...this.state.files ]
    files.splice(index, 1)
    this.setState({files})
  }

  render() {
    return (
      <MuiThemeProvider>

        <div>
          <p>drop files.</p>
          <input type="file" onChange={this.onFileSelect.bind(this)} multiple={true} />
          <hr/>
          <div>
            {
              this.state.files.map((file, index) => <File
                key={`file-${file.uuid}`}
                file={file}
                remove={ this.removeFile.bind(this, index) } />)
            }
          </div>
        </div>

      </MuiThemeProvider>
    )
  }
}
