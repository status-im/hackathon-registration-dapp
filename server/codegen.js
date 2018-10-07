const crypto = require("crypto");
const MerkleTree = require('merkle-tree-solidity');
const { sha3 } = require('ethereumjs-util');
const fs = require('fs');

const numCodes = 500;
const codeLength = 5;

const codes = [];
const elements = [];

for(i = 0; i < numCodes; i++){
    const code = crypto.randomBytes(codeLength).toString('hex');

    codes.push(code);
    elements.push(sha3(new Buffer(code, 'hex')));
}

const merkleTree = new MerkleTree.default(elements);

const stream1 = fs.createWriteStream("codes.txt");
stream1.once('open', function(fd) {
    codes.map(el => {
        stream1.write(el + "\n");
    })
    stream1.end();
});

const stream2 = fs.createWriteStream("./server/merkle.js");
stream2.once('open', function(fd) {
    stream2.write("module.exports = {\n");
    stream2.write("\tmerkleRoot: '0x" + merkleTree.getRoot().toString('hex') + "',\n");
    stream2.write("\telements: [\n");
    stream2.write(elements
                    .map(el => "\t\t'0x" + el.toString('hex') + "'")
                    .join(",\n"))
    stream2.write("\n\t]\n};\n\n");
    stream2.write("module.exports.elements = module.exports.elements.map(x => Buffer.from(x.substring(2), 'hex'));\n\n");
    stream2.end();
});

console.log("Merkle Root: 0x%s", merkleTree.getRoot().toString('hex'));
console.log("./codes.txt generated");
console.log("./server/merkle.js generated");
