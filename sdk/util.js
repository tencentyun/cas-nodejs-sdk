'use strict';

var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var uuid = require('uuid/v4');
var crypto = require('crypto');
var os = require('os');
var ONE_MB = 1*1024*1024;

var getAuth = function (opt) {

    opt = opt || {};

    var SecretId = opt.SecretId;
    var SecretKey = opt.SecretKey;
    var method = (opt.method || 'GET').toLowerCase();
    var pathname = opt.pathname || '/';
    var queryParams = opt.params || '';
    var headers = opt.headers || '';

    var getObjectKeys = function (obj) {
        var list = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                list.push(key);
            }
        }
        return list.sort();
    };

    var obj2str = function (obj) {
        var i, key, val;
        var list = [];
        var keyList = Object.keys(obj);
        for (i = 0; i < keyList.length; i++) {
            key = keyList[i];
            val = obj[key] || '';
            key = key.toLowerCase();
            key = encodeURIComponent(key);
            list.push(key + '=' + encodeURIComponent(val));
        }
        return list.join('&');
    };

    // 签名有效起止时间
    var now = parseInt(new Date().getTime() / 1000) - 1;
    var expired = now; // now + ';' + (now + 60) + ''; // 签名过期时间为当前 + 3600s

    if (opt.expires === undefined) {
        expired += 3600;
    } else {
        expired += (opt.expires * 1) || 0;
    }

    // 要用到的 Authorization 参数列表
    var qSignAlgorithm = 'sha1';
    var qAk = SecretId;
    var qSignTime = now + ';' + expired;
    var qKeyTime = now + ';' + expired;
    var qHeaderList = getObjectKeys(headers).join(';').toLowerCase();
    var qUrlParamList = getObjectKeys(queryParams).join(';').toLowerCase();

    // 签名算法说明文档：https://www.qcloud.com/document/product/572/8740
    // 步骤一：计算 SignKey
    var signKey = crypto.createHmac('sha1', SecretKey).update(qKeyTime).digest('hex');//CryptoJS.HmacSHA1(qKeyTime, SecretKey).toString();

    // 新增修改，formatString 添加 encodeURIComponent

    //pathname = encodeURIComponent(pathname);

    // 步骤二：构成 FormatString
    var formatString = [method, pathname, obj2str(queryParams), obj2str(headers), ''].join('\n');

    formatString = new Buffer(formatString, 'utf8');

    // 步骤三：计算 StringToSign
    var sha1Algo = crypto.createHash('sha1');
    sha1Algo.update(formatString);
    var res = sha1Algo.digest('hex');
    var stringToSign = ['sha1', qSignTime, res, ''].join('\n');

    // 步骤四：计算 Signature
    var qSignature = crypto.createHmac('sha1', signKey).update(stringToSign).digest('hex');

    // 步骤五：构造 Authorization
    var authorization = [
        'q-sign-algorithm=' + qSignAlgorithm,
        'q-ak=' + qAk,
        'q-sign-time=' + qSignTime,
        'q-key-time=' + qKeyTime,
        'q-header-list=' + qHeaderList,
        'q-url-param-list=' + qUrlParamList,
        'q-signature=' + qSignature
    ].join('&');

    return authorization;

};

// 清除对象里值为的 undefined 或 null 的属性
var clearKey = function (obj) {
    var retObj = {};
    for (var key in obj) {
        if (obj[key] !== undefined && obj[key] !== null) {
            retObj[key] = obj[key];
        }
    }
    return retObj;
};

// 简单的属性复制方法
function extend(target, source) {
    for (var method in source) {
        if (!target[method]) {
            target[method] = source[method];
        }
    }
    return target;
}

var getFileContent = function(readStream, callback) {
    var data = '';

    readStream.on('data', function (chunk) {
        data += chunk;
    });

    readStream.on('error', function (err) {
        callback(err);
    });

    readStream.on('end', function () {
        callback(null, data);
    });
}

var getFileName = function(filePath) {
    var isWin = /^win/.test(process.platform);
    var sep = isWin ? '\\' : '/';

    var lastIndex = filePath.lastIndexOf(sep)
    var fileName = filePath.slice(lastIndex);

    return fileName;
}

var writeTmpFile = function(readStream, callback) {
    var fileName = getFileName(readStream.path);
    var distFolder = path.join(os.tmpdir(), uuid());
    var distPath = distFolder + fileName;

    mkdirp.sync(distFolder)

    var writeStream = fs.createWriteStream(distPath)

    readStream.pipe(writeStream)

    writeStream.on('finish', function() {
        callback(null, distFolder, writeStream.path)
    })
}

var getContentSHA256 = function(input, callback) {
    var hash = crypto.createHash('sha256')
    var readStream = input;

    if (input && (typeof input == 'string')) {
        readStream = fs.createReadStream(input);
    }

    readStream.on('data', function (chunk) {
        hash.update(chunk)
    });

    readStream.on('error', function (err) {
        callback(err);
    });

    readStream.on('end', function () {
        callback(null, hash.digest('hex'));
    });
}

var getSHA256TreeHash = function(input, callback) {

    getChunkSHA256Hashes(input, function(err, chunkSHA256Hashes) {
        var treeHash = computeSHA256TreeHash(chunkSHA256Hashes);
        callback(null, treeHash.toString('hex'));
    });
}

var getChunkSHA256Hashes = function(input, callback) {
    var preSize = 0;
    var chunkSHA256Hashes = [];
    var readStream = input;
    var SHA = crypto.createHash('sha256');
    var isLowerThanOne = true;

    if (input && (typeof input == 'string')) {
        readStream = fs.createReadStream(input);
    }

    readStream.on('data', function (chunk) {
        var size = chunk.byteLength;
        var reserveSize = chunk.byteLength;
        var start = 0;

        while(size >= ONE_MB - preSize) {
            isLowerThanOne = false;
            SHA.update(chunk.slice(start, start + ONE_MB - preSize));
            chunkSHA256Hashes.push(SHA.digest());

            SHA = crypto.createHash('sha256');
            reserveSize = reserveSize - (ONE_MB - preSize)
            start = ONE_MB - preSize
            preSize = 0;
        }

        preSize += reserveSize;
        SHA.update(chunk.slice(start));
    });

    readStream.on('error', function (err) {
        callback(err);
    });

    readStream.on('end', function () {
        if(isLowerThanOne) {
            callback(null, [SHA.digest()]);
            return;
        }
        callback(null, chunkSHA256Hashes);
    });
}

var computeSHA256TreeHash = function(hashArr) {
    var SHA, 
        currLvlHashes,
        preLvlHashes = hashArr;


    while(preLvlHashes.length > 1) {
        var groupLen = preLvlHashes.length / 2;
        if(preLvlHashes.length % 2 != 0) {
            groupLen++;   
        }

        currLvlHashes = [];

        var i = 0, j =0;
        for(i; i < preLvlHashes.length; i+=2, j++) {
            if(preLvlHashes.length - i > 1) {
                SHA = crypto.createHash('sha256');
                SHA.update(preLvlHashes[i])
                SHA.update(preLvlHashes[i + 1])
                currLvlHashes[j] = SHA.digest();
            }else {
                currLvlHashes[j] = preLvlHashes[i];
            }
        }

        preLvlHashes = currLvlHashes;
    }

    return preLvlHashes[0];

}

var util = {
    getAuth: getAuth,
    clearKey: clearKey,
    extend: extend,
    getFileContent: getFileContent,
    writeTmpFile: writeTmpFile,
    getContentSHA256: getContentSHA256,
    getSHA256TreeHash: getSHA256TreeHash
};


module.exports = util;