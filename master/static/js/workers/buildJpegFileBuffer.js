function readJpegGenericSegment(offset, buffer) {
	//defined here because workers cant access the global scope.
	var view = new DataView(buffer);
	var array = new Uint8Array(buffer);

	var length = view.getUint16(offset + 2);
	var end = length + offset + 2;

	return Array.prototype.slice.call(array).slice(offset, end);
}
function getIPTCLength(offset, buffer) {
	var array = new Uint8Array(buffer);
	var view = new DataView(buffer);
	var nameHeaderLength = array[offset+7];
	if (nameHeaderLength & 2 !== 0) nameHeaderLength += 1;
	if (nameHeaderLength === 0) nameHeaderLength = 4;
	return view.getUint16(offset + 6 + nameHeaderLength);							
}


self.onmessage = function(message) {
	var buffer = message.data.buffer;
	var parts = message.data.parts;

	var byteArrays = parts.map(function(part) {

		if (part.hasOwnProperty("bytes")) {
			return part.bytes;
		}
		else {
			if (
				//includes restart-markers not in the dictionary, 0xFFD0-0xFFD7
				(part.marker.byteMarker > 0xFFBF && part.marker.byteMarker < 0xFFD8) ||
				//we can include App1 (0xFFE1) because it has a length-indicator, and because it was likely excluded above (it probably has the .bytes property). We also want to include App1 segments that are not Exif (adobe etc)
				(part.marker.byteMarker > 0xFFD9 && part.marker.byteMarker < 0xFFE2) 
			) {
				return readJpegGenericSegment(part.marker.offset, buffer);
			}
			else if (part.marker.byteMarker === 0xFFD8) {
				return [0xFF, 0xD8];
			}
			else if (part.marker.byteMarker === 0xFFD9) {
				return [0xFF, 0xD9];
			}
			else if (part.marker.name === "iptc") {
				var length = getIPTCLength(part.marker.offset, buffer);
				return Array.prototype.slice.call(new Uint8Array(buffer), part.marker.offset, part.marker.offset+length);
			}
			else {
				//skip unknown segments (app14, app2, ...)
				return [];
			}
		}

	});

	var jpegBuffer = [];
	byteArrays.forEach(function(array) {
		//Using fancy prototype-calls is risky, because with gigantic arrays, they sometimes throw exceptions.
		for (var i = 0, len = array.length; i < len; i++) {
			jpegBuffer.push(array[i]);
		}
	});
	postMessage(jpegBuffer);
};
