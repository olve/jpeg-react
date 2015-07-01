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

var JpegExif = React.createClass({
	render: function() {
		if (this.props.exif === null) return null;
		var exif = this.props.exif;

		function buildTagList(ifd, dictionary) {
			var tags = ifd.tagList.map(function(tag) {
				tag.onChangeHandler = function(event) {
					console.log(event.target.value);
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
var JpegComment = React.createClass({
	render: function() {
		if (this.props.comment === null) {
			return null;
		}
		return (
			<div>
				<h2>Comment</h2>
				<p>{this.props.comment}</p>
			</div>
		);
	},
});

var JpegElement = React.createClass({
	render: function() {
		var jpeg = this.props.jpeg;
		return (
			<div className="Jpeg-element">
				<JpegComment comment={jpeg.comment} />
				<JpegExif exif={jpeg.exif} />

			</div>
		);
	},
});