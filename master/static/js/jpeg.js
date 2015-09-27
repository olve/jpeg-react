var WORKER_PATH_BUILD_JPEG_FILE_BUFFER = "static/js/workers/buildJpegFileBuffer.js";

var Jpeg = function(buffer) {
	/*	Constructor for a JPEG object.
		Reads and analyzes a JPEG, then generates editable React elements for every segment of data in the file.
		Segments are called 'Parts'.
		The Jpeg Object has a method "save(desiredFileName)", which will save the analayzed JPEG as a new file, including any changes made.
	*/
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

	var _markers = this.markers;

	function nullEmbeddedParts(index, start, stop) {
		//null markers within <start, stop> range; they are are part of an image embedded in another part
		for (var i=index+1, len=_markers.length; i<len; i++) {
			if (_markers[i].offset > start && _markers[i].offset < stop) {
				_markers[i] = null;
			}
			else {
				return;
			}
		}
	}

	//Build array of jpeg segments.
	this.parts = this.markers.map(function(marker, index) {

		if (marker === null) return null;

		var part = new Part(marker);
		var bytes = null;

		switch (marker.byteMarker) {
			//parse jpeg-segment. define getter for raw bytes of the part, and build raw bytes from edited comments, exif-tags, etc.
			//also set part.element, for rendering. part.element has a setter-function, wrapping the element in a <JpegPartElement />

			case 0xEA1C: //Microsoft Padding
				part.info = {
					//padding: readMicrosoftPadding(marker.offset, buffer, _markers[index+1]),
					padding: [],
					compileToBytes: function() {
						return this.padding;
					},
				};
				part.element = <GenericJpegMarkerElement marker={marker} />;
				break;
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
						var compiled = new CompiledExifSegment(this.info);
						return compiled.struct.array;
					}.bind(part);
					part.element = <JpegExif exif={part.info} />;

					/* 	We must iterate over the next parts of the JPEG, and see if any of them are part of this APP1 segment.
						If they are, we will handle them according to their type and delete them from Jpeg.markers. 
						Many bad things can happen if we don't. A thumbnail-image embedded in an EXIF segment could be parsed as the 
						main image for example.
					*/

					var start = marker.offset;
					var stop = start + readJpegApp1Length(marker.offset, buffer); 

					for (var i = index+1, len = _markers.length; i < len; i++) {
						var embeddedMarker = _markers[i];
						if (!embeddedMarker) {
							//markers may have been nulled before.
							continue;
						}
						if (embeddedMarker.offset > stop) {
							//this marker is outside the App1 segment.
							break;
						}
						if (embeddedMarker.byteMarker === 0xFFD8 && i === index + 1) {
							/*	The first trailing marker is the SOI marker for a thumbnail embedded in the EXIF segment.
								we will cut all parts belonging to the embedded thumb from the list of markers for the JPEG itself,
								and include them in the EXIF part instead. */
							var _thumbMarkers = [];
							for (var ___i = index+1, len = _markers.length; ___i < len; ___i++) {
								var _thumbMarker = _markers[___i];
								_markers[___i] = null;
								_thumbMarkers.push(_thumbMarker);
								if (_thumbMarker.byteMarker === 0xFFD9) {
									//EOI, end of image; end of thumb data.
									break;
								}
							}
							var startOfThumbData = _thumbMarkers[0].offset;
							var endOfThumbData = _thumbMarkers[_thumbMarkers.length-1].offset + 2; //+2 to include the EOI-marker 0xFFD9
							part.info.thumbnailData = Array.prototype.slice.call(new Uint8Array(buffer), startOfThumbData, endOfThumbData);
						}
						if (embeddedMarker.byteMarker === 0xEA1C) {
							_markers[i] = null;
						}
					}
				}
				else {
					//usually Adobe data (xml); check if id === "<...adobe/...>" and render accordingly.
					part.element = <p>App1 (id: {id}) at offset: {marker.offset}</p>;
				}
				break;
			case 0xFFE2: //APP2
			case 0xFFED: //APP13
				//remove any jpeg markers found within these parts, as they are embedded images.
				function nullMarkerWithLengthIndicator(index, marker) {
					var view = new DataView(buffer);
					var length = view.getUint16(marker.offset+2);
					nullEmbeddedParts(index, marker.offset, marker.offset+length);
				}
				nullMarkerWithLengthIndicator(index, marker);
				part.element = <GenericJpegMarkerElement marker={marker} />;
				break;
			case 0xFFDA: //SOS
				/*	SCAN segments contain many jpeg markers, but the segment does not have a length indicator; one can only find the end
					by decoding the segment. We will instead null everything until the next EOI marker. */
				part.info = {
					eoi: _markers[_markers.length-1], //default to last marker in file, in case we cant find a trailing EOI marker.
				};
				for (var i=index+1, len=_markers.length; i<len; i++) {
					if (_markers[i].byteMarker === 0xFFD9) {
						part.info.eoi = _markers[i];
						break;
					}
					else {
						_markers[i] = null;
					}
				}
				part.info.compileToBytes = function() {
					var start = this.marker.offset;
					var stop = this.info.eoi.offset;
					return Array.prototype.slice.call(new Uint8Array(buffer), start, stop);
				}.bind(part);
				part.element = <GenericJpegMarkerElement marker={marker} />;
				break;
			default:
				/*	bytes for generic JPEG segments will be compiled in a worker when the JPEG is built, because 
					if we were to compile 2 dozen segment's in the main thread, the extra overhead might cause 
					significant latency, and the app would no longer feel fast and snappy. */
				part.element = <GenericJpegMarkerElement marker={marker} />;
				break;
		}
		return part;
	}).filter(function(part) {
		//filter out nulled parts (thumbnails embedded in exif)
		if (part === null) return false;
		return true;
	});
	this.save = function(desiredFileName) {
		//adding prototypes to Jpeg does not work as expected, and we must .bind(this); why?
		var worker = new Worker(WORKER_PATH_BUILD_JPEG_FILE_BUFFER);
		worker.onmessage = function(message) {
			var jpegByteArray = message.data;
			var buffer = new ArrayBuffer(jpegByteArray.length);
			new Uint8Array(buffer).set(jpegByteArray);
			var blob = new Blob([buffer], {type: "image/jpeg"});
			saveAs(blob, desiredFileName);
		};
		var parts = this.parts.filter(function(_part){return _part.includeWhenSaved;}).map(function(part) {
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