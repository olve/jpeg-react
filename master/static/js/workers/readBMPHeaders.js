var DecodedBMP = function(buffer) {
	
	this.buffer = buffer;
	this.view = new DataView(this.buffer);
	this.byteArray = new Uint8Array(this.buffer);

	this.fileHeader = this.parseFileHeader();
	this.dibHeader = null;
	this.palette = null;

	if (this.fileHeader !== null) {
		//we assume this is a post-Windows 2000 bitmap, and parse the header as BITMAPINFOHEADER format instead of OS/2 1.x BITMAPCOREHEADER
		this.dibHeader = this.parseBITMAPINFOHEADER(); 
	}

};
DecodedBMP.prototype.parseFileHeader = function() {
	function findHeader(byteArray) {
		for (var i=0, len=byteArray.byteLength; i<len; i++) {
			if (byteArray[i] === 0x42 && byteArray[i+1] === 0x4D) {
				return i;
			}
		}
		return null;
	}

	var offset = findHeader(this.byteArray);
	if (offset === null) {
		return null;
	}

	return {
		offset: offset,
		bitmapSize: this.view.getUint32(offset+2, true), //The size of the BMP file in bytes
		reserved1: this.view.getUint16(offset+6, true), //Reserved; actual value depends on the application that creates the image
		reserved2: this.view.getUint16(offset+8, true), //Reserved; actual value depends on the application that creates the image
		imageDataOffset: this.view.getUint32(offset+10, true), //The offset, i.e. starting address, of the byte where the bitmap image data (pixel array) can be found.
	};

};
DecodedBMP.prototype.parseBITMAPINFOHEADER = function() {
	if (this.fileHeader === null) {
		return null;
	}
	var offset = this.fileHeader.offset + 14; //the file header is 14 bytes long. dib header follows directly after.
	return {
		offset: offset,
		headerSize: this.view.getUint32(offset, true), //the size of this header (40 bytes)
		width: this.view.getInt32(offset+4, true), //the bitmap width in pixels (signed integer)
		height: this.view.getInt32(offset+8, true), //the bitmap height in pixels (signed integer)
		planes: this.view.getUint16(offset+12, true), //the number of color planes (must be 1)
		bitsPerPixel: this.view.getUint16(offset+14, true), //the number of bits per pixel, which is the color depth of the image. Typical values are 1, 4, 8, 16, 24 and 32.
		compression: this.view.getUint32(offset+16, true), //the compression method being used. https://en.wikipedia.org/wiki/BMP_file_format#DIB_header_.28bitmap_information_header.29
		size: this.view.getUint32(offset+20, true), //the image size. This is the size of the raw bitmap data; a dummy 0 can be given for BI_RGB bitmaps.
		hRes: this.view.getInt32(offset+24, true), //the horizontal resolution of the image. (pixel per meter, signed integer)
		vRes: this.view.getInt32(offset+28, true), //the vertical resolution of the image. (pixel per meter, signed integer)
		numColors: this.view.getUint32(offset+32, true), //the number of colors in the color palette, or 0 to default to 2n
		importantColors: this.view.getUint32(offset+36, true), //the number of important colors used, or 0 when every color is important; generally ignored
	};
};
DecodedBMP.prototype.parsePalette = function() {
	//if BI_BITFIELDS compression (huffman 1D) is used, add 12 bytes for bit masks.
	if (this.dibHeader.bitsPerPixel > 23) {
		//the color table is normally not used when pixels use the 16bpp (or higher) format.
		return null;
	}
	var offset = this.dibHeader.compression === 3 ? this.fileHeader.offset + 66 : this.fileHeader.offset + 54;
	var len = this.dibHeader.numColors === 0 ? 1 << this.dibHeader.bitsPerPixel : this.dibHeader.numColors;
};

self.onmessage = function(message) {
	var bmp = new DecodedBMP(message.data);
	postMessage({
		dibHeader: bmp.dibHeader,
		fileHeader: bmp.fileHeader,
	});
};