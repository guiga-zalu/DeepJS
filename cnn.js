const { Deep, DeepPart } = require('./deep');
const { Matrix, Vector, IMGData } = require('./math/index');
//var k = true, l = true, m = true;

class Tensor{
	static Filters(length, size){
		return Array.from({ length }).map(() => new Filter(null, size));
	}
	static Zero(m, n, length){
		return Array.from({ length }).map(() => Matrix.Zero(n, m));
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
		//let { data, width, height } = img;
		//x--; y--;
		return Matrix.Zero(w, h).map(
			(_, i, j) => img.px(y + j - 1, x + i - 1)
		);
	}
}

class Filter{
	/**
	 * Cria uma instância CFilter.
	 * @param { Matrix | any } [matrix = null] Matriz de filtro
	 * @param { number } [size = 3] Tamanho da matriz, se não fornecida nehuma
	 */
	constructor(matrix = null, size = 3){
		this.matrix = matrix ? (
			matrix instanceof Matrix ? matrix : new Matrix(matrix)
		) : Matrix.Random(size, size).x(size ** -2);
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
		//y--; x--;
		let r = this.matrix.map(
			(v, i, j) => v * img.px(x + i - 1, y + j - 1)
		);
		let ret = Matrix.sum(r);
		//if(m) console.log(this.matrix, '\n', r, '\n', ret, m = !m);
		return ret;
	}
}
class Layer extends DeepPart{
	/**
	 * Cria uma instância de Layer.
	 * @param { number | 0 } [nFilters = 8] Número de filtros
	 * @memberof Layer
	 */
	constructor(nFilters = 8, fSize = 3){
		super();
		this.nFilters = nFilters | 0;
		this.fSize = fSize | 0;
		this.filters = Tensor.Filters(this.nFilters, this.fSize);
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
			//output = [],
			filter, sums,
			convolve = (img, x, y) => f => f.convolve(img, x, y);
		//console.log(`\t[Conv] Img length: ${img.data.length}`);
		for(var [x, y] of this.iterateRegions(img)){
			//if(l) console.log(x, y, i);
			sums = filters.map(convolve(img, x, y));
			//if(l) console.log(sums, l = !l);
			for(filter = n - 1; filter >= 0; filter--){
				//if(!output[filter]) output[filter] = [];
				//output[filter][i] = sums[filter];
				output.pxSet(sums[filter], x, y, filter);
			}
		}
		//width -= 2; height -= 2;
		//output = output.map(data => ({ width, height, data }));
		//output.width = width;
		//output.height = height;
		//if(k) console.log(output[0], output.width, output.height, k = !k);
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
		
		//console.log('[ ', grad_L_out.length, ' x ', grad_L_out[0].dimensions, ' ]');
		//console.log('[ ', grad_L_filters.length, ' x ', grad_L_filters[0].dimensions, ' ]');
		for(var [x, y] of this.iterateRegions(img)){
			for(f = 0; f < n; f++){
				let tmp1 = grad_L_out[f].e(x + 1, y + 1),//.col(i + 1),
					tmp2 = CNN.getRegion(img, x, y, fSize, fSize);
				mult = tmp2.x(tmp1);
				//if(k) console.log(tmp1, '\n', tmp2.dimensions, '\n', mult, '\n', k = !k);
				grad_L_filters[f] = grad_L_filters[f].add(mult);
			}
		}
		filters.forEach((filter, f) => {
			filter.matrix = filter.matrix.sub(grad_L_filters[f].x(lr));
		});
		return null;
	}
}

class Pool extends DeepPart{
	/**
	 * Cria uma instância de Pool.
	 * @param { number } [size = 2] Taxa de redução
	 */
	constructor(size = 2, fn = Pool.FN_MAX){
		super();
		this.size = size | 0;
		switch(fn){
			case Pool.FN_MIN:
				this.pool_fn = x => Math.min(...x); break;
			case Pool.FN_MAX:
			default:
				this.pool_fn = x => Math.max(...x); break;
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
}
const PoolMax = Pool;
Pool.FN_MAX = Symbol('fn-max');
Pool.FN_MIN = Symbol('fn-min');

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
	 * @param { number | 0 } nodes
	 * @memberof Softmax
	 */
	constructor(inputLength, nodes){
		super();
		this.inputLength = inputLength | 0;
		this.nodes = nodes | 0;
		this.weights = Matrix.Random(nodes, inputLength).x(inputLength ** -1);
		this.biases = Vector.Zero(nodes);
		//console.log(`\t[Softmax] Weight Dimensions: ${nodes}x${inputLength}`);
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
}

CNN.Filter = Filter;
CNN.Layer = Layer;
CNN.PoolMax = PoolMax;
CNN.Softmax = Softmax;

module.exports = {
	CNN, Filter, Layer, PoolMax, Softmax
};