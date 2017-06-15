import React from 'react'

import pjpg from 'pjpg'

export default class Jpeg extends React.Component {

  static propTypes = {
    file: React.PropTypes.object.isRequired,
    buffer: React.PropTypes.any.isRequired,
  }

  componentDidMount() {
    console.log('nope')
  }


  render() {
    return (
      <div>


        { pjpg.readMarkers(this.props.buffer)[0].name}


      </div>
    )
  }
}
