const { Deep, DeepPart } = require('./deep'),
	CNN = require('./cnn'),
	{ Matrix, Vector, IMGData } = require('./math/index');

class RNN extends Deep{}

class DNN extends Deep{
	constructor(size){
		this.size = size | 0 || 1;
	}
	toJson(){}
	fromJson(){}
}
DNN.deconvolutor = class deconvolutor extends DeepPart{
	constructor({w, size}){

	}
};
class GAN extends Deep{}
class VAE extends Deep{
	constructor(size, sizeEncoded){
		size = size | 0 || 1;
		sizeEncoded = sizeEncoded | 0 || 1;
		this.size = size;
		this.encoder = new DNN(size, sizeEncoded);
		this.decoder = new CNN.CNN(size, sizeEncoded);
	}
	toJson(){}
	fromJson(){}
	forward(){}
	backward(){}
}
class URE extends Deep{}

module.exports = { Deep, RNN, CNN, DNN, GAN, VAE, URE, Matrix, Vector, IMGData };