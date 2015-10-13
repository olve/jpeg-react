self.onmessage = function(message) {

	var imageData = message.data.imageData;
	var fileHeader = message.data.fileHeader;
	var dibHeader = message.data.dibHeader;
	var buffer = message.data.buffer;

	if (dibHeader === null || fileHeader === null) {
		postMessage(null);
		return;
	}

	var data = imageData.data;
	var bmpdata = new Uint8Array(buffer, fileHeader.imageDataOffset);
	var	stride = Math.floor((dibHeader.bitsPerPixel*dibHeader.width + 31) / 32) * 4;

	//only valid for 24 bit BMPs.
	//all the canvas imagedata stuff is probably not required; we cant get it from the buffer.

	for (var y = 0; y < dibHeader.height; ++y) { 
		for (var x = 0; x < dibHeader.width; ++x) { 
			var index1 = (x+dibHeader.width*(dibHeader.height-y))*4; 
			var index2 = x * 3 + stride * y;
			data[index1] = bmpdata[index2 + 2];
			data[index1 + 1] = bmpdata[index2 + 1];
			data[index1 + 2] = bmpdata[index2];
			data[index1 + 3] = 255; 
		} 
	}

	postMessage(imageData);

};