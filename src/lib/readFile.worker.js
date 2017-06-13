/*global self:true, postMessage:true */
/*eslint no-undef: "error"*/

import PromiseFileReader from 'promise-file-reader'

self.onmessage = (message) => PromiseFileReader
  .readAsArrayBuffer(message.data)
  .then(postMessage)
