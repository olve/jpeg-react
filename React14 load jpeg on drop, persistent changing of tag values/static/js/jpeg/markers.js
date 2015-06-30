/* 
  
  Dictionaries in this file:
    var JPEG_MARKERS (jpeg file markers)


  Links:
        Windows Patented padding (marker 0xEA1C): http://www.freepatentsonline.com/7421451.html
        Common JPEG markers: http://en.wikipedia.org/wiki/JPEG#Syntax_and_structure
        stackoverflow demo (strip orientation): http://stackoverflow.com/questions/27638402/strip-exif-data-from-image
        canvas-method strip all exif: http://removephotodata.com/
        exif tag-descriptions: http://www.exiv2.org/tags.html
        exif tags: http://www.sno.phy.queensu.ca/~phil/exiftool/TagNames/EXIF.html
        TIFF structure image (from EXIF specs): http://i.stack.imgur.com/UpQt9.png
        Japanese Exif description: http://www.media.mit.edu/pia/Research/deepview/exif.html
        python exif library: https://github.com/bennoleslie/pexif
        python format strings: https://docs.python.org/2/library/struct.html#format-characters
        converting utf-8 to byteArray: http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
        how flickr parses exif: http://code.flickr.net/2012/06/01/parsing-exif-client-side-using-javascript-2/
        adobe TIFF specs: http://partners.adobe.com/public/developer/en/tiff/TIFF6.pdf
        JPEG overview: http://www.codeproject.com/KB/graphics/ExifLibrary/jpeg_format.png
        integer to bytearray: http://bytes.com/topic/javascript/answers/157858-convert-integer-value-4-byte-array
        integer to bytearray: http://stackoverflow.com/questions/8482309/converting-javascript-integer-to-byte-array-and-back
        bytearray to string: http://updates.html5rocks.com/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
        sublime hexviewer docs: http://facelessuser.github.io/HexViewer/usage/
        SOS marker parsing: http://stackoverflow.com/questions/26715684/parsing-jpeg-sos-marker
        ECS parsing: http://stackoverflow.com/questions/2467137/parsing-jpeg-file-format-format-of-entropy-coded-segments-ecs
        JPEG header: http://en.wikibooks.org/wiki/JPEG_-_Idea_and_Practice/The_header_part
        JPEGsnoop src: http://sourceforge.net/p/jpegsnoop/code/HEAD/tree/tags/release-1.7.1/
        JPEG marker info: http://www.xbdev.net/image_formats/jpeg/tut_jpg/jpeg_file_layout.php
        JPEG marker info2: http://lad.dsc.ufcg.edu.br/multimidia/jpegmarker.pdf
        SOS marker: http://stackoverflow.com/questions/8511326/parsing-jpeg-file-sos-marker
        JPEG markers: http://en.wikibooks.org/wiki/JPEG_-_Idea_and_Practice/The_header_part
        great JPEG decoding breakdown: http://www.xbdev.net/image_formats/jpeg/jpeg.php
        IPTC tags: http://www.exiv2.org/iptc.html
        Python IPTC parsing: https://github.com/chrisrossi/edwin/blob/master/src/edwin/jpeg/iptc.py
        decoding jpeg imagedata: https://github.com/notmasteryet/jpgjs
        decoding jpeg imagedata: https://github.com/mozilla/pdf.js/tree/master/src/core

    A note on JPEGs edited by Windows:
        Any JPEG edited by Windows will most likely contain a handful of "Padding" markers: 0xea1c.
        Windows adds more data to Exif metadata by finding "dead zones" in the file, and storing data there.
        This will either not affect you at all, or leave you flabbergasted for a couple of days, spouting "WTFs".

        This method of editing/padding/adding data is patented by Windows, and is thoroughly explained in the patent specs here:
        http://www.freepatentsonline.com/7421451.html

*/


function readJpegMarkers (buffer) {
/*    catalogue all markers found in a JPEG file.
      arguments:
            buffer: JPEG file as byteArray.
      example return value: {StartOfImage:[0], EndOFImage:[10000], App0:[2], App1[50, 90]}
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
