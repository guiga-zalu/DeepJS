const tinycolor = require('tinycolor2');

class tinycolor_plus extends tinycolor{
	constructor(o){
		var done = false;
		if(typeof o === 'object'){
			if(!(o instanceof tinycolor)){
				done = true;
				this.fromRatio(o);
			}	
		}
		if(!done) super(...arguments);
	}
	toSXY(isHsv = false){
		isHsv = !!isHsv;
		var { s, x, y, a } = isHsv ? this.toSVXY() : this.toSLXY();
		return { s, x, y, a, isHsv, isMin: false };
	}
	toSXYString(isHsv = false){
		isHsv = !!isHsv;
		var { s, x, y, a } = this.toSXY(isHsv);
		return `sxya${isHsv ? '-hsv' : ''}(${100 * s}%, ${x.toFixed(4)}, ${y.toFixed(4)}, ${a})`;
	}
	toSLXY(){
		var { h, s, l, a } = this.toHsl();
		h *= Math.PI / 180;
		return { s, l, x: l * Math.cos(h), y: l * Math.sin(h), a, isMin: false };
	}
	toSLXYString(){
		var { s, l, x, y, a } = this.toSLXY();
		return `slxya(${100 * s}%, ${l}, ${x.toFixed(4)}, ${y.toFixed(4)}, ${a})`;
	}
	toSLxy(){
		var { h, s, l, a } = this.toHsl();
		h *= Math.PI / 180;
		return { s, l, x: Math.cos(h), y: Math.sin(h), a, isMin: true };
	}
	toSLxyString(){
		var { s, l, x, y, a } = this.toSLxy();
		return `sl-xya(${100 * s}%, ${l}, ${x.toFixed(4)}, ${y.toFixed(4)}, ${a})`;
	}
	toSVXY(){
		var { h, s, v, a } = this.toHsv();
		h *= Math.PI / 180;
		return { s, v, x: v * Math.cos(h), y: v * Math.sin(h), a, isMin: false };
	}
	toSVXYString(){
		var { s, v, x, y, a } = this.toSVXY();
		return `svxya(${100 * s}%, ${v}, ${x.toFixed(4)}, ${y.toFixed(4)}, ${a})`;
	}
	toSVxy(){
		var { h, s, v, a } = this.toHsv();
		h *= Math.PI / 180;
		return { s, v, x: Math.cos(h), y: Math.sin(h), a, isMin: true };
	}
	toSVxyString(){
		var { s, v, x, y, a } = this.toSVxy();
		return `sv-xya(${100 * s}%, ${v}, ${x.toFixed(4)}, ${y.toFixed(4)}, ${a})`;
	}
	toString(type = '', b = null){
		switch(type.toLowerCase()){
			case 'sxy':
			case 'sxya':
				return this.toSXYString(b);
			case 'slxy':
			case 'slxya':
				return this.toSLXYString(b);
			case 'svxy':
			case 'svxya':
				return this.toSVXYString(b);
			case 'sl-xy':
			case 'sl-xya':
				return this.toSLxyString(b);
			case 'sv-xy':
			case 'sv-xya':
				return this.toSVxyString(b);
			default: return super.toString(type, b);
		}
	}
	static fromRatio(o){
		if(typeof o === 'object'){
			var k = Object.keys(o);
			var toTest = ['s', 'x', 'y'];
			
			// SXY, SLXY, SLxy, SVXY, SVxy
			if(toTest.every(t => k.includes(t))){
				const { s, x, y, a } = o,
					r = Math.hypot(x, y),
					h = Math.atan2(y, x);
				
				// SLXY, SLxy
				if(k.includes('l')){
					let	l = o.isMin ? r : o.l;
					return this.fromRatio({ h, s, l, a });
				}
				// SVXY, SVxy
				else if(k.includes('v')){
					let	v = o.isMin ? r : o.v;
					return this.fromRatio({ h, s, v, a });
				}
				// SXY
				else if(o.isHsv)
					return this.fromRatio({ h, s, v: r, a });
				else return this.fromRatio({ h, s, l: r, a });
			}
		}
		return super.fromRatio(o);
	}
}

module.exports = tinycolor_plus;