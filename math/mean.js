function aritimetic(x){
	return x.reduce((s, a) => s + a, 0) / x.length;
}
function geometric(x){
	return x.reduce((s, a) => s * a, 1) ** (1 / x.length);
}
function hiperbolic(x){
	return x.length / x.reduce((s, a) => s + 1 / a, 0);
}
function quadratic(x){
	return Math.sqrt(x.reduce((s, a) => s + a ** 2, 0) / x.length);
}
/**
 * Builds a composite mean
 *
 * @param { (x: number) => number } f
 * @param { (x: number) => number } f_inv
 * @returns { (x: number[]) => number }
 */
function build(f, f_inv){
	return x => f_inv(x.reduce((s, a) => s + f(a), 0) / x.length);
}
/*
 * build(x => x*(x - 1), x => (1 + Math.sqrt(1 + 2 * x))/2)
 * build(x => x*(x - 1), x => (1 - Math.sqrt(1 + 2 * x))/2)
 * build(x => (1 - Math.sqrt(1 + 2 * x))/2, x => x*(x - 1))
 * build(x => (1 + Math.sqrt(1 + 2 * x))/2, x => x*(x - 1))
 * 
 * build(x => x ** -n, x => x ** (- 1 / n))
 */

module.exports = { aritimetic, geometric, hiperbolic, quadratic, build };