const fs = require('fs');
const express = require('express');
const url = require('url');
const config = require('./configs/config');
const bodyParser = require('body-parser');
const _ = require("lodash")
const cors = require('cors');

let routes = [];
let allPath = [];

const app = express();
app.use(cors());
app.use(bodyParser.json())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

flatArray(getFiles(config.filePath));

_.unionBy(allPath).forEach(path => {
    routes.push(path);
    app.get( config.apiUrl + path + '/:id?', getDBName, readDB, function (req, res) {});
    
    app.post( config.apiUrl + path + '/:id?' ,getDBName , postDB,function(req, res, next) {});
    
    app.put( config.apiUrl + path + '/:id' ,getDBName , updateDB,function(req, res, next) {});

    app.delete( config.apiUrl + path + '/:id' ,getDBName , deleteDB,function(req, res, next) {});
});

function getDBName(req, res, next) {
    let queryData = url.parse(req.url, true);
    let urlPath = req.path.split('/');
    req.mock = {};
    req.mock.querystring = queryData.query;
    if (req.params.id === undefined) {
        req.mock.dbname = urlPath[urlPath.length - 1] || urlPath[urlPath.length - 2];
    } else {
        if (urlPath[urlPath.length - 1] === '') urlPath.pop();
        req.mock.dbname = urlPath[urlPath.length - 2];
    }
    if (config.wildcard.indexOf(req.mock.dbname) > -1) {
        let path = (req.params['0']) ? `${config.filePath}/${req.params['0']}/${req.mock.dbname}.json`: `${config.filePath}/${req.mock.dbname}.json`;
        fs.readFile(path, 'utf8', function (err, data) {
            res.json(JSON.parse(data));
        });
        return;
    }
    next();
}

// Get method start
function readDB(req, res, next) {
    let fileData = {};
    let path = (req.params['0']) ? `${config.filePath}/${req.params['0']}${req.mock.dbname}.json`: `${config.filePath}/${req.mock.dbname}.json`;
    if (!req.params.id) {
        if (routes.indexOf(req.mock.dbname) !== -1) {
            fs.readFile(path, 'utf8', function (err, data) {
                fileData = JSON.parse(data);
                fileData.map(datum => {
                    if (!datum._id) {
                        datum._id = makerandomid();
                    }
                });
                writeFile(req, res, next,fileData);
            });
        }
    } else if (req.params.id) {
        if (routes.indexOf(req.mock.dbname) !== -1) {
            fs.readFile(path, 'utf8', function (err, data) {
                fileData = JSON.parse(data);
                let resp = fileData.filter(datum => datum._id === req.params.id);
                res.json(formatResponse(req, res, next, resp));
            });
        }
    } else {
        next();
    }
}
// Get method start

// Post method start
function postDB(req, res, next) {
    if(_.isEmpty(req.body)) {
        readDB(req, res, next);
    } else {
        fs.readFile(`${config.filePath}/${req.mock.dbname}.json`, 'utf8', function (err, data) {
            fileData = JSON.parse(data);
            req.body._id = makerandomid();
            fileData.unshift(req.body);
            writeFile(req, res, next, fileData);
        });
    }
}
// Post method end

// PUT method start
function updateDB(req, res, next) {
    if(!_.isEmpty(req.body)) {
        fs.readFile(`${config.filePath}/${req.mock.dbname}.json`, 'utf8', function (err, data) {
            fileData = JSON.parse(data);
            fileData.some((datum) => {
                if (datum._id === req.params.id) {
                    delete req.body._id;
                    Object.assign(datum, req.body);
                    return true;
                }
            });
            writeFile(req, res, next, fileData);
        });
    } else {
        res.json({});
    }
}
// PUT method end

// DELETE method start
function deleteDB(req, res, next) {
    if(!_.isEmpty(req.body)) {
        fs.readFile(`${config.filePath}/${req.mock.dbname}.json`, 'utf8', function (err, data) {
            fileData = JSON.parse(data);
            fileData.some((datum, i) => {
                if (datum._id === req.params.id) {
                    fileData.splice(i, 1);
                    return true;
                }
            });
            writeFile(req, res, next, fileData);
        });
    } else {
        res.json({});
    }
}
// PUT method end

function formatResponse(req, res, next,data) {
    let resp = {};
    let sort = req.mock.querystring[config.sortColumn];
    let direction = req.mock.querystring[config.direction];
    let limit = req.mock.querystring[config.limit];
    if(data.length > 0) { // Sort and limit logic
        if (sort && data[0].hasOwnProperty(sort)) {
            let sorted =  _.sortBy(data, o =>  o[sort]);
            data = (!direction || direction === 'asc') ? sorted : sorted.reverse();
        }
        if (limit && (data.length > limit)) data.splice(limit, data.length);
    }

    resp.data = data;
    resp.status = {
        "message": "Success message",
        "type": "success"
    };
    if (data.length > 10) {
        resp.pagination = {
            "limit": 10,
            "sort": {
                "column": sort,
                "direction": "asc"
            },
            "startIndex": 1,
            "total": data.length
        }
    }
    return resp;
}

function makerandomid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 18; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));  
    return text;
}

function writeFile(req, res, next, fileData) {
    fs.writeFile(`${config.filePath}/${req.mock.dbname}.json`, JSON.stringify(fileData, null, 2), (err, data) => {
        res.json(formatResponse(req, res, next, fileData));
    });
}

function getFiles(dir) {
    var all = fs.readdirSync(dir);
    return all.map(file => {
        if (fs.statSync(`${dir}/${file}`).isDirectory()) {
            return getFiles(`${dir}/${file}`);
        }
        let dirpath = `${dir}/${file}`;
        dirpath = dirpath.replace(config.filePath, '').replace('.json', '').split('/').pop();
        return dirpath; 
    });
}

function flatArray(all) {
    all.map(data => {
        if(Array.isArray(data)) {
            flatArray(data);
        } else {
            allPath.push(data);
        }
    });
}

app.listen(config.port || 3000, (err) => {
    if (err) console.log('port issue');
    console.log('JSON Server is running in port ' + config.port);
});