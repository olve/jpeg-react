var FileManagerFileNameInput = React.createClass({
	onChange: function(event) {
		this.props.onChange(event);
		this.forceUpdate();
	},
	render: function() {
		return (
			<input value={this.props.file.desiredFileName} placeholder="filename.jpg" className="filename-input" onChange={this.onChange} />
		);
	},
});
var FileManagerSaveButton = React.createClass({
	finishedSavingCallback: function() {
		React.findDOMNode(this.refs.saveButtonStatus).textContent = "";
	},
	click: function(event) {
		React.findDOMNode(this.refs.saveButtonStatus).textContent = "building file...";
		this.props.file.info.save(this.props.file.desiredFileName, this.finishedSavingCallback);
	},
	render: function() {
		if (this.props.file) {
			if (this.props.file.info) {
				if (this.props.file.info.hasOwnProperty("save")) {
					return (
						<div>
							<button className="filemanager-top-panel-save-button" onClick={this.click}>Save file</button>
							<span className="filemanager-save-button-statustext" ref="saveButtonStatus"></span>
						</div>
					);
				}
			}
		}
		//file.info.save(fileName) is not a method; we wont render a button.
		return null;
	},
});
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
		this.setState({active: this.state.files.length-1});
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
	bulkClean: function() {
		this.state.files.forEach(function(file) {
			if (file.info !== null && typeof file.info.clean === "function" && file.buffer) {
				file.info.clean();
				file.info.save("clean_"+file.data.name);
			}
		})
	},
	render: function() {
		if (this.state.files.length) {
			var activeFile = this.state.files[this.state.active];
			var activeFileElement = activeFile ? activeFile.element : <span>No file selected</span>;

			function onChangeFileName(event) {
				activeFile.desiredFileName = event.target.value;
			}

			var fileNameInput = null;
			var saveButton = null;
			if (activeFile) {
				fileNameInput = <FileManagerFileNameInput file={activeFile} onChange={onChangeFileName} />;
				saveButton = <FileManagerSaveButton file={activeFile} />;
				bulkCleanButton = <button onClick={this.bulkClean}>Bulk clean</button>
			}

			return (
				<div className="filemanager">

					<div className="filemanager-top-panel">
						{fileNameInput}
						{saveButton}
						{bulkCleanButton}
					</div>
					<div className="filemanager-main-panel">
						<FileTabList files={this.state.files} setActive={this.setActive} active={this.state.active} />
						{activeFileElement}
					</div>
				</div>
			);
		}
		else {
			return (
				<div className="filemanager-file-drop-prompt">
					<span>Drag & drop some JPEG or BMP files here to analyze/edit them</span>
				</div>
			);
		}
	},
});
