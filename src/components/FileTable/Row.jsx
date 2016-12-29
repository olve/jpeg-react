import React from 'react'

export default class Row extends React.Component {

  static propTypes = {
    file: React.PropTypes.object.isRequired,
  }

  render() {
    return (
      <div>{this.props.file.name}</div>
    )
  }
}
