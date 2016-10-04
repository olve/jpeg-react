import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/app'

import './styles.css'


const app = <App />
const mount = document.getElementById('app')

ReactDOM.render(app, mount)
