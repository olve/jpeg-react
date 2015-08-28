self.onmessage = function(message) {
	var jpeg = new function() {
		this.buffer = message.data.buffer;
		this.view = new DataView(this.buffer);
		this.byteArray = new Uint8Array(this.buffer);
		this.array = Array.prototype.slice.call(this.byteArray);
		this.parts = message.data.parts;
	};
	var partArrays = jpeg.parts.map(function(part, index) {
		if (part.hasOwnProperty("bytes")) {
			return part.bytes;
		}
		else {
			if (part.marker.byteMarker === 0xFFD8) return [0xFF, 0xD8];
			else if (part.marker.byteMarker === 0xFFD9) return [0xFF, 0xD9];
			else if ((part.marker.byteMarker > 0xFFBF && part.marker.byteMarker < 0xFFD8) || (part.marker.byteMarker > 0xFFDA && part.marker.byteMarker < 0xFFE2)) {
				//range includes restart-markers not in the dictionary, 0xFFD0-0xFFD7. We can also include App1 (0xFFE1) in the range because it has a length-indicator, though it was probably excluded above (it likely has the .bytes property). We also want to include App1 segments that are not Exif (adobe etc)
				//read as generic segment
				var length = jpeg.view.getUint16(part.marker.offset +2);
				var end = length + part.marker.offset + 2;
				return jpeg.array.slice(part.marker.offset, end);
			}
			else if (part.marker.byteMarker === 0x38 && part.marker.name === "iptc") {
				var nameHeaderLength = jpeg.array[part.marker.offset+7];
				if (nameHeaderLength & 2 !== 0) nameHeaderLength += 1;
				if (nameHeaderLength === 0) nameHeaderLength = 4;
				var iptcSegmentLength = jpeg.view.getUint16(part.marker.offset + 6 + nameHeaderLength);
				return Array.prototype.slice.call(jpeg.array, part.marker.offset, part.marker.offset+length);
			}
			else if (part.marker.byteMarker === 0xFFDA) {
				//has part.bytes, this part is ignored.
				/*	SOS header. length-indicator is header-length, not segment-length. One can get the full length of the segment by decoding it.
					We will make the assumption that any markers found between this SOS marker and the next EOI marker (0xFFD9) will be part of this
					SCAN segment; and return everything inbetween.
				*/
				for (var i = index+1, len = jpeg.parts.length; i < len; i++) {
					var stop = jpeg.array.length-1;
					if (jpeg.parts[i].marker.byteMarker === 0xFFD9) {
						stop = jpeg.parts[i].marker.offset;
					}
				}
				return jpeg.array.slice(part.marker.offset, stop);
			}			
			else {
				//skip unknown segments (app14, app2, ...)
				return [];
			}
		}

	});

	var resultBuffer = [];
	partArrays.forEach(function(partArray) {
		//Using array.prototype-calls to merge arrays is risky, because with gigantic arrays, they sometimes throw exceptions.
		for (var i = 0, len = partArray.length; i < len; i++) {
			resultBuffer.push(partArray[i]);
		}
	});
	postMessage(resultBuffer);
};
