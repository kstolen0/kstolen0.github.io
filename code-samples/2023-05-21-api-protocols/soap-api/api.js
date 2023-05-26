import Express from 'express';
import soap from 'soap';
import { readFileSync } from 'fs';

const xml = readFileSync('./gpt-wsdl.wsdl', 'utf-8');

const IncrementNumber = function (args, cb, soapHeader) {
    return cb({ outputNumber: args.inputNumber + 1 });
}

const myService = {
    MyService: {
        MyServicePort: {
            IncrementNumber,
        }
    }
}

const app = Express();

try {
    app.listen(8000, () => {
        console.log('service listening');
    
        soap.listen(app, '/api', myService, xml);
    });
} catch (err) {
    console.log(err);
}
