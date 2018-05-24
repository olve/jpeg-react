/*global document:true*/
/*eslint no-undef: "error"*/

import React from 'react'
import ReactDOM from 'react-dom'

import Files from './components/Files'

import './assets/styles/index.css'

ReactDOM.render(
  <Files />,
  document.getElementById('appmount')
)
