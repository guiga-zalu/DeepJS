const y = x => 10 + (x**2);
function exemplos(n, escala){
	n = n | 0 || 1e4;
	var dados;
	var x = Array.from({length: n}).map(() => escala*(Math.random() - 0.5));
	dados = x.map(v => [v, y(v)]);
	return dados;
}