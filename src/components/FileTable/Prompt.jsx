import React from 'react'

export default class Prompt extends React.Component {

  static contextTypes = {
    files: React.PropTypes.array.isRequired,
  }

  render() {
    return !(this.context.files.length) ? (
      <div>
        <p>Drag & drop or choose some files</p>
      </div>
    ) : null
  }
}
