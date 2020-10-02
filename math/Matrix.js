const PreMatrix = require("./PreMatrix");
const Vector = require("./Vector");

class Matrix extends PreMatrix{
	row(i){
		var { elements: e } = this;
		if(i > e.length) return null;
		return new Vector(e[i - 1]);
	}
	col(j){
		var { elements: e } = this, { length: n } = e;
		if(n === 0) return null;
		if(j > e[0].length) return null;
		var col = [];
		for(var i = 0; i < n; i++) col.push(e[i][j - 1]);
		return new Vector(col);
	}
	get isSquare(){
		var cols = (this.elements.length === 0) ? 0 : this.elements[0].length;
		return (this.elements.length === cols);
	}
	diagonal(){
		var { elements: e } = this, { length: n } = e;
		if(!this.isSquare) return null;
		var els = [];
		for(var i = 0; i < n; i++) els.push(e[i][i]);
		return new Vector(els);
	}
	inspect(){
		var matrix_rows = [];
		var n = this.elements.length;
		if(n === 0) return '[]';
		for(var i = 0; i < n; i++)
			matrix_rows.push(new Vector(this.elements[i]).inspect());
		return matrix_rows.join('\n');
	}
}

module.exports = Matrix;