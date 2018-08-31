import React from 'react'
import PropTypes from 'prop-types'
import pjpg from 'pjpg'

import { List } from 'material-ui/List'
import Checkbox from 'material-ui/Checkbox'

import JpegSegment from './JpegSegment'

export default class Jpeg extends React.Component {

  jpeg = new pjpg(this.props.buffer)

  state = {
    onlyShowMetadata: false,
    segments: this.jpeg.getSegments()
  }

  static propTypes = {
    file: PropTypes.object.isRequired,
    buffer: PropTypes.any.isRequired,
  }

  getMetaSegments() {
    return this.state.segments.filter((segment) => segment.marker.byteMarker > 0xFFDF || segment.marker.byteMarker < 0xFFC0)
  }

  getSegments() {
    return this.state.onlyShowMetadata ? this.getMetaSegments() : this.state.segments
  }

  render() {
    return (
      <div>

        <Checkbox
          label="only show metadata"
          checked={ this.state.onlyShowMetadata }
          onCheck={ () => this.setState({onlyShowMetadata: !this.state.onlyShowMetadata}) }
        />

        <List>
          {this.getSegments().map((segment, index) => <JpegSegment key={`segment-${index}`} segment={segment} />)}
        </List>

      </div>
    )
  }
}
