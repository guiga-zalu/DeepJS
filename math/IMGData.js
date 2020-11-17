/**
 * IMGData is a dataset handler.
 * @class IMGData
 */
class IMGData{
	/**
	 * Creates an instance of IMGData.
	 * @param { any[] | null } data Data plain array
	 * @param { number[] } dims Data dimensions
	 * @memberof IMGData
	 */
	constructor(data, ...dims){
		if(data instanceof this.constructor){
			dims = data.dims;
			data = data.data.slice();
		}
		this.dims = Array.from(dims, v => v | 0);
		if(data){
			if(Array.isArray(data) || Buffer.isView(data))
				this.data = data;
			else this.data = Array.from(data);
		}else{
			var d = this.data = [];
			d.length = this.computedDims[this.space];
			d.fill(0);
		}
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
	/**
	 * Computes dataset dimensions
	 *
	 * @memberof IMGData
	 */
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
	/**
	 * Returns the dataset value at a given coord
	 *
	 * @param { number[] } coords
	 * @returns { any } Dataset value at the given coord
	 * @memberof IMGData
	 */
	px(...coords){
		return this.data[this.index(coords)];
	}
	/**
	 * Sets a value in the dataset at a given coord
	 *
	 * @param { any } val Value to set
	 * @param { number[] } coords Coords to set value in
	 * @returns { any } Result of assign operation
	 * @memberof IMGData
	 */
	pxSet(val, ...coords){
		return (this.data[this.index(coords)] = val);
	}
	/**
	 * Converts a coords array into a index number into the dataset
	 *
	 * @param { number[] } coords Coords array
	 * @returns { number } Index in the dataset
	 * @memberof IMGData
	 */
	index(coords){
		const { computedDims: comp, dims, space } = this;
		coords = coords.map((v, i) => +v % dims[i]);
		
		var index = 0;
		for(let i = space - 1; i >= 0; i--)
			index += coords[i] * comp[i];
		return index;
	}
	/**
	 * Converts a index in the dataset into a coords array
	 *
	 * @param { number } [index = 0] Index in the dataset
	 * @returns { number[] } Coords array
	 * @memberof IMGData
	 */
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
		var index = this.index(coords) % this.length;
		return this.data.slice(index, index + length);
	}
	/**
	 * Alter some region of the dataset
	 *
	 * @param { (v: any, i: number, data: any[], thisArg: this) => any } fn Function
	 * @param { number | number[] } f Start of the region
	 * @param { number | number[] } t End of the region
	 * @param { boolean } [passCoords = false] Wheter to pass coords
	 * @returns
	 * @memberof IMGData
	 */
	alterRegion(fn, f, t, passCoords = false){
		if(typeof fn !== 'function') throw new TypeError('fn must be a function!');
		if(arguments.length === 2){
			passCoords = f;
			f = t = null;
		}
		var [from, to] = this.parseRange(f, t);
		const { data } = this;
		if(passCoords) for(let i = from; i < to; i++)
			data[i] = fn.call(this, data[i], i, this.coords(i), data);
		else for(let i = from; i < to; i++)
			data[i] = fn.call(this, data[i], i, data);
		return this;
	}
	/**
	 * Scales the dataset by a given factor, at a given region
	 * * Only to number datasets
	 * @param { number } x Factor to scale
	 * @param { number | number[] } f Start of the range
	 * @param { number | number[] } t End of the range
	 * @returns
	 * @memberof IMGData
	 */
	scale(x, f, t){
		var [from, to] = this.parseRange(f, t);
		const { data } = this;
		for(var i = from; i < to; i++) data[i] = data[i] * x;
		return this;
	}
	/**
	 * Maps the dataset by some function into another IMGData
	 *
	 * @param { (v: any, i: number | number[], data: any[], thisArg: this) => any } fn
	 * @param { boolean } [passCoords = false] Wether to passe coords
	 * @returns { IMGData } New image.
	 * @memberof IMGData
	 */
	map(fn, passCoords = false){
		const img = new IMGData(this),
			{ data } = img;
		if(passCoords) for(let i in data)
			data[i] = fn.call(this, data[i], i, this.coords(i), data);
		else for(let i in data)
			data[i] = fn.call(this, data[i], i, data);
		return img;
	}
	sum(fn = IMGData.identity){
		const { data } = this;
		var ret = 0;
		for(var i in data) ret += fn(data[i]);
		return ret;
	}
	/**
	 * Parse a number span to some index into the dataset
	 *
	 * @param { number | number[] } [from = 0] Start of the span
	 * @param { number | number[] } [to = this.length] End of the span
	 * @returns { number[] } Range
	 * @memberof IMGData
	 */
	parseRange(from = 0, to = this.length){
		const { length } = this;
		if(Array.isArray(from))	from = this.index(from);
		if(Array.isArray(to))	to = this.index(to);
		if(typeof from !== 'number')return this.parseRange(0, to);
		if(typeof to !== 'number')	return this.parseRange(from);
		if(from < to)
			return this.parseRange(to, from);
		if(from < 0 || from > length)
			return this.parseRange((length + from) % length, to);
		if(to < 0 || to > length)
			return this.parseRange(from, (length + to) % length);
		return [from, to];
	}
}
IMGData.identity = x => x;
IMGData.DIMS = Symbol("DIMS");

module.exports = IMGData;