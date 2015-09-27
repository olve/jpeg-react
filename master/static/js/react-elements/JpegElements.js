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
				<span title={"Tag id: " + tag.id}>{name}</span> {input}
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
				<input type="text" value={this.props.comment.value} onChange={this.onChange} />
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
				tag.hasBeenChanged = false;
				tag.onChangeHandler = function(event) {
					this.value = [event.target.value];
					this.hasBeenChanged = true;
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
var GenericJpegMarkerElement = React.createClass({
	render: function() {
		var marker = this.props.marker;
		return (
			<p>{marker.name} (0x{marker.byteMarker.toString(16)}) at offset: {marker.offset}</p>
		);
	},
});
var JpegElement = React.createClass({
	render: function() {
		var jpeg = this.props.jpeg;

		var parts = jpeg.parts.map(function(part) {
			return part.element;
		});

		return (
			<div className="Jpeg-element">
				{parts}
				<span>bytelength: {jpeg.buffer.byteLength}</span>
			</div>
		);

	},
});