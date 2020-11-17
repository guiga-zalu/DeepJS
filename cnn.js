const { Deep, DeepPart } = require('./deep');
const { Matrix, Vector, IMGData, randomer } = require('./math/index');

class Tensor{
	static Zero(m, n, length){
		return Array.from({ length }, () => Matrix.Zero(n, m));
	}
}

class CNN extends Deep{
	/**
	 *
	 *
	 * @static
	 * @param { IMGData } img
	 * @param { number | 0 } x
	 * @param { number | 0 } y
	 * @param { number | 0 } [w = 3]
	 * @param { number | 0 } [h = 3]
	 * @returns { Matrix }
	 * @memberof CNN
	 */
	static getRegion(img, x, y, w = 3, h = 3){
		return Matrix.Zero(w, h).map(
			(_, i, j) => img.px(y + j - 1, x + i - 1)
		);
	}
}

class Filter{
	/**
	 * Cria uma instância Filter.
	 * @param { IMGData | number[] | null } [map = null] Matriz de filtro
	 * @param { number } [size = 3] Tamanho da matriz, se não fornecida nehuma
	 */
	constructor(map = null, size = 3){
		if(map) this.map = (
			map instanceof IMGData && map.width === size && map.height === size
		) ? map : new IMGData(map, size, size);
		else{
			this.map = new IMGData(null, size, size);
			const { data } = this.map,
				sm2 = size ** -2,
				rand = randomer(-sm2, sm2);
			for(var i in data) data[i] = rand();
		}
	}
	/**
	 * Convoluciona um bloco de imagem
	 * 
	 * @param { IMGData } { data, width, height } Imagem
	 * @param { number } [x = 0] X
	 * @param { number } [y = 0] Y
	 * @returns { Matrix }
	 */
	convolve(img, x = 0, y = 0){
		let r = this.map.mapC((v, c) => v * img.px(c[0] + x, c[1] + y));
		return r.sum();
	}
	/**
	 * Saves a Filter data
	 *
	 * @returns { IMGData } The filter's map
	 * @memberof Filter
	 */
	save(){ return this.map; }
	/**
	 * Loads a Filter data
	 *
	 * @static
	 * @param { IMGData } data The data
	 * @returns { Filter } The loaded Filter
	 * @memberof Filter
	 */
	static load(data){
		return new Filter(data, data.width);
	}
}
class Layer extends DeepPart{
	/**
	 * Cria uma instância de Layer.
	 * @param { number | 0 } [nFilters = 8] Número de Filtros
	 * @param { number | 0 } [fSize = 3] Tamanho dos Filtros
	 * @param { Filter[] } [filters = null] Filtros
	 * @memberof Layer
	 */
	constructor(nFilters = 8, fSize = 3, filters = null){
		super();
		this.nFilters = nFilters | 0;
		this.fSize = fSize | 0;
		if(filters){
			this.filters = filters.filter(f => f instanceof Filter);
			this.nFilters = this.filters.length;
		}else{
			this.filters = Array.from(
				{ length: this.nSize },
				() => new Filter(null, this.fSize)
			);
		}
	}
	*iterateRegions({ width, height }){
		var i, j;
		width -= 2; height -= 2;
		for(i = 0; i < height; i++){
			for(j = 0; j < width; j++) yield [j, i, width * i + j];
		}
	}
	/**
	 * Avanço da camada
	 *
	 * @param { IMGData } img Imagem
	 * @returns { IMGData }
	 */
	forward(img){
		this.cache_input = img;
		var	{ filters, nFilters: n } = this,
			output = new IMGData(null, img.width - 2, img.height - 2, n),
			filter, sums,
			convolve = (img, x, y) => f => f.convolve(img, x, y);
		for(var [x, y] of this.iterateRegions(img)){
			sums = filters.map(convolve(img, x, y));
			for(filter = n - 1; filter >= 0; filter--)
				output.pxSet(sums[filter], x, y, filter);
		}
		return output;
	}
	/**
	 * Retorno da camada
	 *
	 * @param { IMGData } grad_L_out
	 * @param { number } lr
	 * @returns
	 */
	backprop(grad_L_out, lr){
		var	{ nFilters: n, cache_input: img, fSize, filters } = this,
			grad_L_filters = Tensor.Zero(fSize, fSize, n),
			f, mult;
		for(var [x, y] of this.iterateRegions(img)){
			for(f = 0; f < n; f++){
				let tmp1 = grad_L_out[f].e(x + 1, y + 1),
					tmp2 = CNN.getRegion(img, x, y, fSize, fSize);
				mult = tmp2.x(tmp1);
				grad_L_filters[f] = grad_L_filters[f].add(mult);
			}
		}
		filters.forEach((filter, f) => {
			var grad = grad_L_filters[f].elements;
			filter.map.alterRegion((v, _i, c) => v - lr * grad[c[0]][c[1]], true);
		});
		return null;
	}
	/**
	 * Saves a Layer Filters
	 *
	 * @returns { IMGData[] } The Filters data
	 * @memberof Layer
	 */
	save(){
		return this.filters.map(f => f.save());
	}
	/**
	 * Loads a Layer's Filters
	 *
	 * @static
	 * @param { IMGData[] } data The Filters data
	 * @returns { Layer } The loaded Layer
	 * @memberof Layer
	 */
	static load(data){
		return new Layer(data.length, data[0].width, data.map(d => new Filter(d, d.width)));
	}
}

class Pool extends DeepPart{
	/**
	 * Cria uma instância de Pool.
	 * @param { number } [size = 2] Taxa de redução
	 */
	constructor(size = 2, fn = 'max'){
		super();
		this.size = size | 0;
		this.pool_type = fn;
		if(fn in Pool.FN) this.pool_fn = Pool.FN[fn];
		else{
			this.pool_fn = Pool.FN.max;
			this.pool_type = 'max';
		}
	}
	pool(img, ...coords){
		var	{ size } = this,
			pos = coords.slice(),
			arr = [];
		for(var i = 0; i < size; i++){
			arr = arr.concat(img.slice(pos, size));
			pos[1]++;
		}
		//arr = arr.concat(data.slice(start, start + size));
		return this.pool_fn(arr);
	}
	*iterateRegions({ width, height }){
		var i, j, { size } = this;
		width -= width % size;
		height -= height % size;
		for(i = 0; i < height; i += size){
			for(j = 0; j < width; j += size) yield [j, i, (width >> 1) * i + j];
		}
	}
	/**
	 * Avanço da camada PoolMax
	 * 
	 * @param {*} img
	 * @returns { IMGData }
	 * @memberof Pool
	 */
	forward(img){
		//console.log(`\t[Pool] Input Length: ${img.length}`);
		this.cache_input = img;
		var	{ size } = this, { width, height, channels } = img,
			//output = [],
			output = new IMGData(null, width / size | 0, height / size | 0, channels),
			//maxes,
			ch, pool;//,
			//pool = (x, y) => img => this.pool(img, x, y);
		//width -= width % size; height -= height % size;
		//width /= size; height /= size;
		//console.log(`\t\t(forward)\tDimensions: ${width}x${height}`)
		for(var [x, y] of this.iterateRegions(img)){
			//maxes = img.map(pool(x, y));
			//for(max = img.length - 1; max >= 0; max--){
			//	if(!output[max]) output[max] = [];
			//	output[max][i >> 1] = maxes[max];
			//}
			for(ch = channels - 1; ch >= 0; ch--){
				pool = this.pool(img, x, y, ch);
				output.pxSet(pool, x, y, ch);
			}
		}
		//output = output.map(data => ({ width, height, data }));
		//output.width = width;
		//output.height = height;
		return output;
	}
	/**
	 * Retorno da camada PoolMax
	 *
	 * @param { Vector } grad_L_out Gradiente
	 * @returns { IMGData } Gradiente
	 * @memberof Pool
	 */
	backprop(grad_L_out){
		var	{ cache_input: img, size } = this,
			{ width, height } = img,
			grad_L_input = Tensor.Zero(width, height, 8),
			max, i1, x1, y1, f,
			pool = (x, y) => img => this.pool(img, x, y);
		
		// Para cada região
		for(var [x, y] in this.iterateRegions(img)){
			max = img.map(pool(x, y));
			// Para cada filtro
			for(f = img.length - 1; f >= 0; f--){
				var { data } = img[f],
					m = max[f],
					g1 = grad_L_input[f],
					g2 = grad_L_out.elements[f];
				// Para cada (x_1, y_1) entre (x, y) e (x + size, y + size)
				for(y1 = y; y1 < y + size; y1++){
					for(x1 = x; x1 < x + size; x1++){
						i1 = y1 * width + x1;
						if(data[i1] === m)
							g1.elements[y1][x1] = g2[(width >> 1) * y + x >> 1];
					}
				}
			}
		}
		return grad_L_input;
	}
	save(){
		return { size: this.size,  };
	}
	static load(){}
}
Pool.FN = {
	max: x => Math.max(...x),
	min: x => Math.min(...x)
};

/**
 * Camada de classificação Softmax
 * 
 * @class Softmax
 * @extends { DeepPart }
 */
class Softmax extends DeepPart{
	/**
	 * Cria uma instância de Softmax.
	 * @param { number | 0 } inputLength
	 * @param { number | 0 } outputLength
	 * @memberof Softmax
	 */
	/**
	 * Cria uma instância de Softmax.
	 * @param { Matrix } weights
	 * @param { Vector } biases
	 * @memberof Softmax
	 */
	constructor(inputLength, outputLength){
		super();
		if(typeof inputLength === 'object' && typeof outputLength === 'object'){
			this.weights = inputLength;
			this.biases = outputLength;
			this.inputLength = this.weights.cols;
			this.nodes = this.biases.dimensions;
		}else{
			this.inputLength = inputLength | 0;
			this.nodes = outputLength | 0;
			this.weights = Matrix.Random(outputLength, inputLength).x(inputLength ** -1);
			this.biases = Vector.Zero(outputLength);
			//console.log(`\t[Softmax] Weight Dimensions: ${nodes}x${inputLength}`);
		}
	}
	/**
	 * Avanço da camada Softmax
	 * 
	 * @param { IMGData } img
	 * @returns { Vector } Probabilidades por classe
	 * @memberof Softmax
	 */
	forward(img){
		img = new Vector(img.data);
		var	{ weights, biases } = this;
		//let [ rows, cols ] = weights.dimensions;
		//console.log(`\t[Softmax] Input Length: ${input.dimensions}`);
		var	exp = weights.x(img).add(biases).map(v => Math.exp(v)),
			S = Vector.sum(exp);
		
		this.cache_input = img;
		this.cache_exp = exp;
		this.cache_sum = S;
		//console.log('weights:', weights.dimensions);
		return exp.x(S ** -1);
	}
	/**
	 * Retorno da camada Softmax
	 * 
	 * @param {*} grad_L_out
	 * @param { number } lr Taxa de aprendizagem
	 * @param { number | 0 } label Resultado correto
	 * @returns { Vector } Gradiente
	 * @memberof Softmax
	 */
	backprop(grad_L_out, lr, label){
		var	i = label + 1,//grad_L_out.indexOf(g),
			g = grad_L_out.e(i),
			{
				cache_exp: exp,
				cache_sum: S,
				cache_input: grad_t_w
			} = this,
			exp_i = exp.e(i);
		
		var grad_out_t = exp.x(- exp_i / (S ** 2));
		
		grad_out_t.elements[i - 1] = exp_i * (S - exp_i) / (S ** 2);
		
		var	grad_t_inputs = this.weights.transpose(),
			//grad_t_b = 1,
			grad_L_t = grad_out_t.x(g).toMatrix('col'),
			grad_L_w = grad_L_t.x(
				grad_t_w.toMatrix('row')//.transpose()
			),
			grad_L_b = grad_L_t,//.x(grad_t_b)
			grad_L_inputs = grad_t_inputs.x(grad_L_t);
		
		//console.log(grad_L_w);
		this.weights =	this.weights.sub(grad_L_w.x(lr));
		this.biases =	this.biases.sub(grad_L_b.x(lr));
		//console.log(this.weights);
		return grad_L_inputs;
		/*
		 * weights -= lr * grad_L_w
		 ? grad_L_w = grad_t_w @ grad_L_t
		 * :grad_t_w:
		 * grad_L_t = g * grad_out_t
		 * 
		 ? grad_L_w = :grad_t_w: @ (g * grad_out_t)
		 * 
		 * #weights = #grad_L_w
		 ? = #(:grad_t_w: @ (g * grad_out_t))
		 ? = #(:grad_t_w: @ grad_out_t)
		 * = 10 x 1352
		 * #grad_out_t = #grad_L_t = 10
		 * #grad_t_w = 1352
		 */
	}
	save(){
		const { weights, biases } = this;
		return { weights, biases };
	}
	static load(data){
		return new Softmax(data.weights, data.biases);
	}
}

CNN.Filter = Filter;
CNN.Layer = Layer;
CNN.PoolMax = Pool;
CNN.Softmax = Softmax;

module.exports = {
	CNN, Filter, Layer, Pool, Softmax
};