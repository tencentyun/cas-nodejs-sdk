var fs = require('fs');
var path = require('path');
var CAS = require('../index');
var util = require('./util');
var config = require('./config');

var cas = new CAS({
    AppId: config.AppId,
    SecretId: config.SecretId,
    SecretKey: config.SecretKey,
});

function listVaults() {
    cas.listVaults({
        region: 'ap-chengdu'
    }, function (err, data) {
        console.log(err || data);
    });
}

function createVault() {
    cas.createVault({
        region: 'ap-chengdu',
        vaultName: 'sdktest'
    }, function (err, data) {
        console.log(err || data);
    });
}

function describeVault() {
    cas.describeVault({
        region: 'ap-chengdu',
        vaultName: 'sdktest'
    }, function (err, data) {
        console.log(err || data);
    });
}

function deleteVault() {
    cas.deleteVault({
        region: 'ap-chengdu',
        vaultName: 'sdktest'
    }, function (err, data) {
        console.log(err || data);
    });
}

function getVaultAccessPolicy() {
    cas.getVaultAccessPolicy({
        region: 'ap-chengdu',
        vaultName: 'sdktest'
    }, function (err, data) {
        console.log(err || data);
    });
}

function setVaultAccessPolicy() {
    cas.setVaultAccessPolicy({
        region: 'ap-chengdu',
        vaultName: 'sdktest',
        policy: {
            "version": "2.0",
            "statement": [
                {
                    "effect": "allow",
                    "principal": {
                      "qcs": [
                        "qcs::cam::uin/0:uin/0"
                      ]
                    },
                    "action": [
                        "name/cas:CreateVault"
                    ],
                    "resource": [
                        "qcs::cas:ap-chengdu:uid/1251007194:vaults/sdktest"
                    ],
                    "condition": {
                        "ip_not_equal": {
                            "qcs:ip": [
                                "10.121.2.10/24"
                            ]
                        }
                    }
                }
            ]
        }
    }, function (err, data) {
        console.log(err || data);
    });
}

function deleteVaultAccessPolicy() {
    cas.deleteVaultAccessPolicy({
        region: 'ap-chengdu',
        vaultName: 'sdktest'
    }, function (err, data) {
        console.log(err || data);
    });
}

function uploadArchive() {
    // 创建测试文件
    var filename = '1M.zip';
    var filepath = path.resolve(__dirname, filename);
    util.createFile(filepath, 1 * 1024 * 1024, function (err) {
        // 调用方法
        cas.uploadArchive({
            region: 'ap-chengdu',
            vaultName: 'sdktest',
            body: fs.createReadStream(filepath), /* 必须 */
            contentLength: fs.statSync(filepath).size, /* 必须 */
        }, function (err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(JSON.stringify(data, null, '  '));
            }
        });
    });
}

function deleteArchive() {
    cas.deleteArchive({
        region: 'ap-chengdu',
        vaultName: 'sdktest',
        archiveId: "-LmpMBMKu9XFkvz-CXTDla05GUjKoO2PXJUa6vSZ_vVsc1MH3nL1-9VZhP36O95hNPOna5N_sSgbRC-oiEg1lGeDVNSvV2YRtnAosPeNqNbg5ChjBXHilDur-qPZgwDH"
    }, function (err, data) {
        console.log(err || data);
    });
}

function initiateJob() {
    // cas.initiateJob({
    //     region: 'ap-chengdu',
    //     vaultName: 'sdktest',
    //     jobParameters: {
    //         Type: 'inventory-retrieval',
    //         Tier: 'Expedited'
    //     }
    // }, function (err, data) {
    //     console.log(err || data);
    // });

    cas.initiateJob({
        region: 'ap-chengdu',
        vaultName: 'sdktest',
        jobParameters: {
            Type: 'archive-retrieval',
            ArchiveId: 'FW8Vf-gB8lfo6bHAFg6luY6bUrBEOB3TxcXBbNPb2DJQrurq9jn9hSs-cb_J8Bb_rw9HZxekiwsWOsJ_Ml6TtlglZrg0MsQF0Z74OZQjQ7u3uVojL7n3UzDZ40Cs45Fh',
            Description: 'hello world',
            Tier: 'Expedited'
        }
    }, function (err, data) {
        console.log(err || data);
    });
}

function listJobs() {
    cas.listJobs({
        region: 'ap-chengdu',
        vaultName: 'sdktest',
        // limit: 1,
        // statuscode: 'Succeeded',
        completed: false,
    }, function (err, data) {
        console.log(err || JSON.stringify(data, null, '  '));
    });
}

function describeJobs() {
    cas.describeJobs({
        region: 'ap-chengdu',
        vaultName: 'sdktest',
        jobId: "Kf8SJz04lhEY5rqV4afXQdDe8_Q1x9f3JppD7DoNE32Q0RaOWg5vPNQtaBYTO16G"
    }, function (err, data) {
        console.log(err || JSON.stringify(data, null, '  '));
    });
}

function getJobOutput() {
    cas.getJobOutput({
        region: 'ap-chengdu',
        vaultName: 'sdktest',
        jobId: "0izkJ_cSGrGXnfjCm7vcL7Hu_dxxTI_WnFCKSjFRbeVX0zH0QoxrBQeYSy9v169x",
        range: '0-100'
    }, function (err, data) {
        if(err) {
            console.log(err)
            return 
        }
        console.log(data)
    });
}


/******** 工具方法 ********/
function getAuth() {
    var authorization = cas.getAuth();
    console.log(authorization)
}

function getContentSHA256() {
    var filename = '1mb.zip';
    var filepath = path.resolve(__dirname, filename);
    var content = fs.readFileSync(filepath)

    cas.getContentSHA256(content, function(err, contentSHA256) {
        console.log(err || contentSHA256)
    });
}

function getSHA256TreeHash() {
    var filename = '1mb.zip';
    var filepath = path.resolve(__dirname, filename);
    var content = fs.readFileSync(filepath)

    cas.getSHA256TreeHash(content, 1*1024*1024,function(err, treeHash) {
        console.log(err || treeHash)
    });
}


// listVaults();
// createVault();
// describeVault()
// deleteVault()
// getVaultAccessPolicy()
// setVaultAccessPolicy()
// deleteVaultAccessPolicy()
uploadArchive()
// deleteArchive()
// initiateJob()
// listJobs()
// describeJobs()
// getJobOutput()
// getAuth()
// getContentSHA256()
// getSHA256TreeHash()