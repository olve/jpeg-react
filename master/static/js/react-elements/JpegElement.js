var WORKER_PATH_BUILD_JPEG_FILE_BUFFER = "static/js/workers/buildJpegFileBuffer.js";

var JpegExifTag = React.createClass({
	changeValue: function(event) {
		this.props.tag.onChangeHandler(event);
		this.forceUpdate();
	},
	render: function() {
		var tag = this.props.tag;
		var dictionary = this.props.dictionary;
		//name is the tag label to display, use id if we could not get string name from dictionary
		var name = getJpegTagDictionaryAttribute(tag.id, dictionary, "name") || tag.id;

		//build <select>-field if stringvalues are found in the dictionary entry, else build <input> field.
		var stringValues = getJpegTagDictionaryAttribute(tag.id, dictionary, "stringvalues");
		if (stringValues) {
			var options = Object.keys(stringValues).map(function(value) {
				return (
					<option key={tag.id+"stringValue"+value} value={value}>
						{stringValues[value]}
					</option>
				);
			});
			var input = (
				<select value={tag.value[0].toString()} onChange={this.changeValue}>
					{options}
				</select>
			);
		}
		else {
			var input = (<input value={parseJpegTagValue(tag, dictionary)} onChange={this.changeValue} />);
		}
		return (
			<li key={this.props.key}>
				<span title={"Tag id: " + tag.id}>{name}</span> {input} {tag.value}
			</li>
		);
	},
});
var JpegComment = React.createClass({
	onChange: function(event) {
		this.props.comment.onChange(event);
		this.forceUpdate();
	},
	render: function() {
		return (
			<div>
				<h3>Comment</h3>
				<input type="text" value={this.props.comment.value} onChange={this.onChange} /> {this.props.comment.value}
			</div>
		);
	},
});

var JpegExif = React.createClass({
	render: function() {
		if (this.props.exif === null) return null;
		var exif = this.props.exif;

		function buildTagList(ifd, dictionary) {
			var tags = ifd.tagList.map(function(tag) {
				tag.onChangeHandler = function(event) {
					this.value = [event.target.value];
				}.bind(tag);
				return <JpegExifTag tag={tag} key={tag.id} dictionary={dictionary} />;
			});
			return tags;
		}
		var tags = {
			image: exif.hasOwnProperty("ifd0") ? buildTagList(exif.ifd0, TIFF_IMAGE_TAGS) : null,
			photo: exif.hasOwnProperty("exif") ? buildTagList(exif.exif, TIFF_PHOTO_TAGS) : null,
			gps: exif.hasOwnProperty("gps") ? buildTagList(exif.gps, TIFF_GPS_TAGS) : null,
			iop: exif.hasOwnProperty("iop") ? buildTagList(exif.iop, TIFF_IOP_TAGS) : null,
		};

		return (
			<div className={"jpeg-exif"}>
				<h2>Image tags</h2>
				<ul className="jpeg-exif-taglist">
					{tags.image}
				</ul>

				<h2>Photo tags</h2>
				<ul className="jpeg-exif-taglist">
					{tags.photo}
				</ul>

				<h2>GPS tags</h2>
				<ul className="jpeg-exif-taglist">
					{tags.gps}
				</ul>

				<h2>Interoperability tags</h2>
				<ul className="jpeg-exif-taglist">
					{tags.iop}
				</ul>
			</div>
		);
	},
});

var JpegPartElement = React.createClass({
	onChange: function(event) {
		this.props.part.onChange(event);
		this.forceUpdate();
	},
	render: function() {
		return (
			<div className="jpeg-part">
				<input type="checkbox" checked={this.props.part.includeWhenSaved} onChange={this.onChange} />
				{this.props.childElement || null}
			</div>
		);
	},
});

var Jpeg = function(buffer) {
	this.buffer = buffer;
	this.markers = readJpegMarkersList(this.buffer);

	var Part = function(marker) {
		this.marker = marker;
		this.includeWhenSaved = true;

		var self = this;
		var element = null;
		Object.defineProperty(this, "element", {
			//define getter and setter for element, to wrap the part's child element in a JpegPartElement component.
			get: function() {
				return element;
			},
			set: function(childElement) {
				element = <JpegPartElement childElement={childElement} part={self} key={"jpeg-part-"+self.marker.offset} />;
			},
		});
		this.onChange = function(event) {
			this.includeWhenSaved = event.target.checked;
		}.bind(this);
	};

	this.parts = this.markers.map(function(marker) {

		var part = new Part(marker);
		var bytes = null;

		switch (marker.byteMarker) {
			//parse jpeg-segment. define getter for raw bytes of the part, and build raw bytes from edited comments, exif-tags, etc.
			//also set part.element, for rendering. part.element has a setter-function, wrapping the element in a <JpegPartElement />
			case 0xFFFE: //Comment
				part.info = new function() {
					this.value = readJpegComment(marker.offset, buffer);
					this.onChange = function(event) {
						//for bubbling events. We still need to forceUpdate any <input> fields to reflect the changed value.
						this.value = event.target.value;
					}.bind(this);
					this.compileToBytes = function() {
						var len = this.value.length;
						var _bytes = [0xFF, 0xFE, (len+2)>>8, (len+2)&255];
						for (var i = 0; i < len; i++) {
							_bytes.push(this.value.charCodeAt(i));
						}
						return _bytes;
					};
				};
				part.element = <JpegComment comment={part.info} />;
				break;
			case 0xFFE1: //App1
				var id = readJpegApp1Id(marker.offset, buffer);
				if (id === "Exif") {
					part.info = readJpegExif(marker.offset, buffer);
					part.info.compileToBytes = function() {
						return [];
					};
					part.element = <JpegExif exif={part.info} />;
				}
				else {
					//usually Adobe data (xml); check id and render accordingly.
					part.element = <p>App1 (id: {id}) at offset: {marker.offset}</p>;
				}
				break;
			default:
				/*	bytes for generic JPEG segments will be compiled in a worker when the JPEG is built, because 
					if we were to compile 2 dozen segment's in the main thread, the extra overhead might cause 
					significant latency, and the app would no longer feel fast and snappy. */
				part.element = <p>{marker.name} (0x{marker.byteMarker.toString(16)}) at offset: {marker.offset}</p>
				break;
		}
		return part;
	});
	this.save = function() {
		//adding prototypes to Jpeg does not work as expected, and we must .bind(this); why?
		var worker = new Worker(WORKER_PATH_BUILD_JPEG_FILE_BUFFER);
		worker.onmessage = function(message) {
			var jpegByteArray = message.data;
			var buffer = new ArrayBuffer(jpegByteArray.length);
			new Uint8Array(buffer).set(jpegByteArray);
			var blob = new Blob([buffer], {type: "image/jpeg"});
			saveAs(blob, "test.jpg");
		};

		function shouldBeIncluded(part) {
			return part.includeWhenSaved;
		}

		var parts = this.parts.filter(shouldBeIncluded).map(function(part) {
			//filter out parts that should not be included, and pack part as an object ready for passing to workers
			//(workers only accept objects without attached functions)
			var self = {marker: part.marker};
			if (part.hasOwnProperty("info")) {
				//exif/comment info have onChange-handlers etc, so we compile them to raw bytes here instead of in the worker.
				self.bytes = part.info.compileToBytes();
			}
			return self;
		});

		worker.postMessage({parts: parts, buffer: this.buffer});
	}.bind(this);
};
var JpegElement = React.createClass({
	render: function() {
		var jpeg = this.props.jpeg;

		var parts = jpeg.parts.map(function(part) {
			return part.element;
		});

		return (
			<div className="Jpeg-element">
				<button onClick={jpeg.save}>Save Jpeg</button>
				{parts}
				<span>bytelength: {jpeg.buffer.byteLength}</span>
			</div>
		);
	},
});