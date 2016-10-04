import React from 'react'
import ReactDOM from 'react-dom'

import App from './components/app'
import registerServiceWorker from 'serviceworker!./serviceworker.js'
import db from './indexed-db'

import './styles.css'

registerServiceWorker({scope: '/'}).catch(error => console.log)

const app = <App db={db} />
const mount = document.getElementById('app')

ReactDOM.render(app, mount)
