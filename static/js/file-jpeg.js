var Jpeg = function(buffer) {
	this.buffer = buffer;
	this.markers = readJpegMarkers(this.buffer);
	this.exif = this.readExif(this.markers);
	this.encodedImageData = this.readEncodedImageData(this.markers);
	this.comment = this.markers.hasOwnProperty("Comment") ? readJpegComment(this.markers.Comment[0], this.buffer) : null;
};
Jpeg.prototype.readExif = function(markers) {
	if (markers.hasOwnProperty("App1")) {
		for (var i = 0, len = markers.App1.length; i < len; i++) {
			var offset = markers.App1[i];
			if (readJpegApp1Id(offset, this.buffer) === "Exif") {
				return readJpegExif(offset, this.buffer); //use first marker found; has there ever been a jpeg file with 2 exif segments?
			}
		}
	}
	return null;
};
Jpeg.prototype.readEncodedImageData = function(markers) {
	if (!this.markers.hasOwnProperty("QuantTableDef")) {
		return null;
	}
	//check DQT markers for whether or not they are for the main image data, or for embedded images (thumbnails etc)
	var mainDQTOffset;
	for (var i = 0, len = markers.QuantTableDef.length; i < len; i ++) {
		var offset = markers.QuantTableDef[i];
		if (this.exif !== null) {
			if (!(offset > this.exif.offset && offset < this.exif.length)) {
				//dqt marker was not found within an exif-segment, so it is not an embedded thumb.
				mainDQTOffset = offset;
			}
		}
		else {
			mainDQTOffset = offset;
		}
	}
	var encodedImageData = {
		dqt: readJpegDQT(mainDQTOffset, this.buffer),
	};
	return encodedImageData;
};
