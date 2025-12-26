const fs = require('fs');

const lang_arg = process.argv[2];

const path = './data/lang_' + lang_arg + '.json';

console.log('Sorting dictionary ' + path);

var dict = JSON.parse(fs.readFileSync(path, 'utf8'));

function sortObjectByKeys(obj) {
    return Object.keys(obj)
        .sort((a, b) => a.localeCompare(b))
        .reduce((sorted, key) => {
            sorted[key] = obj[key];
            return sorted;
        }, {});
}

dict = sortObjectByKeys(dict);

fs.writeFileSync(path, JSON.stringify(dict, null, 2));
console.log('Sorted dictionary ' + path);
