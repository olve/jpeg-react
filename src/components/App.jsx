import React from 'react'
import autobind from 'autobind-decorator'
import EventEmitter from 'event-emitter'

@autobind
export default class App extends React.Component {

  constructor(props) {
    super()
    this.ee = new EventEmitter()
  }

  static childContextTypes = {
    ee: React.PropTypes.object,
  }
  getChildContext() {
    return {
      ee: this.ee,
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
