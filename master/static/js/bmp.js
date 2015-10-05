var WORKER_PATH_READ_BMP_HEADERS = "static/js/workers/readBMPHeaders.js";
var WORKER_PATH_GET_BMP_IMAGEDATA = "static/js/workers/getBMPImageData.js";

var BMP = function(buffer, callback, desiredFileName) {

	this.callback = callback;
	this.desiredFileName = desiredFileName;

	this.buffer = buffer;
	this.dibHeader = null;
	this.fileHeader = null;
	this.imageData = null;

	this.headerReader = new Worker(WORKER_PATH_READ_BMP_HEADERS);
	this.imageDataReader = new Worker(WORKER_PATH_GET_BMP_IMAGEDATA);

	this.headerReader.onmessage = this.onHeaderReaderMessage.bind(this);
	this.imageDataReader.onmessage = this.onImageDataReaderMessage.bind(this);

	this.headerReader.postMessage(this.buffer);

};
BMP.prototype.onHeaderReaderMessage = function(message) {
	this.dibHeader = message.data.dibHeader;
	this.fileHeader = message.data.fileHeader;
	this.headerReader.terminate();

	var canvas = document.createElement("canvas");
	var imageData = canvas.getContext("2d").createImageData(this.dibHeader.width, this.dibHeader.height);

	this.imageDataReader.postMessage({dibHeader: this.dibHeader, fileHeader: this.fileHeader, imageData: imageData, buffer: this.buffer});
};
BMP.prototype.onImageDataReaderMessage = function(message) {
	this.imageData = message.data;
	this.imageDataReader.terminate();

	this.callback();
};