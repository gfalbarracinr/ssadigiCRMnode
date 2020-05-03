class ErrorCollector {
    constructor() {
        this.collector = {}
        this.SPECIAL_ERROR_LINE = 0;
        this.ERROR_CODE = 1;
        this.WARNING_CODE = 0;
        this.currentLine = 0;
        this.collector[this.SPECIAL_ERROR_LINE] = {
            message: '',
            code: 1
        };
    }

    add(line, error, code) {
        
        if (line === this.SPECIAL_ERROR_LINE) {
            this.collector[line][message] += `${error}\n`;
        }else if(!this.collector.hasOwnProperty(line)) {
            this.collector[line] = {
                message: error,
                code: code
            }
        } else {

            this.collector[line].message += error;
            
            if (code > this.collector[line][code]) {
                this.collector[line][code] = code;
            }
        }
    }

    static  SPECIAL_ERROR_LINE () {
        return this.SPECIAL_ERROR_LINE; 
    }

    static  ERROR_CODE () {
        
        return 1; 
    }

    static  WARNING_CODE () {
        return 0; 
    }

    toStringArray() {
      return this.collector;
    }
}
module.exports = ErrorCollector;