var WORKER_PATH_READ_FILEDATA = "static/js/workers/readFileData.js";

var File = function(fileData, callback) {

	this.data = fileData;
	this.buffer = null;
	this.callback = callback;
	this.desiredFileName = this.data.name;

	this.info = null;
	this.element = <span>Loading file...</span>;

	this.worker = new Worker(WORKER_PATH_READ_FILEDATA);
	this.worker.onmessage = this.onWorkerMessage.bind(this);
	this.worker.postMessage(fileData);
};
File.prototype.onWorkerMessage = function(message) {
	this.buffer = message.data;
	this.parse();
	this.callback();
	this.worker.terminate();
};
File.prototype.parse = function() {
	switch (this.data.type) {
		case "image/jpeg":
			this.info = new Jpeg(this.buffer);
			this.element = <JpegElement jpeg={this.info} />;
			break;
		case "image/png":
			this.info = null;
			this.element = <span>Im a png</span>;
			break;
	}
};
