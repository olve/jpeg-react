self.onmessage = function(message) {
	var reader = new FileReaderSync();
	var buffer = reader.readAsArrayBuffer(message.data);
	postMessage(buffer);
};	