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
	//this element has an issue. checkboxes do not update to reflect the active JPEG when you change tabs,
	//in fact it doesnt properly reflect anything.
	onChange: function(event) {
		this.props.part.onChange(event);
		this.forceUpdate();
	},
	render: function() {
		return (
			<div className="jpeg-part">
				<input type="checkbox" value={this.props.part.includeWhenSaved} onChange={this.onChange} />
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
			self.includeWhenSaved = event.target.checked;
		};
		var bytes = null;
		this.bytesGetter = function() {return bytes};
		Object.defineProperty(this, "bytes", {
			get: function() {
				/* We define getters for the part's bytearray in the switch-statement below because we don't want 
				users who might only be interested in reading parsed exif info have to wait for us to for example read
				segments (parts) of the file that pertain only to the image-data. */
				return self.bytesGetter();
			},
			set: function(val) {
				bytes = val;
				self.bytesGetter = function() {
					//is this necessary?
					return bytes;
				};
			},
		});
	};

	this.parts = this.markers.map(function(marker) {

		var part = new Part(marker);
		var bytes = null;

		switch (marker.byteMarker) {
			case 0xFFFE: //Comment
				part.comment = new function() {
					this.value = readJpegComment(marker.offset, buffer);
					this.onChange = function(event) {
						//for bubbling events. We still need to forceUpdate any <input> fields to reflect the changed value.
						this.value = event.target.value;
					}.bind(this);
				};
				part.bytesGetter = function() {
					var _bytes = [];
					for (var i = 0, len = part.comment.value.length; i < len; i++) {
						_bytes.push(part.comment.value.charCodeAt(i));
					}
					return _bytes;
				};
				part.element = <JpegComment comment={part.comment} />;
				break;
			case 0xFFE1: //App1
				var id = readJpegApp1Id(marker.offset, buffer);
				if (id === "Exif") {
					part.exif = readJpegExif(marker.offset, buffer);
					part.bytesGetter = function() {return ["EXIF"];};
					part.element = <JpegExif exif={part.exif} />;
				}
				else {
					//usually Adobe data (xml); check id and render accordingly.
					part.bytesGetter = function() {return ["ADOBE"];};
					part.element = <p>App1 (id: {id}) at offset: {marker.offset}</p>;
				}
				break;
			default:
				if (marker.byteMarker > 0xFFBF && marker.byteMarker < 0xFFFE) {
					part.bytesGetter = function() {
						return readJpegGenericSegment(marker.offset, buffer);
					};
				}
				else {
					console.log("Unhandled marker for bytes:"+marker.byteMarker.toString(16)+" ("+marker.name+")");
				}
				part.element = <p>{marker.name} (0x{marker.byteMarker.toString(16)}) at offset: {marker.offset}</p>
				break;
		}
		return part;
	});
	this.save = function() {
		//adding prototypes to Jpeg does not work as expected, and we must .bind(this); why?
		this.parts.forEach(function(part) {
			if (part.includeWhenSaved) {
				console.log(part.marker.byteMarker, part.bytes);
			}
		});
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