import React from 'react'
import autobind from 'autobind-decorator'

import FileSelector from './FileSelector'
import FileTable from './FileTable'

@autobind
export default class App extends React.Component {

  state = {
    files: []
  }

  static childContextTypes = {
    files: React.PropTypes.array,
    addFiles: React.PropTypes.func,
  }
  getChildContext() {
    return {
      files: this.state.files,
      addFiles: this.addFiles
    }
  }

  addFiles(files) {
    this.setState({
      files: [...this.state.files, ...files]
    })
  }

  render() {
    return (
      <div>
        <p>Hello World</p>
        <FileSelector />
        <FileTable />
      </div>
    )
  }
}
