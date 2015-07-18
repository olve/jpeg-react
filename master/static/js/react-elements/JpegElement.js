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
var Jpeg = function(buffer) {
	this.buffer = buffer;
	this.markers = readJpegMarkersList(this.buffer);
	this.parts = this.markers.map(function(marker) {

		var part = {
			marker: marker,
			element: null,
			includeWhenSaved: true,
		};

		switch (marker.byteMarker) {
			case 0xFFFE: //Comment
				part.element = (
					<div>
						<h2>Comment</h2>
						<p>{readJpegComment(marker.offset, buffer)}</p>
					</div>
				);
				break;
			case 0xFFE1: //App1
				var id = readJpegApp1Id(marker.offset, buffer);
				if (id === "Exif") {
					part.element = <JpegExif exif={readJpegExif(marker.offset, buffer)} />;
				}
				else {
					part.element = <p>App1 (id: {id}) at offset: {marker.offset}</p>;
				}
				break;
			default:
				if (marker.byteMarker > 0xFFBF && marker.byteMarker < 0xFFFE) {
					//bytes = readGeneric
				}
				part.element = <p>{marker.name} (0x{marker.byteMarker.toString(16)}) at offset: {marker.offset}</p>
				break;
		}
		return part;
	});
	this.save = function() {
		//Why does Jpeg.prototype.save not work? Why must we .bind to access the Jpeg as 'this'?
		this.parts.forEach(function(part) {
			if (part.includeWhenSaved) {
				console.log(part.data);
			}
		});
	}.bind(this);
};
var JpegPart = React.createClass({
	render: function() {
		var part = this.props.part;
		return (
			<div className="jpeg-part">
				<input type="checkbox" checked={part.includeWhenSaved} onChange={function(event) {
						part.includeWhenSaved = event.target.checked;
					}
				} />
				{part.element}
			</div>
		);
	},
});
var JpegElement = React.createClass({
	render: function() {
		var jpeg = this.props.jpeg;

		var parts = jpeg.parts.map(function(part) {
			return <JpegPart key={"jpeg-part-"+part.marker.offset} part={part} />;
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