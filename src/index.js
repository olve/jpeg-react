/*global document:true*/
/*eslint no-undef: "error"*/

import React from 'react'
import ReactDOM from 'react-dom'
import injectTapEventPlugin from 'react-tap-event-plugin'

import Files from './components/Files'

import './assets/styles/index.css'

injectTapEventPlugin()

ReactDOM.render(
  <Files />,
  document.getElementById('appmount')
)
