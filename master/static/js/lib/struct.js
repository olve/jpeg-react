var Struct = function() {

	this.members = [];

	var array;
	var string;
	var byteLength;

	Object.defineProperty(this, "array", {
		get: function() {
			var output = [];
			for (var i=0; i < this.members.length; i++) {
				output.push.apply(output, this.members[i].array);
			}
			return output;
		},
	});
	Object.defineProperty(this, "string", {
		get: function() {
			var output = "";
			for (var i=0; i < this.members.length; i++) {
				output += this.members[i].string;
			}
			return output;
		},
	});
	Object.defineProperty(this, "byteLength", {
		get: function() {
			var output = 0;
			for (var i = 0; i < this.members.length; i++) {
				output += this.members[i].byteLength;
			}
			return output;
		},
	})

};

Struct.prototype.createMember = function(chr, array) {

	if (!this.TYPES.hasOwnProperty(chr)) throw("invalid type: "+chr);

	var type = this.TYPES[chr];

	var byteLength = array.length;
	var buffer = new ArrayBuffer(byteLength);
	new Uint8Array(buffer).set(array);

	var self = {
		chr: chr,
		array: array,
		byteLength: byteLength,
		buffer: buffer,
	};

	self.offset = this.byteLength;

	var types = this.TYPES;
	self.get = function(chr, offset) {return types[chr].get.apply(new DataView(self.buffer), [offset])};
	self.set = function(chr, offset, value) {
		if (arguments.length !== 3) throw("Invalid arguments for set");
		types[chr].set.apply(new DataView(self.buffer), [offset, value]);
		self.array = Array.prototype.slice.call(new Uint8Array(self.buffer));
	};
	Object.defineProperty(self, "string", {
		get: function() {
			var output = "";
			for (var i = 0; i < self.array.length; i++) {
				output+= String.fromCharCode(self.array[i]);
			}
			return output;
		},
	});

	return self;
};
Struct.prototype.push = function(chr, values, littleEndian) {
	//push [values] or value to this.members
	if (typeof values === "number") values = [values];
	else if (typeof values === "string") {
		var charcodes = [];
		for (var i = 0; i < values.length; i++) {
        	charcodes[i] = values.charCodeAt(i);
		}
		values = charcodes;
	}
	var array = [];

	for (var i=0; i < values.length; i++) {
		var bytes = this.intToBytes(chr, values[i], littleEndian);
		array.push.apply(array, bytes);
	}

	var member = this.createMember(chr, array);
	this.members.push(member);
	return member;
};

Struct.prototype.intToBytes = function(chr, integer, littleEndian) {
	var size = this.TYPES[chr].size;
	if (size <= 1 && integer < 256) return [integer];

	var array = new Array(size);

	if (littleEndian) {
		for (var i = 0; i < size; i++) {
			array[i] = integer & 255;
			integer = integer >> 8;
		}
	}
	else {
		for (var i = size-1; i > -1 ; i--) {
			array[i] = integer & 255;
			integer = integer >> 8;
		}
	}
	return array;
};
Struct.prototype.TYPES = {
	c: { //char (string)
		size:1,
		chr: "c",
		get: function() {return String.fromCharCode(DataView.prototype.getUint8.apply(this, arguments));},
		set: function(offset, ascii) {DataView.prototype.setUint8.apply(this, [offset, ascii.charCodeAt(0)]);},
		view: Uint8Array,
	},
	b: { //signed char
		size:1,
		chr: "b",
		get: DataView.prototype.getInt8,
		set: DataView.prototype.setInt8,
		view: Int8Array,
	},
	B: { //unsigned char
		size: 1,
		chr: "B",
		get: DataView.prototype.getUint8,
		set: DataView.prototype.setUint8,
		view: Uint8Array,
	},
	"?": { //bool
		size: 1,
		chr: "?",
		get: function() {return DataView.prototype.getUint8.apply(this, arguments) ? true : false;},
		set: DataView.prototype.setUint8,
		view: Uint8Array,
	},
	h: { //short
		size: 2,
		chr: "h",
		get: DataView.prototype.getInt16,
		set: DataView.prototype.setInt16,
		view: Int16Array,
	},
	H: { //unsigned short
		size: 2,
		chr: "H",
		get: DataView.prototype.getUint16,
		set: DataView.prototype.setUint16,
		view: Uint16Array,
	},
	l: { //long
		size: 4,
		chr: "l",
		get: DataView.prototype.getInt32,
		set: DataView.prototype.setInt32,
		view: Int32Array,
	},
	L: { //unsigned long
		size: 4,
		chr: "L",
		get: DataView.prototype.getUint32,
		set: DataView.prototype.setUint32,
		view: Uint32Array,
	},
	f: { //float
		size: 4,
		chr: "f",
		get: DataView.prototype.getFloat32,
		set: DataView.prototype.setFloat32,
		view: Float32Array,
	},
	d: { //double
		size: 8,
		chr: "d",
		get: DataView.prototype.getFloat64,
		set: DataView.prototype.setFloat64,
		view: Float64Array,
	},
};
