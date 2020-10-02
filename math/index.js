const Vector = require('./Vector'),
	Matrix = require('./Matrix'),
	mean = require('./mean');

let fns = [
	function toDiagonalMatrix(){
		return Matrix.Diagonal(this.elements);
	},
	function rotate(t, obj){
		var V, R = null, x, y, z, { elements: e } = this;
		if(t.determinant) R = t.elements;
		switch(e.length){
			case 2: {
				V = obj.elements || obj;
				if(V.length !== 2) return null;
				if(!R) R = Matrix.Rotation(t).elements;
				x = e[0] - V[0];
				y = e[1] - V[1];
				return new Vector([
					V[0] + R[0][0] * x + R[0][1] * y,
					V[1] + R[1][0] * x + R[1][1] * y
				]);
			}
			case 3: {
				if(!obj.direction) return null;
				var C = obj.pointClosestTo(this).elements;
				if(!R) R = Matrix.Rotation(t, obj.direction).elements;
				x = e[0] - C[0];
				y = e[1] - C[1];
				z = e[2] - C[2];
				return new Vector([
					C[0] + R[0][0] * x + R[0][1] * y + R[0][2] * z,
					C[1] + R[1][0] * x + R[1][1] * y + R[1][2] * z,
					C[2] + R[2][0] * x + R[2][1] * y + R[2][2] * z
				]);
			}
			default: return null;
		}
	},
	function toMatrix(type = 'col'){
		var els, key = Vector.ELMS;
		// 1 x n
		if(type === 'row')
			els = [ this[key].slice() ];
		// n x 1
		else if(type === 'col')
			els = this[key].map(v => [ v ]);
		else
			els = this[key];
		return new Matrix(els);
	}
];

for(let fn of fns)
	Object.defineProperty(Vector.prototype, fn.name, {
		enumerable: false,
		configurable: true,
		writable: true,
		value: fn
	});

//random = () => 1 - (Math.tanh((2 * Math.random() - 1) * (1 / Math.random() - 1)) ** 2);
const random = () => 2 * Math.random() - 1;

class IMGData{
	constructor(data, ...dims){
		this.dims = Array.from(dims).map(v => v | 0);
		this.data = data ? (
			Array.isArray(data) ? data : Array.from(data)
		) : Array.from({ length: this.computedDims[this.space] }).fill(0);
	}
	get length(){ return this.data.length; }
	get dims(){ return this[IMGData.DIMS]; }
	get width(){ return this[IMGData.DIMS][0]; }
	get height(){ return this[IMGData.DIMS][1]; }
	get channels(){ return this[IMGData.DIMS][2]; }
	get space(){ return this[IMGData.DIMS].length; }
	set dims(x){
		this[IMGData.DIMS] = x.map(x => x | 0);
		this.computeDims();
	}
	set width(x){
		this[IMGData.DIMS][0] = x | 0;
		this.computeDims();
	}
	set height(x){
		this[IMGData.DIMS][1] = x | 0;
		this.computeDims();
	}
	set channels(x){
		this[IMGData.DIMS][2] = x | 0;
		this.computeDims();
	}
	
	computeDims(){
		var { dims, space } = this, spm1 = space - 1;
		var c = this.computedDims = Array.from({ length: space }).fill(1);
		
		for(var i = 0, j; i < spm1; i++){
			for(j = i + 1; j < space; j++)
				c[j] *= dims[i];
		}
		c.push(c[spm1] * dims[spm1]);
	}
	/**
	 * img.px(7, 1, 2):
	 * x: 7, y: 1, ch: 2
	 * index = 0
	 * index += img.width * img.height * ch
	 * index += img.width * y
	 * index += x
	 * 
	 * index = 0
	 * index += dims[0] * dims[1] * ch
	 * index += dims[0] * y
	 * index += 1 * x
	 * 
	 * c = [1, dims[0], dims[0] * dims[1]]
	 */
	px(...coords){
		return this.data[this.index(coords)];
	}
	pxSet(val, ...coords){
		return (this.data[this.index(coords)] = val);
	}
	index(coords){
		const { computedDims: comp, dims, space } = this;
		coords = coords.map((v, i) => +v % dims[i]);
		
		var index = 0;
		for(let i = space - 1; i >= 0; i--)
			index += coords[i] * comp[i];
		return index;
	}
	coords(index = 0){
		index %= this.length;
		
		const { computedDims: comp, space } = this;
		
		var coords = [], mod, c;
		for(var i = 0; i < space; i++){
			c = comp[i + 1];
			mod = index % c;
			coords.push(mod / comp[i]);
			index -= mod;
		}
		return coords;
	}
	slice(coords, length){
		var index = this.index(coords);
		return this.data.slice(index, index + length);
	}
}
IMGData.DIMS = Symbol("DIMS");

module.exports = { Vector, Matrix, random, IMGData, mean };