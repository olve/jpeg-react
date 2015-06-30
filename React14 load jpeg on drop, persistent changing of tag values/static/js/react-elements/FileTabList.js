var FileTabList = React.createClass({
	render: function() {
		var self = this;
		var tabs = this.props.files.map(function(file, index) {
			var classNames = "file-tab";
			if (index === self.props.active) {
				classNames += " file-tab-active";
			}
			if (file.buffer !== null) {
				classNames += " file-tab-loaded";
			}
			return (
				<li 
					key={"file-tab-"+index}
					className={classNames}
					onClick={function() {return self.props.setActive(index);}}
				>
					{file.data.name}
				</li>
			);
		});
		return (
			<ul>
				{tabs}
			</ul>
		);
	},
});