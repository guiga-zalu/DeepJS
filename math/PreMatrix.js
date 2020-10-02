const PRECISION = require("./PRECISION");
const { igualeAll } = require("../libs");

class PreMatrix{
	constructor(elements){
		this.setElements(elements);
	}
	e(i,j){
		var { elements: e } = this;
		if(i < 1 || i > e.length || j < 1 || j > e[0].length)
			return null;
		return e[i - 1][j - 1];
	}
	get dimensions(){
		var { elements: e } = this, { length: n } = e;
		var cols = (n === 0) ? 0 : e[0].length;
		return [ n, cols ];
	}
	get rows(){
		return this.elements.length;
	}
	get cols(){
		return this.rows === 0 ? 0 : this.elements[0].length;
	}
	eql(matrix){
		var M = matrix.elements || matrix;
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(!M[0] || typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		
		if(n === 0 || M.length === 0) return n === M.length;
		if(n !== M.length) return false;
		if(e[0].length !== M[0].length) return false;
		
		var i = n, nj = e[0].length, j;
		while(i--){
			j = nj;
			while(j--){
				if(Math.abs(e[i][j] - M[i][j]) > PRECISION)
					return false;
			}
		}
		return true;
	}
	dup(){
		return new this.constructor(this.elements);
	}
	map(fn, context = this){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return new ctn([]);
		var els = [], i = n, nj = e[0].length, j;
		while (i--){
			j = nj;
			els[i] = [];
			while(j--)
				els[i][j] = fn.call(context, e[i][j], i + 1, j + 1);
		}
		return new ctn(els);
	}
	isSameSizeAs(matrix){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		var M = matrix.elements || matrix;
		if(typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		if(n === 0) return M.length === 0;
		return (n === M.length && e[0].length === M[0].length);
	}
	add(matrix){
		var { elements: e, constructor: ctn } = this;
		if(e.length === 0) return this.dup();
		
		var M = 'elements' in matrix ? matrix.elements : matrix;
		
		if(typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		
		if(!this.isSameSizeAs(M)) return null;
		
		return this.map((x, i, j) => x + M[i - 1][j - 1]);
	}
	subtract(matrix){
		var { elements: e, constructor: ctn } = this;
		if(e.length === 0) return this.dup();
		
		var M = matrix.elements || matrix;
		
		if(typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		
		if(!this.isSameSizeAs(M)) return null;
		
		return this.map((x, i, j) => x - M[i - 1][j - 1]);
	}
	canMultiplyFromLeft(matrix){
		var { elements: e, constructor: ctn } = this;
		if(e.length === 0) return false;
		
		var M = matrix.elements || matrix;
		
		if(typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		// this.columns should equal matrix.rows
		return (e[0].length === M.length);
	}
	multiply(matrix){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return null;
		if(!matrix.elements) return this.map(x => x * matrix);
		
		var returnVector = !!matrix.modulus;
		var M = matrix.elements || matrix;
		
		if(typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		
		if(!this.canMultiplyFromLeft(M)) return null;
		var i = n, nj = M[0].length, j;
		var cols = e[0].length, c, elements = [], sum;
		while (i--){
			j = nj;
			elements[i] = [];
			while(j--){
				c = cols;
				sum = 0;
				while (c--)
					sum += e[i][c] * M[c][j];
				elements[i][j] = sum;
			}
		}
		M = new ctn(elements);
		return returnVector ? M.col(1) : M;
	}
	minor(a, b, c, d){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return null;
		var elements = [], ni = c, i, nj, j;
		var rows = n, cols = e[0].length;
		while(ni--){
			i = c - ni - 1;
			elements[i] = [];
			nj = d;
			while(nj--){
				j = d - nj - 1;
				elements[i][j] = e[(a + i - 1) % rows][(b + j - 1) % cols];
			}
		}
		return new ctn(elements);
	}
	transpose(){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return this.dup();
		var rows = n, cols = e[0].length, j;
		var elements = [], i = cols;
		while(i--){
			j = rows;
			elements[i] = [];
			while(j--)
				elements[i][j] = e[j][i];
		}
		return new ctn(elements);
	}
	max(){
		var { elements: e } = this, { length: n } = e;
		if(n === 0) return null;
		var m = 0, i = n, nj = e[0].length, j;
		while (i--){
			j = nj;
			while (j--){
				if (Math.abs(e[i][j]) > Math.abs(m))
					m = e[i][j];
			}
		}
		return m;
	}
	indexOf(x){
		var { elements: e } = this, { length: n } = e;
		if(n === 0) return null;
		var ni = n, i, nj = e[0].length, j;
		for(i = 0; i < ni; i++){
			for(j = 0; j < nj; j++){
				if(e[i][j] === x) return {
					i: i + 1,
					j: j + 1
				};
			}
		}
		return null;
	}
	toRightTriangular(){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return new ctn([]);
		var M = this.dup(), els;
		var i, j, np = e[0].length, p;
		for(i = 0; i < n; i++){
			if(M.elements[i][i] === 0){
				for(j = i + 1; j < n; j++){
					if(M.elements[j][i] !== 0){
						els = [];
						for(p = 0; p < np; p++)
							els.push(M.elements[i][p] + M.elements[j][p]);
						M.elements[i] = els;
						break;
					}
				}
			}
			if(M.elements[i][i] !== 0){
				for(j = i + 1; j < n; j++){
					var multiplier = M.elements[j][i] / M.elements[i][i];
					els = [];
					for (p = 0; p < np; p++){
						// Elements with column numbers up to an including the number of the
						// row that we're subtracting can safely be set straight to zero,
						// since that's the point of this routine and it avoids having to
						// loop over and correct rounding errors later
						els.push(p <= i ? 0 : M.elements[j][p] - M.elements[i][p] * multiplier);
					}
					M.elements[j] = els;
				}
			}
		}
		return M;
	}
	determinant(){
		if(this.elements.length === 0) return 1;
		if(!this.isSquare) return null;
		var M = this.toRightTriangular();
		var Me = M.elements, det = Me[0][0], n = Me.length;
		for(var i = 1; i < n; i++)
			det *= Me[i][i];
		return det;
	}
	get isSingular(){
		return (this.isSquare && this.determinant() === 0);
	}
	trace(){
		var { elements: e } = this, { length: n } = e;
		if(n === 0) return 0;
		if(!this.isSquare) return null;
		var tr = e[0][0];
		for(var i = 1; i < n; i++)
			tr += e[i][i];
		return tr;
	}
	rank(){
		var { elements: e } = this, { length: n } = e;
		if(n === 0) return 0;
		var M = this.toRightTriangular(), rank = 0;
		var i = n, nj = e[0].length, j;
		while(i--){
			j = nj;
			while(j--){
				if(Math.abs(M.elements[i][j]) > PRECISION){
					rank++;
					break;
				}
			}
		}
		return rank;
	}
	augment(matrix){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return this.dup();
		var M = matrix.elements || matrix;
		
		if(typeof(M[0][0]) === 'undefined')
			M = new ctn(M).elements;
		
		var T = this.dup(), cols = T.elements[0].length;
		var i = T.elements.length, nj = M[0].length, j;
		if(i !== M.length) return null;
		while (i--){
			j = nj;
			while (j--)
				T.elements[i][cols + j] = M[i][j];
		}
		return T;
	}
	inverse(){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n === 0) return null;
		if(!this.isSquare || this.isSingular) return null;
		var i = n, j;
		var M = this.augment(ctn.I(n)).toRightTriangular();
		var np = M.elements[0].length, p, els, divisor;
		var inverse_elements = [], new_element;
		// Matrix is non-singular so there will be no zeros on the
		// diagonal. Cycle through rows from last to first.
		while(i--){
			// First, normalise diagonal elements to 1
			els = [];
			inverse_elements[i] = [];
			divisor = M.elements[i][i];
			for (p = 0; p < np; p++){
				new_element = M.elements[i][p] / divisor;
				els.push(new_element);
				// Shuffle off the current row of the right hand side into the results
				// array as it will not be modified by later runs through this loop
				if(p >= n) inverse_elements[i].push(new_element);
			}
			M.elements[i] = els;
			// Then, subtract this row from those above it to give the identity matrix
			// on the left hand side
			j = i;
			while (j--){
				els = [];
				for (p = 0; p < np; p++)
					els.push(M.elements[j][p] - M.elements[i][p] * M.elements[j][i]);
				M.elements[j] = els;
			}
		}
		return new ctn(inverse_elements);
	}
	round(){
		return this.map(x => Math.round(x));
	}
	snapTo(x){
		return this.map(p => (Math.abs(p - x) <= PRECISION) ? x : p);
	}
	setElements(els){
		var	i, j,
			elements = els.elements || els,
			n = elements.length;
		
		var e = this.elements = [];
		if(elements[0] && typeof(elements[0][0]) !== 'undefined'){
			i = n;
			while(i--){
				j = elements[i].length;
				e[i] = [];
				while(j--) e[i][j] = elements[i][j];
			}
			return this;
		}
		for(i = 0; i < n; i++) e.push([elements[i]]);
		return this;
	}
	//From glUtils.js
	get flatten(){
		var { elements: e } = this, { length: n } = e;
		var result = [];
		if(n == 0) return [];
		
		for(var j = 0; j < e[0].length; j++){
			for (var i = 0; i < n; i++)
				result.push(e[i][j]);
		}
		return result;
	}
	//From glUtils.js
	ensure4x4(){
		var { elements: e } = this, { length: n } = e;
		if(n == 4 && e[0].length == 4) return this;
		if(n > 4 || e[0].length > 4) return null;
		for(var i = 0; i < n; i++){
			for(var j = e[i].length; j < 4; j++){
				if(i == j) e[i].push(1);
				else e[i].push(0);
			}
		}
		for(i = n; i < 4; i++){
			if(i == 0) e.push([1, 0, 0, 0]);
			else if(i == 1) e.push([0, 1, 0, 0]);
			else if(i == 2) e.push([0, 0, 1, 0]);
			else if(i == 3) e.push([0, 0, 0, 1]);
		}
		return this;
	}
	//From glUtils.js
	make3x3(){
		var { elements: e, constructor: ctn } = this, { length: n } = e;
		if(n != 4 || e[0].length != 4) return null;
		return new ctn([
			[e[0][0], e[0][1], e[0][2]],
			[e[1][0], e[1][1], e[1][2]],
			[e[2][0], e[2][1], e[2][2]]
		]);
	}
	static I(n){
		var els = [], i = n, j;
		while(i--){
			j = n;
			els[i] = [];
			while(j--)
				els[i][j] = +(i === j);
		}
		return new this(els);
	}
	static Diagonal(elements){
		var i = elements.length;
		var M = this.I(i);
		while (i--)
			M.elements[i][i] = elements[i];
		return M;
	}
	static Rotation(theta, a){
		if(!a) return new this([
			[Math.cos(theta),	-Math.sin(theta)],
			[Math.sin(theta),	Math.cos(theta)]
		]);
		var axis = a.dup();
		if(axis.dimensions !== 3) return null;
		var mod = axis.modulus;
		var x = axis.elements[0] / mod, y = axis.elements[1] / mod, z = axis.elements[2] / mod;
		var s = Math.sin(theta), c = Math.cos(theta), t = 1 - c;
		// Formula derived here: http://www.gamedev.net/reference/articles/article1199.asp
		// That proof rotates the co-ordinate system so theta becomes -theta and sin
		// becomes -sin here.
		return new this([
			[ t * x * x + c,		t * x * y - s * z,	t * x * z + s * y ],
			[ t * x * y + s * z,	t * y * y + c,		t * y * z - s * x ],
			[ t * x * z - s * y,	t * y * z + s * x,	t * z * z + c ]
		]);
	}
	static RotationX(t){
		var c = Math.cos(t), s = Math.sin(t);
		return new this([
			[ 1, 0, 0 ],
			[ 0, c, -s ],
			[ 0, s, c ]
		]);
	}
	static RotationY(t){
		var c = Math.cos(t), s = Math.sin(t);
		return new this([
			[ c, 0, s ],
			[ 0, 1, 0 ],
			[ -s, 0, c ]
		]);
	}
	static RotationZ(t){
		var c = Math.cos(t), s = Math.sin(t);
		return new this([
			[ c, -s, 0 ],
			[ s, c, 0 ],
			[ 0, 0, 1 ]
		]);
	}
	static Random(n, m){
		return this.Zero(n, m).map(() => Math.random());
	}
	//From glUtils.js
	static Translation(v){
		if(v.elements.length == 2){
			let r = this.I(3);
			r.elements[2][0] = v.elements[0];
			r.elements[2][1] = v.elements[1];
			return r;
		}
		if(v.elements.length == 3){
			let r = this.I(4);
			r.elements[0][3] = v.elements[0];
			r.elements[1][3] = v.elements[1];
			r.elements[2][3] = v.elements[2];
			return r;
		}
		throw "Invalid length for Translation";
	}
	static Zero(n, m){
		var els = [], i = n, j;
		while(i--){
			j = m;
			els[i] = Array.from({ length: m }).fill(0);
		}
		return new this(els);
	}
	static sum(m){
		return m.elements.reduce((s, a) => s + a.reduce((t, b) => t + b, 0), 0);
	}
}

igualeAll(PreMatrix.prototype, [
	[['toUpperTriangular'], 'toRightTriangular'],
	[['det'], 'determinant'],
	[['tr'], 'trace'],
	[['rk'], 'rank'],
	[['inv'], 'inverse'],
	[['x', 'times'], 'multiply'],
	[['plus', 'sum'], 'add'],
	[['sub', 'minus'], 'subtract']
]);

module.exports = PreMatrix;