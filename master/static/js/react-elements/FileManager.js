var FileManager = React.createClass({
	getInitialState: function(event) {
		return {
			files: [],
			active: 0,
		};
	},
	cancelEvent: function(event) {
		event.stopPropagation();
		event.preventDefault();
		return event;
	},
	dropEvent: function(event) {
		if (!event.dataTransfer.files.length) return; //user dropped something other than files, stop handling event
		event = this.cancelEvent(event);
		event.dataTransfer.dropEffect = "copy";
		for (var i = 0, fileData; fileData = event.dataTransfer.files[i]; i++) {
			var file = new File(fileData, function onFileUpdate() {this.forceUpdate();}.bind(this));
			this.setState({files: this.state.files.concat([file])});
		}
		this.setState({active: this.state.files.length});
	},
	componentDidMount: function() {
		window.addEventListener("dragenter", this.cancelEvent, false);
		window.addEventListener("dragover", this.cancelEvent, false);
		window.addEventListener("dragleave", this.cancelEvent, false);
		window.addEventListener("drop", this.dropEvent, false);
	},
	componentWillUnmount: function() {
		window.removeEventListener("dragenter", this.cancelEvent, false);
		window.removeEventListener("dragover", this.cancelEvent, false);
		window.removeEventListener("dragleave", this.cancelEvent, false);
		window.removeEventListener("drop", this.cancelEvent, false);
	},
	setActive: function(index) {
		return this.setState({active: index});
	},
	render: function() {
		if (this.state.files.length) {
			var activeFile = this.state.files[this.state.active];
			var activeFileElement = activeFile ? activeFile.element : <span>No file selected</span>;
			return (
				<div className="file-manager">
					<FileTabList files={this.state.files} setActive={this.setActive} active={this.state.active} />
					{activeFileElement}
				</div>
			);
		}
		else {
			return (
				<span>drop some files</span>
			);
		}
	},
});