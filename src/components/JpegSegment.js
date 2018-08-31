import React from 'react'
import PropTypes from 'prop-types'

import { ListItem } from 'material-ui/List'

export default class Jpeg extends React.Component {
  static propTypes = {
    segment: PropTypes.object.isRequired
  }

  render() {


    const { segment } = this.props

    return (
      <ListItem
        className="jpeg-segment"
        primaryText={ segment.marker.name || 'unknown' }
        secondaryText={`0x${segment.marker.byteMarker.toString(16).toUpperCase()}`}
      />

    )
  }

}
