/*global FileReaderSync:true */
/*eslint no-undef: "error"*/

export default class FileChunker {

  /* reads a file, chunk by chunk */

  constructor(file, chunkSize) {
    this.file = file
    this.chunkSize = chunkSize
    this.chunks = this.defineChunks()
    this.number = -1
  }

  next() {
    this.number++
    const chunk = this.chunks[this.number]
    return chunk ? this.readChunk(chunk) : null
  }

  defineChunks() {
    /* defines offset for start and end byte for each chunk */
    const numChunks = Math.ceil(this.file.size / this.chunkSize) || 1
    const chunks = []
    for (let num = 1; num <= numChunks; num++) {
      chunks.push({
        start: (num-1)*this.chunkSize,
        end: (num === numChunks) ? this.file.size : num * this.chunkSize,
     })
    }
    return chunks
  }

  readChunk({start, end}) {
    const slice = this.file.slice(start, end)

    const chunk = new FileReaderSync().readAsArrayBuffer(slice)
    return {bytes: new Uint8Array(chunk), start}

  }



}
