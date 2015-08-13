var CompiledIFD = function(ifdData, startOffset, tiffOffset) {

	var entries = 0;
	var tags = new Struct();
	var data = new Struct();

	ifdData.tagList.forEach(function(tag) {
		if ([0x8769, 0xA005, 0x8825, 0xEA1C].indexOf(tag.id) > -1) {
			//links to Exif, iop, and GPS IFDs. We must generate new values for these later. Windows Padding (0xEA1C) is ignored entirely
			return;
		}

		//set new tag.bytes if tag.hasBeenChanged here

		var tagBytes = new Struct();
		tagBytes.push("H", tag.id);
		tagBytes.push("H", tag.type);
		tagBytes.push("L", tag.components);

		var byteLength = tag.byteLength;
		var value = tag.bytes;

		if (tag.byteLength === 4) {
			tagBytes.push("B", tag.bytes);
		}
		if (tag.byteLength < 4) {
			tagBytes.push("B", tag.bytes);
			var missing = 4 - tag.byteLength;
			for (i = 0; i < missing; i++) {
				tagBytes.push("B", 0);
			}
		}
		if (tag.byteLength > 4) {
			data.push("B", tag.bytes);
			var pointer = tagBytes.push("L", 0);
			//The pointer is NOT calculated correctly.
			pointer.set("L", 0, data.byteLength + tags.byteLength + 12 - tiffOffset + startOffset + 2);
		}
		tags.push("B", tagBytes.array);
		entries+=1;
	});
	CompiledIFD.prototype.addTag = function() {
		//for adding links to Exif, GPS and IOP subIFDs.
		return null;
	};

	var bytes = [0,0, 0,0,0,0];
	Object.defineProperty(this, "bytes", {
		get: function() {
			var struct = new Struct();
			struct.push("H", entries);
			struct.push("B", tags.array);
			struct.push("B", data.array);
			struct.push("L", 0); //dead link to IFD1
			return struct.array;
		},
	});
};

function compileExifToBytes(exifData) {

	var bytes = new Struct();
	
	//headers
	var app1 = bytes.push("H", 0xFFE1); //jpeg app1-marker
	var size = bytes.push("B", [0,0]); //length of segment (Does not include the app1-marker short, but does include size-indicator)
	var exif = bytes.push("B", [0x45, 0x78, 0x69, 0x66, 0, 0]); //EXIF ascii, and 2 nullbytes
	var tiff = bytes.push("B", [0x4D, 0x4D, 0, 0x2A, 0, 0, 0, 8]) //MM, motorola, big endian

	if (!exifData.hasOwnProperty("ifd0")) {
		bytes.push("B", [0,0, 0,0,0,0]); //add empty IFD, 0 entries, null pointer to next ifd.
		return bytes.array;
	}

	var ifd0 = new CompiledIFD(exifData.ifd0, bytes.byteLength, tiff.offset);
	bytes.push("B", ifd0.bytes);

	size.set("H", 0, bytes.byteLength - size.offset);

	return bytes.array;	

}