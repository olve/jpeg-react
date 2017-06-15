/*global self:true, postMessage:true */
/*eslint no-undef: "error"*/

import FileChunker from './FileChunker'

const CHUNK_SIZE = 1024 * 1024 * 2.5 //2.5MiB

let file, chunker


self.onmessage = ({data}) => {


  // on first message, receive file and define start & stop offset for each file-chunk

  file = data
  chunker = new FileChunker(file, CHUNK_SIZE)

  postMessage({
    numChunks: chunker.chunks.length
  })




  // after receiving file, respond with next chunk for all further messages.
  // caller will terminate worker when all chunks are received.

  self.onmessage = _ => postMessage(chunker.next())

}
