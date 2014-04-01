(function() {
  var socket = require("socket.io");
  var io;
  var users = {};
  var urls = [];
  var currentQuestion = "";
  var currentCode = "";
  var teacher = {
    "name": "teacher",
    "pwd": "myClass"
  };

  function login(socket, username, pwd) {
    var pwBad = false;
    if(users[username] || (username === teacher.name && pwd !== teacher.pwd)) {
      if (users[username]) {
        console.log("Login failed. Existing username: %s", username);
      }
      else {
        console.log("Login failed. Invalid teacher password for %s", username);
        pwBad = true;
      }
      socket.emit("loginfailed", pwBad);
    }
    else {
      console.log("User logged in:", username);
      users[username] = new Date();
      socket.userName = username;
      socket.isAdmin = (username === teacher.name && pwd === teacher.pwd);
      socket.emit("loggedin");
      socket.emit('users', users, username);
      socket.broadcast.emit('users', users, username);

      if (currentQuestion) {
        console.log("Sending question to", username);
        socket.emit("question", currentQuestion);
      }

      if (currentCode) {
        console.log("Sending code to", username);
        socket.emit("code", currentCode);
      }

      if (urls.length > 0) {
        console.log("Sending urls to", username);
        socket.emit("urls", urls);
      }
    }
  }

  function logout (socket) {
    console.log("User logged out:", socket.userName);
    delete users[socket.userName];
    delete socket.userName;
    delete socket.isAdmin;
    socket.broadcast.emit('users', users);
  }

  function reset (socket) {
    console.log("System Reset. Forcing everyone to log out.");
    socket.broadcast.emit('forceLogout');
    socket.emit('forceLogout');
    currentQuestion = "";
    currentCode = "";
    urls = [];
  }

  function sendToAll(socket, key, data) {
    var tempUserName = socket.userName;
    console.log( key+" - "+tempUserName+":", data);
    key = key.trim();
    socket.emit(key, data, tempUserName);
    socket.broadcast.emit(key, data, tempUserName);
  }

  function sendToCls(socket, key, data) {
    if(socket.isAdmin) {
      console.log( key+":", data);
      key = key.trim();
      socket.emit(key, data);
      socket.broadcast.emit(key, data);
    }
  }

  exports.Start = function (server, options) {
    io = socket.listen(server, {log:false});
    if (options) {
      if (options.teacher && options.teacher.name && options.teacher.pwd) {
        teacher = options.teacher;
      }
    }

    io.sockets.on('connection', function (socket) {
      socket
        .on('answer',     function (answer)        { sendToAll(socket, "  answer", answer); })
        .on('question',   function (question)      { sendToAll(socket, "question", question); currentQuestion = question; })
        .on('answers',    function (answers)       { sendToAll(socket, " answers", answers); })
        .on('code',       function (code)          { sendToAll(socket, "    code", code); currentCode = code; })
        .on('url',        function (url)           { sendToCls(socket, "     url", url); urls.push(url); })
        .on('login',      function (username, pwd) { login(socket, username, pwd) })
        .on('logout',     function ()              { logout(socket) })
        .on('reset',      function ()              { reset(socket) })
        .on('disconnect', function ()              { logout(socket) })
        ;
    });
  };
})();
