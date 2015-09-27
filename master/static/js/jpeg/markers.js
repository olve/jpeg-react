/* 
  Dictionaries in this file:
    var JPEG_MARKERS (jpeg file markers)
*/

function readJpegMarkersList(buffer) {

    var array = new Uint8Array(buffer);

    var markers = [];

    for (var offset = 0, len = array.byteLength; offset < len; offset++) {

        if (array[offset] === 0xFF) {
            var marker = array[offset+1];
            if (marker !== 0xFF && marker !== 0) {
                marker += (0xFF<<8);
                markers.push({
                    offset: offset,
                    name: JPEG_MARKERS[marker],
                    byteMarker: marker,
                });
            }
        }
        else if (array[offset] === 0xEA) {
          if (array[offset+1] === 0x1C) {
            markers.push({
              offset: offset,
              name: JPEG_MARKERS[0xEA1C],
              byteMarker: 0xEA1C,
            });
          }
        }
        else if (array[offset] == 0x38) { //8
            if (
                array[offset+1] == 0x42 && //B
                array[offset+2] == 0x49 && //I
                array[offset+3] == 0x4D && //M
                array[offset+4] == 0x04 &&
                array[offset+5] == 0x04
            ) {
                markers.push({
                    offset: offset,
                    name: "iptc",
                    byteMarker: 0x38,
                });
            }
        }
    }
    return markers;
}

function readJpegMarkers (buffer) {
/*    catalogue all markers found in a JPEG file.
      arguments:
            buffer: JPEG file as byteArray.
      example return value: {StartOfImage:[0], EndOFImage:[10000], App0:[2], App1:[50, 90]}
*/
      var array = new Uint8Array(buffer);

      var markers = {};
      //check every byte in array for 0xFF (JPEG Marker)
      for (var offset = 0, len=array.byteLength; offset < len; offset++) {
            if (array[offset] === 0xFF) {
                  var marker = array[offset+1];
                  if (marker !== 0xFF && marker !== 0) {
                        //if the trailing byte is not 0xFF or 0, we've found a real marker.
                        marker += (0xFF<<8); //turn 2 chars into a short
                        if (JPEG_MARKERS.hasOwnProperty(marker)) {
                              var name = JPEG_MARKERS[marker];
                              if (markers.hasOwnProperty(name)) {
                                    markers[name].push(offset);
                              }
                              else {
                                    markers[name] = [offset];
                              }
                        }
                  }
            }

            else if (array[offset] === 0x38) { //8
                  if (
                        array[offset+1] === 0x42 && //B
                        array[offset+2] === 0x49 && //I
                        array[offset+3] === 0x4D && //M
                        array[offset+4] === 0x04 &&
                        array[offset+5] === 0x04
                  ) {
                        if (markers.hasOwnProperty("iptc")) {
                              markers.iptc.push(offset);
                        }
                        else {
                              markers.iptc = [offset];
                        }
                  }
            }
      }
      return markers;
};

var JPEG_MARKERS = {
      // Microsoft patented padding (http://www.freepatentsonline.com/7421451.html)
      0xEA1C: "MicrosoftPadding",

      // Start of Frame markers, non-differential, Huffman coding
      0xFFC0: "HuffBaselineDCT",
      0xFFC1: "HuffExtSequentialDCT",
      0xFFC2: "HuffProgressiveDCT",
      0xFFC3: "HuffLosslessSeq",

      // Start of Frame markers, differential, Huffman coding
      0xFFC5: "HuffDiffSequentialDCT",
      0xFFC6: "HuffDiffProgressiveDCT",
      0xFFC7: "HuffDiffLosslessSeq",

      // Start of Frame markers, non-differential, arithmetic coding
      0xFFC8: "ArthBaselineDCT",
      0xFFC9: "ArthExtSequentialDCT",
      0xFFCA: "ArthProgressiveDCT",
      0xFFCB: "ArthLosslessSeq",

      // Start of Frame markers, differential, arithmetic coding
      0xFFCD: "ArthDiffSequentialDCT",
      0xFFCE: "ArthDiffProgressiveDCT",
      0xFFCF: "ArthDiffLosslessSeq",

      // Huffman table spec
      0xFFC4: "HuffmanTableDef",

      // Arithmetic table spec
      0xFFCC: "ArithmeticTableDef",

      // Restart Interval termination
      0xFFD0: "RestartIntervalStart",
      0xFFD7: "RestartIntervalEnd",

      // Other markers
      0xFFD8: "StartOfImage",
      0xFFD9: "EndOfImage",
      0xFFDA: "StartOfScan",
      0xFFDB: "QuantTableDef",
      0xFFDC: "NumberOfLinesDef",
      0xFFDD: "RestartIntervalDef",
      0xFFDE: "HierarchProgressionDef",
      0xFFDF: "ExpandRefComponents",

      // App segments
      0xFFE0: "App0",
      0xFFE1: "App1",
      0xFFE2: "App2",
      0xFFE3: "App3",
      0xFFE4: "App4",
      0xFFE5: "App5",
      0xFFE6: "App6",
      0xFFE7: "App7",
      0xFFE8: "App8",
      0xFFE9: "App9",
      0xFFEA: "App10",
      0xFFEB: "App11",
      0xFFEC: "App12",
      0xFFED: "App13",
      0xFFEE: "App14",
      0xFFEF: "App15",

      // Jpeg Extensions
      0xFFF0: "JpegExt0",
      0xFFF1: "JpegExt1",
      0xFFF2: "JpegExt2",
      0xFFF3: "JpegExt3",
      0xFFF4: "JpegExt4",
      0xFFF5: "JpegExt5",
      0xFFF6: "JpegExt6",
      0xFFF7: "JpegExt7",
      0xFFF8: "JpegExt8",
      0xFFF9: "JpegExt9",
      0xFFFA: "JpegExtA",
      0xFFFB: "JpegExtB",
      0xFFFC: "JpegExtC",
      0xFFFD: "JpegExtD",

      // Comments
      0xFFFE: "Comment",

      // Reserved
      0xFF01: "ArithTemp",
      0xFF02: "ReservedStart",
      0xFFB: "ReservedEnd",
};
