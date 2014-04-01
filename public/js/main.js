var userName;
var answers = {};
var socket = io.connect(window.location.protocol+"//"+window.location.host);
socket
  .on('disconnect', doLogout)
  .on('forceLogout', logout)
  .on('chat', function (data) {
    console.log(data);
    var t = $("textarea");
    t.val(t.val()+data.msg+"\n");
  })
  .on('users', function (users, newuser) {
    var $list = $(".users ul").empty();
    var tempAnswers = {};
    for(var user in users) {
      var $li = $("<li>"+user+"</li>");
      if(user === userName) {
        $li.addClass("you");
      }
      $list.append($li)

      if(answers[user]) {
        tempAnswers[user] = answers[user];
      }
    }

    answers = tempAnswers;
    drawAdminAnswers();
  })
  .on('loginfailed', function (pwBad) {
    var err;

    if (pwBad) {
      err = "Invalid teacher information.";
    }
    else {
      err = "User name already in use: "+userName;
    }
    console.log(err, pwBad);
    $(".error").html(err).show();
    highlightLogin();
  })
  .on('loggedin', function (data) {
    console.log("Logged in as "+userName);
    answers = {};

    $("body").addClass("inclass");
    highlightClass();
    $(".classInfo #message").val("");
    drawCode("");


    if (userName === "Mike") {
      $("body").addClass("admin");
      highlightAdmin();
    }
  })
  .on('answer', function (answer, userName) {
    answers[userName] = answer;
    drawAdminAnswers();
  })
  .on('question', function (question) {
    $(".classInfo .question").html("<label>Question:</label>"+question);
    drawUserAnswers([]);
  })
  .on('answers', function (answers) {
    drawUserAnswers(answers);
  })
  .on('code', function (code) {
    drawCode(code);
  })
  .on('url', function (url) {
    showUrl(url);
  })
  .on('urls', function (urlList) {
    var i; l = urlList.length;
    for (i = 0; i < l; i++) {
      showUrl(urlList[i]);
    }
  })
  ;

function drawAdminAnswers() {
  var $answers = $(".adminInfo .answers ul").empty();
  for(var user in answers) {
    var a = answers[user];
    var $li = $("<li><label>"+user+"</label><span>"+a+"</span></li>");
    $answers.append($li);
  }
}

function drawUserAnswers(answers) {
  var $answers = $(".classInfo .answers ol").empty();
  var l = answers.length;
  for(var i = 0; i < l; i++) {
    var a = answers[i];
    var $li = $("<li>"+a+"</li>");
    $answers.append($li);
  }
}

function drawCode(code) {
  var $code = $("<pre></pre>");
  code = code.trim();
  $code.text(code);
  $(".inclass .classInfo .source").empty().append($code).toggle(code.length>0);
  if(code.length) {
    var params = {
      "brush": "js",
      "html-script": true
    };
    SyntaxHighlighter.highlight(params, $code[0]);
  }
}

function showUrl(url) {
  var $li = $('<li><a target="_blank"></a></li>');
  var $a = $("a", $li).attr("href", url).text(url);
  $li.appendTo(".urls ul");
}

function highlightLogin() {
  $(".loginInfo #username").focus().select();
}

function highlightClass() {
  $(".classInfo #message").focus().select();
}

function highlightAdmin() {
  $(".adminInfo #question").focus().select();
}

function login() {
  var pwd;
  $(".error").hide();
  userName = $("#username").focus().val().trim();
  pwd = $("#password").val().trim();
  if(userName.length === 0) {
    var err = "Please provide your name";
    console.log(err);
    $(".error").html(err).show();
    highlightLogin();
  }
  else {
    console.log("Attempting to login:", userName);
    socket.emit("login", userName, pwd);
  }
  return false;
}

function logout() {
  console.log("Attempting to log out:", userName);
  socket.emit("logout", userName);
  doLogout();
  return false;
}

function doLogout() {
  drawUserAnswers([]);
  drawCode("");
  answers = {};
  $("body").removeClass("inclass admin");
  $(".urls ul").empty();
  highlightLogin();
}

function sendAnswer() {
  var answer = $("#message").focus().select().val();
  console.log("Message:", answer);
  socket.emit("answer", answer);
  return false;
}

function sendAnswers() {
  var temp = [];
  for(var user in answers) {
    var a = answers[user];
    temp.push(a);
    socket.emit("answers", temp);
  }
  return false;
}

function reset() {
  socket.emit("reset");
}

function sendQuestion() {
  var question = $("#question").focus().select().val();
  socket.emit("question", question);
  return false;
}

function sendCode() {
  var code = $("#code").focus().select().val();
  socket.emit("code", code);
  return false;
}

function sendUrl() {
  var url = $("#url").focus().select().val();
  socket.emit("url", url);
  return false;
}

$(document).ready(function(){
  highlightLogin();
  $(".error").hide();
  $("#form_login").on("submit", login);
  $("#form_answer").on("submit", sendAnswer);
  $("#form_question").on("submit", sendQuestion);
  $("#form_code").on("submit", sendCode);
  $("#form_url").on("submit", sendUrl);


  $(".classInfo .logout").on("click", logout);
  $(".adminInfo .sendAnswers").on("click", sendAnswers);
  $(".adminInfo .reset").on("click", reset);
});
