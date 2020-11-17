const Vector = require('./Vector'),
	Matrix = require('./Matrix');

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


module.exports = {
	Vector,
	Matrix,
	random(min = -1, max = 1){
		return Math.random() * (max - min) + min;
	},
	randomer(min = -1, max = 1){
		return () => Math.random() * (max - min) + min;
	},
	IMGData: require('./IMGData'),
	mean: require('./mean')
};