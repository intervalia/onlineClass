var http = require("http"),
    connect = require("connect"),
    cls = require("./node/onlineClass"),
    server, app, port, options;

port = process.env.port || 8080;
console.log("port", port);
app = connect();
app.use(connect.static(__dirname + "/public"))

options = {
  "teacher": {
    "name": "Mike",
    "pwd": "123123"
  }
};

server = http.createServer(app);
cls.Start(server, options);
server.listen(port);
