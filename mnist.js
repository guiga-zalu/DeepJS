const	fs = require('fs'),
		{ CNN } = require('./index'),
		{ mean: { hiperbolic }, Vector, IMGData } = require('./math/index'),
		{ save } = require('./libs'),
		mnist = require('mnist'),
		BATCH_SIZE = 1e2,
		TIMES_TO_TRAIN = 3,
		LEN_TEST = 1e3,
		LEN_TRAIN = 1e3;//+10;

//const img = mnist[random() * 9 | 0].get(random() * 1e3 | 0);
console.time('Separando MNIST');
const { training, test } = mnist.set(
	BATCH_SIZE * (LEN_TRAIN / BATCH_SIZE | 0),
	LEN_TEST
);
console.timeEnd('Separando MNIST');

console.time('Criando Rede Neural Convolutiva');
var	conv = new CNN.Layer(8),
	pool = new CNN.Pool(2),
	softmax = new CNN.Softmax(13 * 13 * 8, 10);

//var output;

/*
console.log(`Layer: [Convolution]. Start.`);
output = conv.forward({ data: img, width: 28, height: 28 });
console.log(`Layer: [Convolution].\tOutputs: ${output.length}.\tSquare Size: ${output[0].data.length ** (2 ** -1)}².`);

console.log(`Layer: [Pooling]. Start.`);
output = pool.forward(output);
console.log(`Layer: [Pooling].\tOutputs: ${output.length}.\tSquare Size: ${output[0].data.length ** (2 ** -1)}².`);
*/
function loggrad(grad){
	if(!grad) return [grad];
	else if(Array.isArray(grad))
		return ['[', grad.length, 'x', ...loggrad(grad[0]), ']'];
	else if(grad.dimensions !== undefined) return [grad.dimensions];
	else if(grad.space !== undefined) return [grad.dims];
	else if(grad.data !== undefined) return loggrad(grad.data);
	else if(grad.length !== undefined) return [grad.length];
	return [1];
}
function log_obj(o){
	console.log(...loggrad(o));
}
log_obj(null);
function forward(data, label){
	//console.log('IN:', data.length ** 0.5);
	//console.log('Conv (-->)');
	var	out1 = conv.forward(new IMGData(data.map(v => v - 0.5), 28, 28));
	//log_obj(out1);
	//console.log('Pool (-->)');
	var out2 = pool.forward(out1);
	//log_obj(out2);
	//console.log('SoftMax (-->)');
	var out = softmax.forward(out2);
	//log_obj(out);

	var	max = Vector.max(out),
		loss = -Math.log(out.e(label + 1)),
		acc = +(out.indexOf(max) - 1 === label);
	return { out, loss, acc };
}
function backprop(out, label, lr = 5e-2){
	var grad = out.map((v, i) => i - 1 === label ? -1/v : 0);
	//log_obj(grad);
	//console.log('SoftMax (<--)');
	grad = softmax.backprop(grad, lr, label);
	//log_obj(grad);
	//console.log('Pool (<--)');
	grad = pool.backprop(grad, lr);
	//log_obj(grad);
	//console.log('Conv (<--)');
	grad = conv.backprop(grad, lr);
	//log_obj(grad);
}

function train(img, label, lr = 5e-2){
	//console.log('=>>');
	var { out, loss, acc } = forward(img, label);
	//console.log('<<=');
	backprop(out, label, lr);
	//console.log('...');
	return { loss, acc };
}
console.timeEnd('Criando Rede Neural Convolutiva');

function log_stats(i, totalLoss, corrects){
	console.log(
		'[Rodada %d] Desvio Médio: %s%% | Acurácia: %d%%',
		i,
		(totalLoss / BATCH_SIZE).toFixed(3),
		1e2 * corrects / BATCH_SIZE
	);
}

console.time('Treinando');
var base_lr = 1e-2, lr = base_lr;

const DECAY = base_lr / BATCH_SIZE;

for(var j = 1; j <= TIMES_TO_TRAIN; j++){
	console.log(`\n--- Treinando pela ${j}ª vez ---`);
	var	totalLoss = 0, corrects = 0;

	for(const i in training){
		const { input: img, output: label } = training[i];
		let { loss, acc } = train(img, label.indexOf(1), lr);
		totalLoss += loss;
		corrects += acc;
		if(i % BATCH_SIZE === 0){
			lr /= 1 + hiperbolic([ DECAY, (i + 1) / BATCH_SIZE ]);
			log_stats(i, totalLoss, corrects);
			totalLoss = 0;
			corrects = 0;
		}
	}
}
console.timeEnd('Treinando');

// Test the CNN
console.log('\n--- Testando a RNC ---');
totalLoss = 0;
corrects = 0;
console.time('Testando');
for(const i in test){
	const { input: img, output: label } = training[i];
	let { loss, acc } = train(img, label.indexOf(1));
	totalLoss += loss;
	corrects += acc;
}
console.timeEnd('Testando');

console.log('Desvio do Teste: %s', (totalLoss / LEN_TEST).toFixed(3));
console.log('Acurácia do Teste: %d%%', 1e2 * corrects / LEN_TEST);

var data = {
	conv: conv.save(), pool: pool.save(), softmax: softmax.save()
};

fs.writeFileSync('./treinado.json', save(data));