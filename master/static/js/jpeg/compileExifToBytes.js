var CompiledTag = function(tag) {

	//if tag.hasBeenChanged ...

	var struct = new Struct();
	var id = struct.push("H", tag.id);
	var type = struct.push("H", tag.type);
	var components = struct.push("L", tag.components);

	this.byteLength = tag.byteLength;

	if (this.byteLength === 4) {
		struct.push("B", tag.bytes);
	}
	else if (this.byteLength < 4) {
		var value = tag.bytes;
		for (i = 0; i < 4 - this.byteLength; i++) {
			value.push(0);
		}
		struct.push("B", value);
	}
	else if (this.byteLength > 4) {
		this.pointer = struct.push("L", 0);
		this.value = tag.bytes;
	}
	var bytes = [];
	Object.defineProperty(this, "bytes", {
		get: function() {
			return struct.array;
		},
	});
};
var CompiledIFD = function(ifdData, startOffset) {
	var tagList = ifdData.tagList.filter(function(tag) {
		if ([0x8769, 0xA005, 0x8825, 0xEA1C].indexOf(tag.id) > -1) {
			//filter out links to other IFDs, and windows padding.
			return false;
		}
		return true;
	});

	this.link = 0; //offset to next IFD

	var entries = tagList.length; //number of entries, stored as a short (2 bytes)
	var tags = new Struct(); //tag-entries, 12 bytes each.
	var values = new Struct(); //tag-values, storage for tag-values greater than 4 bytes.

	tagList.forEach(function(tag) {
		var cTag = new CompiledTag(tag);
		if (cTag.byteLength > 4) {
			cTag.pointer.set("L", 0, startOffset + 6 + entries*12 + values.byteLength);
			values.push("B", cTag.value);
		}
		tags.push("B", cTag.bytes)
	});

	var self = this;
	var bytes = [0,0, 0,0,0,0];
	Object.defineProperty(this, "bytes", {
		get: function() {
			var _bytes = new Struct();
			_bytes.push("H", entries);
			_bytes.push("B", tags.array);
			_bytes.push("L", self.link);
			_bytes.push("B", values.array);
			return _bytes.array;
		},
	});
};
CompiledIFD.prototype.addTag = function() {
	//useful for adding links to Exif, GPS and IOP subIFDs.
	return null;
};

function compileExifToBytes(exifData) {
	//size includes total size of thumbnails embedded in the exif segment and bytes of the size-indicator, but not the app1-marker short.
	var bytes = new Struct();
	var app1 = bytes.push("H", 0xFFE1); //jpeg app1-marker
	var size = bytes.push("B", [0,0]); //length of segment
	var exif = bytes.push("B", [0x45, 0x78, 0x69, 0x66, 0, 0]); //EXIF ascii, and 2 nullbytes
	var tiff = bytes.push("B", [0x4D, 0x4D, 0, 0x2A, 0, 0, 0, 8]) //MM, motorola, big endian
	if (!exifData.hasOwnProperty("ifd0")) {
		var ifd0 = bytes.push("B", [0,0, 0,0,0,0]); //add empty IFD0, 0 entries, null pointer to IFD1
	}
	else {
		var ifd0 = bytes.push("B", new CompiledIFD(exifData.ifd0, 8).bytes);
	}

	if (exifData.hasOwnProperty("thumbnailData")) {
		bytes.push("B", exifData.thumbnailData);
	}

	size.set("H", 0, bytes.byteLength - size.offset);

	return bytes.array;	

}