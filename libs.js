const { IMGData, Matrix, Vector } = require('./math/index');

function iguale(obj, props, original){
	for(var prop of props) obj[prop] = obj[original];
}

function igualeAll(obj, cases){
	for(var [props, original] of cases)
		iguale(obj, props, original);
}

function $save(_key, value){
	if(typeof value !== 'object')
		return value;
	else if('save' in value && typeof value.save === 'function')
		return $save(value.save());
	else if(value instanceof IMGData)
		return { type: 'math/imgdata', data: value.data, dims: value.dims };
	else if(value instanceof Matrix)
		return { type: 'math/matrix', data: value.elements };
	else if(value instanceof Vector)
		return { type: 'math/vector', data: value.elements };
	else
		return value;
}
function load(obj){
	if('type' in obj){
		switch(obj.type){
			case 'math/imgdata':
				obj = new IMGData(obj.data, obj.dims); break;
			case 'math/matrix':
				obj = new Matrix(obj.data); break;
			case 'math/vector':
				obj = new Vector(obj.data); break;
			default: break;
		}
	}
	return obj;
}

/**
 * Saves data
 *
 * @param { any } data
 * @returns { string } Saved data
 */
function save(data){
	return JSON.stringify(data, $save);
}

module.exports = { iguale, igualeAll, save, load };