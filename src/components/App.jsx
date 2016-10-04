import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

@autobind
export default class App extends React.Component {

  constructor(props) {
    super()
    this.ee = new EventEmitter()
    this.db = props.db
  }

  static propTypes = {
    db: React.PropTypes.object.isRequired,
  }

  static childContextTypes = {
    ee: React.PropTypes.object,
    db: React.PropTypes.object,
  }
  getChildContext() {
    return {
      ee: this.ee,
      db: this.db
    }
  }

  render() {
    return (
      <div>
        <p>Hello World</p>
      </div>
    )
  }
}
