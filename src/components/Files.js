/*global window:true*/
/*eslint no-undef: "error"*/

import React from 'react'

export default class Files extends React.Component {

  state = {
    files: []
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

  addFiles(files) {
    console.log(files)
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
  }

  /*
    if (!event.dataTransfer.files.length) return; //user dropped something other than files, stop handling event
    event = this.cancelEvent(event);
    event.dataTransfer.dropEffect = "copy";
    for (var i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
      var file = new File(fileData, function onFileUpdate() {this.forceUpdate();}.bind(this));
      this.setState({files: this.state.files.concat([file])});
    }
    this.setState({active: this.state.files.length-1});
*/

  render() {
    return (
      <div>
        drop files.
        <input type="file" onChange={this.onFileSelect.bind(this)}/>
      </div>
    )
  }
}
