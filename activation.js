class Activation{
	constructor(fn, dfn, span_x, span_y){
		this.fn = fn || (x => x);
		this.dfn = dfn || (() => 1);
		this.span_x = Activation.parseSpan(span_x) || Activation.DEF_SPAN_X;
		this.span_x = span_y || Activation.getSpanY(fn, this.span_x);
	}
	static parseSpan(span){
		if(!span || !Array.isArray(span)) return false;
		if(span.length < 2) return false;
		if(span.length > 2){
			var [max, min] = this.DEF_SPAN_X;
			for(var x of span){
				min = Math.min(x, min);
				max = Math.max(x, max);
			}
			return [min, max];
		}
		var [p0, pf] = span;
		return p0 === pf ? false : (p0 > pf ? [pf, p0] : span);
	}
	static getSpanY(fn, span_x){
		// Test only max, min and 1, -1, 0, -1/0, 1/0 if included
		const [min, max] = span_x;
		var ret = [fn(min), fn(max)];
		for(var test of this.TESTABLES){
			if(test > min && test < max) ret.push(fn(1));
		}
		return this.parseSpan(ret);
	}
}
Activation.DEF_SPAN_X = [-1/0, 1/0];
Activation.TESTABLES = [-1/0, -1, 0, 1, 1/0];
Activation.I = new Activation(x => x, () => 1);

module.exports = {
	Activation,
	sigmoid:	new Activation(x => 1 / (1 + Math.exp(-x)), x => x*(1 - x)),
	sigmoid2:	new Activation(x => 2 / (1 + Math.exp(-x)) - 1, x => 2*x*(1 - x)),
	tanh:	new Activation(Math.tanh, x => 1 - x**2),
	ReLU:	new Activation(x => Math.max(x, 0), x => x ? 1 : 0),
	LReLU:	new Activation((x, a = 0.1) => x >= 0 ? x : a*x, (x, a) => x >= 0 ? 1 : a),
	PReLU:	new Activation((x, a) => x > -a ? x : 0, x => x ? 1 : 0),
	Softplus:	new Activation(x => Math.log(1 + Math.exp(x)), x => 1 - Math.exp(-x))
};

// new Activation(x => x >= 0 ? x : Math.tanh(x), x => x >= 0 ? 1 : 1 - x**2);