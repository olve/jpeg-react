import React from 'react'

import Row from './Row'
import Prompt from './Prompt'

export default class FileTable extends React.Component {

  static contextTypes = {
    files: React.PropTypes.array.isRequired,
  }

  get files() {
    return this.context.files.map((file, index) =>
      <Row key={`fileTable-row-${index}`} file={file} />
    )
  }

  render() {
    return (
      <div>
        <Prompt />
        {this.files}
      </div>
    )
  }
}
