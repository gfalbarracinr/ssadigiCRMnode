class ErrorCollector {
    constructor() {
        this.collector = {}
        this.SPECIAL_ERROR_LINE = 0;
        this.currentLine = 0;
        this.collector[this.SPECIAL_ERROR_LINE] = '';
    }

    add(line, error) {
        if (line === this.SPECIAL_ERROR_LINE) {
            this.collector[line] += `${error}\n`;
        }else if(!this.collector.hasOwnProperty(line)) {
            this.collector[line] = error;
        } 
    }

    static get SPECIAL_ERROR_LINE () {
        return this.SPECIAL_ERROR_LINE; 
    }
    toStringArray() {
      let stringMessages = [];
      const lines = Object.keys(this.collector);
      lines.map((line) => {
          stringMessages.push(`Error en la fila ${line}: ${this.collector[line]}`);
      });
      return stringMessages;
    }
}
module.exports = ErrorCollector;