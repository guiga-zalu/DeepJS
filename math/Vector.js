const PRECISION = require("./PRECISION");
const { igualeAll } = require("../libs");

class Vector{
	constructor(elements){
		this.setElements(elements);
	}
	set elements(x){ this[Vector.ELMS] = x || []; }
	get elements(){ return this[Vector.ELMS]; }
	e(i){
		var { elements: e } = this;
		return (i < 1 || i > e.length) ? null : e[i - 1];
	}
	get dimensions(){
		return this[Vector.ELMS].length;
	}
	get modulus(){
		var s = 0;
		for(var e of this.elements) s += e ** 2;
		return Math.sqrt(s);
	}
	eql(vector){
		var { elements: e } = this, n = e.length;
		var V = vector.elements || vector;
		if (n !== V.length) return false;
		while (n--){
			if (Math.abs(e[n] - V[n]) > PRECISION)
				return false;
		}
		return true;
	}
	forEach(fn, context = this){
		var { elements: e } = this, n = e.length;
		for (var i = 0; i < n; i++)
			fn.call(context, e[i], i + 1);
	}
	toUnitVector (){
		var r = this.modulus;
		if (r === 0)
			return this.dup();
		return this.map(x => x / r);
	}
	angleFrom(vector){
		var V = vector.elements || vector;
		var n = this.elements.length;
		if (n !== V.length) return null;
		var dot = 0, mod1 = 0, mod2 = 0;
		// Work things out in parallel to save time
		this.each((x, i) => {
			dot += x * V[i - 1];
			mod1 += x * x;
			mod2 += V[i - 1] * V[i - 1];
		});
		mod1 = Math.sqrt(mod1); mod2 = Math.sqrt(mod2);
		if(mod1 * mod2 === 0) return null;
		var theta = dot / (mod1 * mod2);
		if(theta < -1) theta = -1;
		if(theta > 1) theta = 1;
		return Math.acos(theta);
	}
	isParallelTo(vector){
		var angle = this.angleFrom(vector);
		return (angle === null) ? null : (angle <= PRECISION);
	}
	isAntiparallelTo(vector){
		var angle = this.angleFrom(vector);
		return (angle === null) ? null : (Math.abs(angle - Math.PI) <= PRECISION);
	}
	isPerpendicularTo(vector){
		var dot = this.dot(vector);
		return (dot === null) ? null : (Math.abs(dot) <= PRECISION);
	}
	add(vector){
		var V = vector.elements || vector;
		if(this.elements.length !== V.length)
			return null;
		return this.map((x, i) => x + V[i - 1]);
	}
	subtract(vector){
		var V = vector.elements || vector;
		if(this.elements.length !== V.length)
			return null;
		return this.map((x, i) => x - V[i - 1]);
	}
	multiply(k){
		return this.map(x => x * k);
	}
	dot(vector){
		var V = vector.elements || vector;
		var product = 0, { elements: e } = this, n = e.length;
		if(n !== V.length) return null;
		while(n--)
			product += e[n] * V[n];
		return product;
	}
	max(){
		var m = 0, i = this.elements.length;
		while(i--){
			if(Math.abs(this.elements[i]) > Math.abs(m))
				m = this.elements[i];
		}
		return m;
	}
	indexOf(x){
		var index = null, { elements: e } = this, n = e.length;
		for (var i = 0; i < n; i++){
			if(index === null && e[i] === x){
				index = i + 1; break;
			}
		}
		return index;
	}
	round(){
		return this.map(x => Math.round(x));
	}
	snapTo(x){
		return this.map(y => (Math.abs(y - x) <= PRECISION) ? x : y);
	}
	distanceFrom(obj){
		if(obj.anchor || (obj.start && obj.end))
			return obj.distanceFrom(this);
		var V = obj.elements || obj;
		if(V.length !== this.elements.length)
			return null;
		var sum = 0;
		this.each((x, i) => {
			sum += (x - V[i - 1]) ** 2;
		});
		return Math.sqrt(sum);
	}
	to3D(){
		var V = this.dup();
		switch(V.elements.length){
			case 3: break;
			case 2:
				V.elements.push(0);
				break;
			default:
				V.elements = V.elements.slice(0, 3);
				break;
		}
		return V;
	}
	inspect(){
		return '[' + this.elements.join(', ') + ']';
	}
	setElements(els){
		this[Vector.ELMS] = (els.elements || els || []).slice();
		return this;
	}
	//From glUtils.js
	get flatten(){
		return this.elements;
	}
	dup(){
		return new this.constructor(this.elements);
	}
	map(fn, context = this){
		var elements = [];
		this.each((x, i) => {
			elements.push(fn.call(context, x, i));
		});
		return new this.constructor(elements);
	}
	cross(vector){
		var B = vector.elements || vector;
		if (this.elements.length !== 3 || B.length !== 3)
			return null;
		var A = this.elements;
		return new this.constructor([
			(A[1] * B[2]) - (A[2] * B[1]),
			(A[2] * B[0]) - (A[0] * B[2]),
			(A[0] * B[1]) - (A[1] * B[0])
		]);
	}
	static Random(n){
		var elements = [];
		while(n--)
			elements.push(Math.random());
		return new this(elements);
	}
	static Zero(n){
		var elements = [];
		while(n--)
			elements.push(0);
		return new this(elements);
	}
	static sum(v){
		return v.elements.reduce((s, a) => s + a, 0);
	}
	static max(v){
		return v.elements.reduce((s, a) => Math.max(s, a));
	}
}

Vector.ELMS = Symbol('elements');

igualeAll(Vector.prototype, [
	[['x', 'times'], 'multiply'],
	[['plus', 'sum'], 'add'],
	[['sub', 'minus'], 'subtract'],
	[['each'], 'forEach']
]);

Vector.i = new Vector([1, 0, 0]);
Vector.j = new Vector([0, 1, 0]);
Vector.k = new Vector([0, 0, 1]);

module.exports = Vector;