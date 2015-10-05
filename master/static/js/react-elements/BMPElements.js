var WORKER_PATH_ENCODE_JPEG = "static/js/workers/encodeJPEGImageData.js";

var BMPHeaderElement = React.createClass({
	render: function() {
		var bmp = this.props.bmp;

		var fileHeaderElement = null;
		var dibHeaderElement = null;

		if (bmp.fileHeader !== null) {
			var fileHeader = bmp.fileHeader;
			var fileHeaderElement = (
				<div>
					<h2>File header</h2>
					<p>header offset: {fileHeader.offset}</p>
					<p>filesize: {fileHeader.bitmapSize}</p>
					<p>Reserved 1: {fileHeader.reserved1}</p>
					<p>Reserved 2: {fileHeader.reserved2}</p>
					<p>Image data offset: {fileHeader.imageDataOffset}</p>
				</div>
			);
		}
		if (bmp.dibHeader !== null) {
			var dibHeader = bmp.dibHeader;
			var dibHeaderElement = (
				<div>
					<h3>Info header</h3>
					<p>header offset: {dibHeader.offset}</p>
					<p>header size: {dibHeader.headerSize}</p>
					<p>bitmap width: {dibHeader.width}</p>
					<p>bitmap height: {dibHeader.height}</p>
					<p>color planes: {dibHeader.planes}</p>
					<p>bits per pixel: {dibHeader.bitsPerPixel}</p>
					<p>compression: {dibHeader.compression}</p>
					<p>raw bitmap data size: {dibHeader.size}</p>
					<p>horizontal resolution: {dibHeader.hRes}</p>
					<p>vertical resolution: {dibHeader.vRes}</p>
					<p>number of palette colors: {dibHeader.numColors}</p>
					<p>number of colors: {dibHeader.importantColors}</p>
				</div>
			);
		}
		return (
			<div>
				{fileHeaderElement}
				{dibHeaderElement}
			</div>
		);
	},
});

var BMPElement = React.createClass({
	saveAsJpeg: function() {
		var encoder = new Worker(WORKER_PATH_ENCODE_JPEG);
		var filename = this.props.bmp.desiredFileName + ".jpg"; //should utilize FileManager's save-button
		encoder.onmessage = function(message) {
			var jpeg = message.data.data;
			var buffer = new ArrayBuffer(jpeg.byteLength);
			new Uint8Array(buffer).set(jpeg);
			var blob = new Blob([buffer], {type: "image/jpeg"});
			saveAs(blob, filename);
		};
		encoder.postMessage({imageData: this.props.bmp.imageData, quality: 100}); //max quality is 100
	},
	render: function() {
		var bmp = this.props.bmp;
		var saveAsJpeg = bmp.imageData === null ? null : <button onClick={this.saveAsJpeg}>convert to JPEG &amp; download</button>;
		return (
			<div>
				{saveAsJpeg}
				<BMPHeaderElement bmp={bmp} />
			</div>
		);
	},
});