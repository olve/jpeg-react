import React from 'react'
import PropTypes from 'prop-types'
import pjpg from 'pjpg'

export default class Jpeg extends React.Component {

  jpeg = new pjpg(this.props.buffer)

  state = {
    segments: this.jpeg.getSegments()
  }

  static propTypes = {
    file: PropTypes.object.isRequired,
    buffer: PropTypes.any.isRequired,
  }

  componentDidMount() {


  }

  render() {
    console.log(this.state.segments.length)
    return (
      <div>
        {this.jpeg.buffer.byteLength}

        <ul>
          {this.state.segments.map((segment, index) =>
            <li key={`segment-${index}`}>
              <span>{segment.marker.name}:</span>
              <span>{`0x${segment.marker.byteMarker.toString(16)}`}</span>
            </li>
          )}
        </ul>

      </div>
    )
  }
}
