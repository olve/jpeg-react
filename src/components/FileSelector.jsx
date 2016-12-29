import React from 'react'

export default class FileSelector extends React.Component {
  /*
  input element for adding new files.
  Binds handlers to window element for drag&drop events.
  Bind event to another element for dedicated dropzones. */

  static contextTypes = {
    addFiles: React.PropTypes.func.isRequired,
    files:    React.PropTypes.array.isRequired,
  }

  componentDidMount() {
    window.addEventListener("dragenter", this.dragEnter)
    window.addEventListener("dragover", this.dragOver)
    window.addEventListener("dragleave", this.dragLeave)
    window.addEventListener("drop", this.drop)
  }
  coxmponentWillUnmount() {
    window.removeEventListener("dragenter", this.dragEnter)
    window.removeEventListener("dragover", this.dragOver)
    window.removeEventListener("dragleave", this.dragLeave)
    window.removeEventListener("drop", this.drop)
  }

  cancelEvent(event) {
    event.stopPropagation()
    event.preventDefault()
    return event
  }

  /*
  bind event handlers to class instance with = () => syntax to avoid .bind
  and onEvent={function(event) {handler(event)}.
  autobind-decorators don't play well with react hot-reload (v2.0.0-alpha-4 supports it,
  but the branch is discontinued.)
  Component will realistically only be instantialised once, so this should be fine.*/
  dragEnter = (event) => this.cancelEvent(event)
  dragOver  = (event) => this.cancelEvent(event)
  dragLeave = (event) => this.cancelEvent(event)
  drop      = (event) => {

    //break if user dropped something other than files (text, element, ...)
    if (!event.dataTransfer.files.length) return

    event = this.cancelEvent(event)
    event.dataTransfer.dropEffect = 'copy'

    this.context.addFiles(event.dataTransfer.files)

  }
  change = (event) => {

    this.context.addFiles(event.target.files)

    //clear <input> selection
    event.target.value = null

  }

  render() {
    return (
      <div>
        <input type="file" onChange={this.change} multiple={true} />
      </div>
    )
  }
}
