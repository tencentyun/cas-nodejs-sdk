var fs = require('fs');
var urlLib = require('url');
var querystring = require('querystring');
var REQUEST = require('request');
var EventProxy = require('eventproxy');
var util = require('./util');
var ProcessName = 'cas';


// ---------------------------------------- CAS 相关 api ------------------------------------

/**
 * 创建文件库
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域                       
 *     @param  {string}     vaultName  要创建的vault的名称
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则返回为空，http code为201
 */
function createVault(params, callback) {
    submitRequest.call(this, {
        method: 'PUT',
        action: 'vaults/' + params.vaultName,
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 201) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 读取用户的文件库列表
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 *     @param  {string}     limit      可选，指定要返回的文件库最大数目。该值为正整数，取值1-1000，默认为 1000
 *     @param  {string}     marker     可选，按字典序，从该 Marker 开始列出 Vault 的 QCS，如果为空则从头列出
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为200，返回用户读取的 vault 列表信息
 *     @param  {string}     Marker              如果返回的列表未能显示完全，该值为下一次请求的 Marker 值。如果返回的列表已经显示完全，则此值为 null
 *     @param  {array}      VaultList           文件库描述
 *     @param  {string}     CreationDate        文件库创建时间，ISO 8601 日期格式的字符串表示，例如，2017-03-20T17:03:43.221Z
 *     @param  {string}     LastInventoryDate   文件库最新读取档案列表时间， ISO 8601 日期格式的字符串表示，例如，2017-03-20T17:03:43.221Z
 *     @param  {number}     NumberOfArchives    截止到上次读取档案列表时间，文件库中的档案数
 *     @param  {number}     SizeInBytes         截止到上次读取档案列表时间，文件库中的总档案大小
 *     @param  {string}     VaultQCS            文件库的CAS 资源名称 （QCS）
 *     @param  {string}     vaultName           文件库名称
 */
function listVaults(params, callback) {
    submitRequest.call(this, {
        method: 'GET',
        action: 'vaults',
        region: params.region,
        appId: params.appId,
        qs: {
            marker: params.marker,
            limit: params.limit
        }
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 200) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        if (!(data.body && data.body.VaultList)) {
            return callback({
                message: 'VaultList is undefined',
                error: data
            });
        }

        return callback(null, data);
    });
}


/**
 * 读取文件库属性
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域                       
 *     @param  {string}     vaultName  要读取的vault的名称
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为200，返回用户读取的 vault 信息
 *     @param  {string}     CreationDate        创建文件库的 UTC 日期， ISO 8601 日期格式， 例如，2017-03-20T17:03:43.221Z
 *     @param  {string}     LastInventoryDate   完成上次文件库清单盘点的 UTC 日期，ISO 8601 日期格式， 例如，2017-03-20T17:03:43.221Z
 *     @param  {number}     NumberOfArchives    上次文件库清单盘点时，文件库中的档案数。尚未运行，返回Null
 *     @param  {number}     SizeInBytes         截止到上次编制清单日期，文件库中的档案总大小，单位：B。尚未运行，返回Null
 *     @param  {string}     VaultQCS            文件库的资源名称 (QCS)
 *     @param  {string}     vaultName           在创建时间指定的文件库名称
 */
function describeVault(params, callback) {
    submitRequest.call(this, {
        method: 'GET',
        action: 'vaults/' + params.vaultName,
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 200) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 删除文件库
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域                       
 *     @param  {string}     vaultName  要创建的vault的名称
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则返回为空，http code为204
 */
function deleteVault(params, callback) {
    submitRequest.call(this, {
        method: 'DELETE',
        action: 'vaults/' + params.vaultName,
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 204) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 读取文件库的权限信息
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域
 *     @param  {string}     vaultName  要读取的vault的名称
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为200，返回用户读取的 vault 权限信息
 *     @param  {object}    policy     policy规则
 */
function getVaultAccessPolicy(params, callback) {
    submitRequest.call(this, {
        method: 'GET',
        action: 'vaults/' + params.vaultName + '/access-policy',
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 200) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        data.policy = JSON.parse(data.body.policy)
        return callback(null, data);
    });
}


/**
 * 设置文件库的权限信息
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域
 *     @param  {string}     vaultName  要读取的vault的名称
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 *     @param  {string/object}     policy      权限信息对象，形式如下：
 * {
 *     "version": "2.0",
 *     "statement": [
 *         {
 *             "effect": "allow",
 *             "principal": {
 *               "qcs": [
 *                 "qcs::cam::uin/<RootAccout>:uin/<SubAccount>",
 *                 "qcs::cam::uin/<RootAccout>:uin/<SubAccount>"
 *               ]
 *             },
 *             "action": [
 *                 "name/cas:<ActionName>"
 *             ],
 *             "resource": [
 *                 "qcs::cas:<region>:uid/<Accout>:vault/<vaultName>",
 *                 "qcs::cas:<region>:uid/<Accout>:vault/<vaultName>"
 *             ],
 *             "condition": {
 *                 "<ConditionOperator>": {
 *                     "<ConditionName>": [
 *                         "<ConditionValue>",
 *                         "<ConditionValue>"
 *                     ]
 *                 }
 *             }
 *         }
 *     ]
 * }
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则返回为空，http code为204
 */
function setVaultAccessPolicy(params, callback) {

    if(typeof params.policy === 'object') {
        try {
            params.policy = JSON.stringify(params.policy)
        } catch(e) {
            callback({
                message: 'policy should be a JSON string or a JSON-serializable object'
            });
        }
    }

    submitRequest.call(this, {
        method: 'PUT',
        action: 'vaults/' + params.vaultName + '/access-policy',
        region: params.region,
        appId: params.appId,
        body: JSON.stringify({
            policy: params.policy
        })
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 204) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 删除文件库权限策略
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域
 *     @param  {string}     vaultName  要读取的vault的名称
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则返回为空，http code为204
 */
function deleteVaultAccessPolicy(params, callback) {
    submitRequest.call(this, {
        method: 'DELETE',
        action: 'vaults/' + params.vaultName + '/access-policy',
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 204) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 上传档案
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region          地域
 *     @param  {string}     vaultName       要读取的vault的名称
 *     @param  {string}     body            文件地址或者文件的读取流
 *     @param  {string}     contentLength   可选，文件的大小，当body为文件流时必选
 *     @param  {string}     description     可选，Archive的描述，会在读取Archive的时候返回
 *     @param  {number}     appId           可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为201，返回文档的相关信息
 *     @param  {string}     Location                创建成功以后，Archive的路径
 *     @param  {string}     x-cas-archive-id        Archive的表示ID
 *     @param  {string}     x-cas-content-sha256    档案的SHA256 校验和（线性哈希）
 *     @param  {string}     x-cas-sha256-tree-hash  档案的树形哈希校验和
 */
function uploadArchive(params, callback) {
    var self = this;
    var ep = new EventProxy();
    var headers = {};
    var readStream = params['body'];
    var tmpFolderPath;
    var tmpFilePath;

    if (params['body'] && (typeof params['body'] == 'string')) {
        readStream = fs.createReadStream(params['body']);
        if(!params['contentLength']) {
            params['contentLength'] = fs.statSync(params['body']).size
        }
    }


    // 上传过程中出现错误，返回错误
    ep.fail(function (errData) {
        fs.unlink(tmpFilePath, function(err) {
            if(err) {
                return
            }
            fs.rmdir(tmpFolderPath, function(err) {})
        })
        return callback(errData);
    });

    ep.all(['content-sha256-done', 'sha256-tree-hash-done'], function(contentSHA256, treeHash) {

        headers['x-cas-content-sha256'] = contentSHA256
        headers['x-cas-sha256-tree-hash'] = treeHash
        headers['Content-Length'] = params['contentLength']
        headers['x-cas-archive-description'] = params['description']

        var readStream = fs.createReadStream(tmpFilePath);

        submitRequest.call(self, {
            method: 'POST',
            action: 'vaults/' + params.vaultName + '/archives',
            region: params.region,
            appId: params.appId,
            headers: headers,
            body: readStream
        }, function (err, data) {
            if(err) {
                readStream.destroy()
            }

            fs.unlink(tmpFilePath, function(fileErr) {
                fs.rmdir(tmpFolderPath, function(err) {})
            })

            if (err) {
                callback(err);
                return;
            }

            if(data.statusCode !== 201) {
                callback(data);
                return;
            }

            return callback(null, data);
        });
    })

    util.writeTmpFile(readStream, function(err, folderPath, filePath) {
        if(err) ep.emit('fail', {
            message: 'write temp file error',
            error: err
        })

        tmpFolderPath = folderPath
        tmpFilePath = filePath

        util.getContentSHA256(filePath, function(err, contentSHA256) {
            if(err) ep.emit('fail', {
                message: 'compute content sha256 error',
                error: err
            })
            ep.emit('content-sha256-done', contentSHA256)
        })

        util.getSHA256TreeHash(filePath, function(err, treeHash) {
            if(err) ep.emit('fail', {
                message: 'compute content sha256 tree error',
                error: err
            })
            ep.emit('sha256-tree-hash-done', treeHash)
        })
    })
}


/**
 * 删除档案
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region     地域
 *     @param  {string}     vaultName  要读取的vault的名称
 *     @param  {string}     archiveId  要删除的Archive的ID
 *     @param  {number}     appId      可选，跨账户创建valut时的appId，操作本账户时则不传
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则返回为空，http code为204
 */
function deleteArchive(params, callback) {
    submitRequest.call(this, {
        method: 'DELETE',
        action: 'vaults/' + params.vaultName + '/archives/' + params.archiveId,
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 204) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 启动指定类型的任务(档案检索或文件库清单检索)
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region          地域
 *     @param  {string}     vaultName       要读取的vault的名称
 *     @param  {number}     appId           可选，跨账户创建valut时的appId，操作本账户时则不传
 *     @param  {object}     jobParameters   任务相关的参数
 *          @param  {string}     Type                           任务类型，值为：archive-retrieval(档案检索) 或 inventory-retrieval(文件库检索)
 *          @param  {string}     ArchiveId                      可选，archive的id，当Type为archive-retrieval时，则必选
 *          @param  {string}     Description                    可选，任务的描述
 *          @param  {string}     RetrievalByteRange             可选，档案检索操作要检索的字节范围。其格式为“StartByteValue-EndByteValue”。如果未指定，则检索整个档案。如果指定了字节范围，则字节范围必须以兆字节 (1 024*1 024) 对齐，这意味着，StartByteValue 必须可被 1MB 整除，并且 EndByteValue 加 1 必须可被 1MB 整除，或者等于指定为档案字节大小值减 1 的结束值。如果 RetrievalByteRange 没有以兆字节对齐，则此操作会返回 400 响应
 *          @param  {string}     Tier                           可选，Archive检索的检索类型，值为Expedited、Standard、Bulk，默认是Standard
 *          @param  {string}     Format                         可选，Type为inventory-retrieval时，文件库清单输出格式，枚举值： CSV ，JSON。默认值：JSON
 *          @param  {object}     InventoryRetrievalParameters   可选，Type为inventory-retrieval时的相关配置
 *                 @param  {ISO 8601}   StartDate       可选，文件库清单检索的开始日期（采用 UTC 格式），包含当日或之后创建的档案。ISO 8601 日期格式 YYYY-MM-DDThh:mm:ssTZD（以秒为单位）的字符串表示
 *                 @param  {ISO 8601}   StartDate       可选，文件库清单检索的结束日期（采用 UTC 格式），包含当日或之后创建的档案。ISO 8601 日期格式 YYYY-MM-DDThh:mm:ssTZD（以秒为单位）的字符串表示
 *                 @param  {string}     Limit           可选，文件库清单检索请求返回的最大条目数。默认值：10000，有效值：1-10000之间的正整数
 *                 @param  {string}     Marker          可选，字典序，从Marker起读取对应文件库清单
 *          
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为202，返回任务的相关信息
 *     @param  {string}     Location          任务的相对 URI 路径，格式 /< APPID >/vaults/< VaultName >/jobs/< JobID >
 *     @param  {string}     x-cas-job-id      任务的 ID，即 JobID
 */
function initiateJob(params, callback) {
    submitRequest.call(this, {
        method: 'POST',
        action: 'vaults/' + params.vaultName + '/jobs',
        region: params.region,
        appId: params.appId,
        body: JSON.stringify(params.jobParameters)
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 202) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 列出任务，包括正在进行的任务以及最近完成的任务
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region          地域
 *     @param  {string}     vaultName       要读取的vault的名称
 *     @param  {number}     appId           可选，跨账户创建valut时的appId，操作本账户时则不传
 *     @param  {boolean}    completed       可选，要返回的任务的状态。您可以指定 true 或 false
 *     @param  {string}     marker          可选，字典序，从marker起读取对应条目，您可从之前的列出任务响应获取marker值。只有在您要继续对之前的“列出任务”请求中开始的结果进行分页时，才需要包括marker
 *     @param  {string}     limit           可选，要返回任务的最大数目。默认限制为 1000。返回的任务数可能少于指定的限制值，但永远不会超过限制值
 *     @param  {string}     statuscode      可选，要返回的任务状态的类型。值为：InProgress、Succeeded、Failed
 *          
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为200，返回任务列表
 *     @param  {string}     JobList                         任务数据元数组。每个任务数据元均包含一组描述任务的名称-值对
 *     @param  {string}     Marker                          您可以在新 Initiate Job 请求中使用标记获取其他清单项目。如果没有更多清单项目，则此值为 null
 *     
 *     @param  {string}     JobId                           任务的ID
 *     @param  {string}     JobDescription                  任务的描述
 *     @param  {string}     VaultQCS                        任务对应Vault的资源名称
 *     @param  {string}     Action                          对于档案取回任务，此值为 ArchiveRetrieval。对于清单取回任务，此值为 InventoryRetrieval
 *     @param  {boolean}    Completed                       如果任务已完成，则为 true；否则为 false
 *     @param  {string}     StatusCode                      任务状态代码。值为：Succeeded、Failed 或 InProgress
 *     @param  {string}     StatusMessage                   任务状态消息
 *     @param  {ISO 8601}   CreationDate                    任务启动时的通用协调时间 (UTC) 日期。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *     @param  {ISO 8601}   CompletionDate                  任务完成时的通用协调时间 (UTC) 日期。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *     @param  {string}     ArchiveId                       档案的ID。此字段仅针对档案取回任务描述而显示
 *     @param  {number}     ArchiveSizeInBytes              档案取回任务请求的档案的大小
 *     @param  {string}     ArchiveSHA256TreeHash           档案取回操作的整个档案的 SHA256 树形哈希
 *     @param  {string}     RetrievalByteRange              档案取回任务所取回的字节范围，格式为“StartByteValue-EndByteValue”。如果没有在档案取回中指定范围，则取回整个档案，并且 StartByteValue 等于 0，EndByteValue 等于档案大小减去 1。对于清单取回任务，此字段为 null
 *     @param  {string}     SHA256TreeHash                  档案请求范围的 SHA256 树形哈希值。 当指定未以树形哈希对齐的范围的档案取回任务，该值为Null； 当指定不等于整个档案的范围并且任务状态为InProgress的档案任务，该值为Null，任务完成后，SHA256TreeHash字段将具有值
 *     @param  {string}     Tier                            用于档案检索的检索选项
 *     @param  {number}     InventorySizeInBytes            与检索文件库清单任务请求相关联的列表的大小，单位字节
 *     @param  {string}     InventoryRetrievalParameters    文件库清单检索的相关配置
 *          @param  {string}     Format                          Archive列表输出格式，值为：CSV、JSON
 *          @param  {ISO 8601}   StartDate                       文件库清单检索的开始日期（采用 UTC 格式）。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *          @param  {ISO 8601}   EndDate                         文件库清单检索的结束日期（采用 UTC 格式）。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *          @param  {string}     Limit                           指定每个文件库清单检索请求返回的最大清单项目数。有效值：正整数
 *          @param  {string}     Marker                          您可以在新 Initiate Job 请求中使用标记获取其他清单项目。如果没有更多清单项目，则此值为 null
 * 
 */
function listJobs(params, callback) {
    submitRequest.call(this, {
        method: 'GET',
        action: 'vaults/' + params.vaultName + '/jobs',
        region: params.region,
        appId: params.appId,
        qs: {
            completed: params.completed,
            marker: params.marker,
            limit: params.limit,
            statuscode: params.statuscode
        }
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 200) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 任务详情
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region          地域
 *     @param  {string}     vaultName       要读取的vault的名称
 *     @param  {number}     jobId           任务的id
 *     @param  {number}     appId           可选，跨账户创建valut时的appId，操作本账户时则不传
 *          
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为200，返回任务的相关信息
 *     @param  {string}     JobId                           任务的ID
 *     @param  {string}     JobDescription                  任务的描述
 *     @param  {string}     VaultQCS                        任务对应Vault的资源名称
 *     @param  {string}     Action                          对于档案取回任务，此值为 ArchiveRetrieval。对于清单取回任务，此值为 InventoryRetrieval
 *     @param  {boolean}    Completed                       如果任务已完成，则为 true；否则为 false
 *     @param  {string}     StatusCode                      任务状态代码。值为：Succeeded、Failed 或 InProgress
 *     @param  {string}     StatusMessage                   任务状态消息
 *     @param  {ISO 8601}   CreationDate                    任务启动时的通用协调时间 (UTC) 日期。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *     @param  {ISO 8601}   CompletionDate                  任务完成时的通用协调时间 (UTC) 日期。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *     @param  {string}     ArchiveId                       档案的ID。此字段仅针对档案取回任务描述而显示
 *     @param  {number}     ArchiveSizeInBytes              档案取回任务请求的档案的大小
 *     @param  {string}     ArchiveSHA256TreeHash           档案取回操作的整个档案的 SHA256 树形哈希
 *     @param  {string}     RetrievalByteRange              档案取回任务所取回的字节范围，格式为“StartByteValue-EndByteValue”。如果没有在档案取回中指定范围，则取回整个档案，并且 StartByteValue 等于 0，EndByteValue 等于档案大小减去 1。对于清单取回任务，此字段为 null
 *     @param  {string}     SHA256TreeHash                  档案请求范围的 SHA256 树形哈希值。 当指定未以树形哈希对齐的范围的档案取回任务，该值为Null； 当指定不等于整个档案的范围并且任务状态为InProgress的档案任务，该值为Null，任务完成后，SHA256TreeHash字段将具有值
 *     @param  {string}     Tier                            用于档案检索的检索选项
 *     @param  {number}     InventorySizeInBytes            与检索文件库清单任务请求相关联的列表的大小，单位字节
 *     @param  {string}     InventoryRetrievalParameters    文件库清单检索的相关配置
 *          @param  {string}     Format                          Archive列表输出格式，值为：CSV、JSON
 *          @param  {ISO 8601}   StartDate                       文件库清单检索的开始日期（采用 UTC 格式）。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *          @param  {ISO 8601}   EndDate                         文件库清单检索的结束日期（采用 UTC 格式）。ISO 8601 日期格式的字符串表示，例如，2013-03-20T17:03:43.221Z
 *          @param  {string}     Limit                           指定每个文件库清单检索请求返回的最大清单项目数。有效值：正整数
 *          @param  {string}     Marker                          您可以在新 Initiate Job 请求中使用标记获取其他清单项目。如果没有更多清单项目，则此值为 null
 */
function describeJobs(params, callback) {
    submitRequest.call(this, {
        method: 'GET',
        action: 'vaults/' + params.vaultName + '/jobs/' + params.jobId,
        region: params.region,
        appId: params.appId
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 200) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}


/**
 * 获取任务输出
 * @param  {object}     params     参数，必须，下面为参数列表
 *     @param  {string}     region          地域
 *     @param  {string}     vaultName       要读取的vault的名称
 *     @param  {number}     jobId           任务的id
 *     @param  {number}     range           可选，输出取回的字节范围，如 0-1048576 ，默认是下载所有内容
 *     @param  {number}     appId           可选，跨账户创建valut时的appId，操作本账户时则不传
 *          
 * @param  {function}   callback   回调函数，必须，下面为参数列表
 * 
 * @return {object}     err        请求失败的错误，如果请求成功，则为空
 * @return {object}     data       成功则http code为200或206，返回文档的内容
 */
function getJobOutput(params, callback) {
    submitRequest.call(this, {
        method: 'GET',
        action: 'vaults/' + params.vaultName + '/jobs/' + params.jobId + '/output',
        region: params.region,
        appId: params.appId,
        headers: {
            Range: params.range && ('bytes=' + params.range)
        }
    }, function (err, data) {
        if (err) {
            callback(err);
            return;
        }

        if(data.statusCode !== 200 && data.statusCode !== 206) {
            callback({
                message: 'request error',
                error: data
            });
            return;
        }

        return callback(null, data);
    });
}









/**
 * 获取签名
 * @param  {object}  params  参数对象，必须，下面为参数列表
 *     @param  {string}  params.method     请求方法
 *     @param  {string}  params.pathname   请求路径，如/[appid]/vaults
 *     @param  {string}  params.expires    签名的有效时间，如60，则60秒的有效时间，不填则默认3600秒，填0则为单次签名
 *     @param  {string}  params.params     http请求所带的querystring参数
 *     @param  {string}  params.headers    http请求头部的key value对象
 *     @param  {string}  params.SecretId   用户secretId
 *     @param  {string}  params.SecretKey  用户secretKey
 * @return  {string}  data  返回签名字符串
 */
function getAuth(params) {
    params = params || {};

    return util.getAuth({
        method: params.method,
        pathname: params.pathname,
        expires: params.expires,
        params: params.params,
        headers: params.headers,
        SecretId: params.SecretId || this.SecretId,
        SecretKey: params.SecretKey || this.SecretKey
    });
}


// ---------------------------------------- 工具方法 ------------------------------------

//检查参数完整性
function checkParamsRequire(params) {
    var region = params.region;

    if (!region) {
        return false;
    }

    return true;

}

// 生成操作 url
function getCgiUrl(params) {
    var region = params.region;
    var action = params.action;
    var appId = params.appId;

    var url = 'http://' + ProcessName + '.' + region + '.myqcloud.com';

    var path = '/' + appId;

    if (action) {
        url += path + '/' + action;
    }

    return url;
}

//请求方法
function submitRequest(params, callback) {

    var appId = params.appId || '-';
    var region = params.region;
    var action = params.action;
    var method = params.method || 'GET';
    var headers = params.headers || {};
    var url = params.url;
    var body = params.body;
    var json = params.json;

    var needHeaders = params.needHeaders === undefined ? true : params.needHeaders;
    var qs = params.qs;

    var SecretId = this.SecretId;
    var SecretKey = this.SecretKey;

    if(!checkParamsRequire(params)) {
        return callback({
            message: 'lack of required params'
        });
    }


    url = url || getCgiUrl({
        region: region,
        action: action,
        appId: appId,
    });

    headers['Host'] = ProcessName + '.' + region + '.myqcloud.com';

    var opt = {
        url: url,
        method: method,
        headers: headers,
        qs: qs,
        body: body,
        json: json
    };

    var pathname = urlLib.parse(url).pathname || '/';

    // 获取签名
    opt.headers.Authorization = getAuth({
        method: opt.method,
        pathname: pathname,
        SecretId: SecretId,
        SecretKey: SecretKey
    });

    // 预先处理 undefine 的属性
    if (opt.headers) {
        opt.headers = util.clearKey(opt.headers);
    }

    if (opt.qs) {
        opt.qs = util.clearKey(opt.qs);
    }

    return REQUEST(opt, function (err, response, body) {

        /**
         * 请求错误，发生网络错误
         */
        if (err) {
            callback({
                message: 'network error',
                error: err
            });
            return;
        }

        var statusCode = response.statusCode;
        var jsonRes = {
            statusCode: statusCode
        };

        try {
            jsonRes.body = JSON.parse(body);
        } catch(e) {
            jsonRes.body = body;
        }

        // 如果需要头部信息，则 headers 挂载返回
        if (needHeaders) {
            jsonRes.headers = response.headers || {};
        }

        /**
         * jsonRes: {
         *  statusCode: Number
         *  headers: Object
         *  body: Any
         * }
         */
        return callback(null, jsonRes);
    });
}

module.exports = {
    createVault: createVault,
    listVaults: listVaults,
    describeVault: describeVault,
    deleteVault: deleteVault,
    getVaultAccessPolicy: getVaultAccessPolicy,
    setVaultAccessPolicy: setVaultAccessPolicy,
    deleteVaultAccessPolicy: deleteVaultAccessPolicy,
    uploadArchive: uploadArchive,
    deleteArchive: deleteArchive,
    initiateJob: initiateJob,
    listJobs: listJobs,
    describeJobs: describeJobs,
    getJobOutput: getJobOutput,

    getAuth: getAuth,
    getContentSHA256: util.getContentSHA256,
    getSHA256TreeHash: util.getSHA256TreeHash
}