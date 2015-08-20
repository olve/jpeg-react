function compileTagValue(tag) {
	if (!tag.hasBeenChanged && !tag.littleEndian && tag.hasOwnProperty("bytes")) {
		return tag.bytes;
	}
	var type = function getTagTypeInfo(type) {
		switch(type) {
			case 2:
				return Struct.prototype.TYPES.c;
			case 3:
				return Struct.prototype.TYPES.H;
			case 4:
			case 5:
				return Struct.prototype.TYPES.L;
			case 6:
				return Struct.prototype.TYPES.b;
			case 8:
				return Struct.prototype.TYPES.h;
			case 9:
			case 10:
				return Struct.prototype.TYPES.l;
			case 11:
				return Struct.prototype.TYPES.f;
			case 12:
				return Struct.prototype.TYPES.d;
			case 1:
			case 7:
			default:
				return Struct.prototype.TYPES.B;
		}
	}(tag.type);

	if (!tag.hasBeenChanged) {
		//for now, to avoid changing endianness, we recompile tag.value to an array of bytes, instead of switching the endianness
		//of tag.bytes. it is also more consistent, because when new values are stored, we use tag.value; not tag.bytes.

		var output = new Struct();

		if (tag.type === 2) {
			value = [];
			for (var i=0; i<tag.components; i++) {
				output.push("B", tag.value[i].charCodeAt(0));
			}
		}
		else if (tag.type === 5 || tag.type === 10) {
			/*	rationals are stored as two longs, numerator/denominator

				we convert rationals to a fraction with Peter Olson's BigRational lib.
				(https://github.com/peterolson/BigRational.js) */
			for (var i=0; i<tag.components; i++) {
				var chr = (tag.type===5) ? "L" : "l";
				var component = tag.value[i];
				var fraction = function toFraction(rational, epsilon) {
					var denominator = 0;
					var numerator;
					var error;
					do {
						denominator++;
						numerator = Math.round((rational.numerator * denominator) / rational.denominator);
						error = Math.abs(rational.minus(numerator/denominator));
					} while (error > epsilon);
					return {numerator: numerator, denominator: denominator};
				}(bigRat(component), 0.00001);
				output.push(chr, fraction.numerator);
				output.push(chr, fraction.denominator);
			}
		}
		else {
			for (var i=0; i<tag.components; i++) {
				output.push(type.chr, tag.value[i]);
			}
		}
		return output.array;
	}
	else {
		return [];
	}
}
var CompiledTag = function(tag) {
	var struct = new Struct();
	var id = struct.push("H", tag.id);
	var type = struct.push("H", tag.type);
	var components = struct.push("L", tag.components);
	var value = compileTagValue(tag);

	this.byteLength = value.length;

	if (this.byteLength > 4) {
		this.pointer = struct.push("L", 0);
		this.value = value;
	}
	else {
		if (this.byteLength < 4) {
			for (i = 0; i < 4 - this.byteLength; i++) {
				value.push(0);
			}
		}
		struct.push("B", value);
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
			cTag.pointer.set("L", 0, startOffset + 6 + entries*12 + values.byteLength); //start of TIFF-header is byte 0. + 2 (IFD length) + 4 (IFD link), IFD0 start is 8.
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
		var ifd0 = bytes.push("B", new CompiledIFD(exifData.ifd0, 0x0008).bytes);
	}

	if (exifData.hasOwnProperty("thumbnailData")) {
		bytes.push("B", exifData.thumbnailData);
	}

	size.set("H", 0, bytes.byteLength - size.offset);

	return bytes.array;	

}