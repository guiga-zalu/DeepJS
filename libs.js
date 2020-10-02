function iguale(obj, props, original){
	for(var prop of props) obj[prop] = obj[original];
}
function igualeAll(obj, cases){
	for(var [props, original] of cases)
		iguale(obj, props, original);
}

module.exports = { iguale, igualeAll };