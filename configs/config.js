module.exports = {
    apiUrl: '/api/v1/:tenent/(*?)',
    port : 3001,
    filePath: './files',
    sortColumn : 'sortColumn', // url parameter to select sortColumn. Ex : http://url/page?sortColumn=age
    direction : 'sort', // url parameter to select direction Ex : http://url/page?sortColumn=age&sort=asc
    limit : 'limit', // url parameter to select limit. Ex : http://url/page?sortColumn=age&limt=5
    wildcard: ['login', 'license'] // Wildcarded files gives file content as resonse, here login.json content will be come as response
}