
const jsonServer = require('json-server')
const server = jsonServer.create()
const middlewares = jsonServer.defaults()

const router = jsonServer.router('../data1.json', {foreignKeySuffix: '_id'})
router.db._.id = '_id';

server.use(jsonServer.rewriter({
    "/api/v1/ctdemo/*" : "/$1",
    // "/api/v1/ctdemo/apikey/authkeygenerator" : "/authkeygenerator",
    // "/api/v1/:any/apikey/authkeygenerator?sortColumn=:col&sort=:sort" : "/authkeygenerator"
}));

server.post('/api/v1/:any/login', function(req, res) {    
    fs.readFile('login.json', 'utf8', function(err, data) {
        res.json(JSON.parse(data));
    });
});
// server.post('/api/v1/:any/license', function(req, res) {
//     fs.readFile('license.json', 'utf8', function(err, data) {
//         res.json(JSON.parse(data));
//     });
// });

// server.use(function(req, res, next) {
//     if ( req.url === '/login' ) {
//         let url = 'http://localhost:3000/login';
//         request.get({ url:url }, function(err, response, body) {
//             if(err) { console.log(err); return; }
//             let resp = JSON.parse(response.body);
//             res.json(resp);
//         });
//     }
//     next()
// });

server.use(middlewares)
server.use(router);

router.render = function (req, res) {
    let resp = {};
    if (req.method === 'GET') {
        resp.pagination = {total: 1, sort: {column: "name", direction: "asc"}, limit: 10, startIndex: 1};
    }
    resp.status = {type: "success",message: ""};
    resp.statusCode = res.statusCode;
    resp.data =  res.locals.data;
    res.jsonp(resp);
}

app.listen(config.port || 3000, (err) => {
    if (err) console.log('port issue');
    console.log('JSON Server is running in port ' + config.port);
});