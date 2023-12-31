var http = require('http');  
var url = require('url');  
var fs = require('fs');  
var scraper = require('./scraper.js');
const PORT = 5050;

function startServer() {
    var server = http.createServer(function(request, response) {  
        var path = url.parse(request.url).pathname;  
        if (path == "/") path = "/index.html";
        fs.readFile(__dirname + path, function(error, data) {  
            if (error) {  
                response.writeHead(404);  
                response.write('This page does not exist');
                response.end();  
            } else {  
                response.writeHead(200, {  
                    'Content-Type': 'text/html'
                }); 
                response.write(data);  
                response.end();  
            }  
        }); 
    });  
    server.listen(PORT);
    console.log("server running at http://localhost:"+PORT)
}
if (require.main === module) {
    scraper.getCourseData();
    startServer();
} 