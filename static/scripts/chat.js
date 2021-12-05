var controlsDiv = document.getElementsByClassName("controlsDiv")[0],
    optBtn = document.getElementById("optBtn"),
    pressed = !1;
controlsDiv.innerHTML = '\n<button id="endChatBtn" class="button is-danger is-small">End</button>\n<button id="requestBtn" class="button is-warning is-small ">Request Permission</button>\n<div style="display:none" class="mediaBtns">\n<button id="sendPicBtn" type="button" class="button is-primary is-small">Send Pic</button>\n<button id="recordBtn" class="button is-info is-small">\n  <img src="static/img/record.png"> </button>\n  <button  id="sendRecordBtn" type="button" class="button is-info is-small"><img src="static/img/send.png"></button>\n  </div>';
optBtn.addEventListener("click", function () {
    !1 === pressed ? (controlsDiv.style.display = "block", pressed = !0) : (controlsDiv.style.display = "none", pressed = !1)
});

function enableMediaBtns() {
    document.getElementsByClassName("mediaBtns")[0].style.display = "inline";
    requestBtn.style.display = "none"
}

function measure() {
    var a = document.getElementsByClassName("navbar")[0];
    document.documentElement.style.setProperty("--nh", window.innerHeight - a.offsetHeight + "px")
}
window.addEventListener("resize", function () {
    measure();
    updateScroll()
});
measure();
window.onbeforeunload = function () {
    return "Do you wish to end the chat?"
};

function resetOnBeforeUnload() {
    window.onbeforeunload = ""
}
var textForm = document.getElementById("textInput");
textForm.addEventListener("keypress", function (a) {
    13 === a.keyCode && (a.preventDefault(), document.getElementById("sendMsgBtn").click())
});

function updateScroll() {
    var a = document.getElementsByClassName("messagebox")[0];
    a.scrollTop = a.scrollHeight
}

function elementStateChanger(a, c) {
    var g = !0;
    "enable" === c && (g = !1);
    for (var d = {
            chatEls: [optBtn, textInput, sendMsgBtn]
        }, e = 0; e < d[a].length; e++) d[a][e].disabled = g
}
var socket = io(),
    emojiMap = {
        "</3": "💔",
        "<3": "💗",
        ":)": "😊",
        "*)": "😉",
        ";)": "😉",
        ":(": "😒",
        ":|": "😐",
        ":O": "😲",
        ":p": "😜",
        ":D": "😁"
    },
    messageboxDiv = document.getElementsByClassName("messagebox")[0],
    sent = !1;

function createMessage(a) {
    clearNotification();
    var c = document.createElement("div");
    c.classList.add("messagecard");
    c.innerHTML = '\n    <div class="messagecard-icon">\n        <div style="height:100%" ></div>\n        <img class="usericon" src="" alt="usericon" srcset="">\n    </div>\n    <div class="messagecard-body">\n        <div class="message-info" >\n            <span class="message-sender">\n        Stranger - </span> <span class="message-time"></span>\n        </div>\n        <div class="message-context">\n        </div>\n    </div>';
    a.sender === socket.id ? (c.classList.add("message-me"), c.getElementsByClassName("usericon")[0].src = "static/img/logos/generic_icon_two.png", c.getElementsByClassName("message-sender")[0].textContent = "Me - ") : (c.classList.add("message-stranger"), c.getElementsByClassName("usericon")[0].src = "static/img/logos/generic_icon.png", updatePageTitle());
    c.getElementsByClassName("message-time")[0].textContent = getTime();
    var g = c.getElementsByClassName("message-context")[0];
    if ("text" === a.type) {
        var d = document.createElement("p");
        a = String(a.data);
        for (var e in emojiMap) a.includes(e) && (a = a.replace(e, emojiMap[e]));
        d.textContent = a;
        g.appendChild(d)
    } else if ("picture" === a.type) {
        var b = document.createElement("img");
        d = new Blob([a.data]);
        var h = new FileReader;
        h.onload = function (a) {
            b.src = h.result;
            b.onload = function (a) {
                8E4 <= b.height * b.width && (b.width > b.height ? b.style.width = messageboxDiv.offsetWidth + "px" : b.height > b.width && (b.style.height = messageboxDiv.offsetHeight + "px"));
                g.appendChild(b);
                updateScroll()
            }
        };
        h.readAsDataURL(d)
    } else if ("sound" ===
        a.type) {
        var f = document.createElement("audio");
        d = new Blob([a.data], {
            type: "audio/ogg; codecs=opus"
        });
        f.setAttribute("controls", "controls");
        var k = new FileReader;
        k.onload = function () {
            f.src = k.result;
            f.type = "audio/ogg"
        };
        k.readAsDataURL(d);
        g.appendChild(f)
    }
    messageboxDiv.appendChild(c);
    updateScroll()
}

function createNotification(a) {
    clearNotification();
    var c = document.createElement("div");
    c.classList.add("system-notification", "has-text-centered");
    if ("compLeft" === a || "ended" === a) socket.disconnect(), resetOnBeforeUnload(), elementStateChanger("chatEls", "disable");
    "matched" === a && elementStateChanger("chatEls", "enable");
    "perAcq" === a && (enableMediaBtns(), loadScript());
    c.innerHTML = {
        greet: '<p class="info" >Connected. Waiting for a companion</p>',
        compLeft: '<p class="info" >Companion left. <a class="button is-small is-info" href="/chatpage">New Chat</a></p>',
        matched: '<p class="info" >Matched! Say hi to your companion</p>',
        ended: '<p class="info" >Chat ended. <a class="button is-small is-info" href="/chatpage">New Chat</a></p>',
        reqPer: '<p class="info" >Permission requested</p>',
        accReq: '<p class="warning" >Companion asking to share media  <button onclick="acceptMediaReq()" class="button is-info is-small" >Accept</button> <button onclick="clearNotification()" class="button is-danger is-small" >Decline</button> </p>',
        perErr: '<p class="danger" >You don\'t have permission</p>',
        perAcq: '<p class="info" >You can now share media</p>',
        emptyMsgErr: '<p class="danger" >You can\'t send empty message</p>',
        fileErr: '<p class="warning">Picture can\'t be larger than 5MB</p>',
        typing: '<p class="info" >Companion is typing ...</p>'
    } [a];
    messageboxDiv.appendChild(c);
    updateScroll()
}

function clearNotification() {
    for (var a = document.getElementsByClassName("system-notification"); 0 !== a.length;) messageboxDiv.removeChild(a[0])
}

function getTime() {
    var a = ("0" + (new Date).getMinutes()).slice(-2);
    return ("0" + (new Date).getHours()).slice(-2) + ":" + a
}

function loadScript() {
    var a = document.createElement("script");
    a.src = window.location.origin + "/static/scripts/record.js";
    document.body.appendChild(a)
}

function updatePageTitle() {
    document.title = "New Message"
}
document.body.addEventListener("click", function () {
    document.title = "Chat-randomchatapp.com"
});

function takeInput(a, c, g) {
    var d = document.createElement("input"),
        e = new FileReader;
    d.type = "file";
    d.accept = "image/jpeg";
    d.click();
    d.onchange = function (b) {
        b = b.target.files[0];
        5E6 < b.size ? createNotification("fileErr") : (e.readAsDataURL(b), e.onload = function (b) {
            var f = new Image;
            f.src = b.target.result;
            f.onload = function () {
                15E4 > f.width * f.height && (a = f.width, c = f.height);
                var b = document.createElement("canvas"),
                    d = b.getContext("2d");
                var e = 0 < a ? "width" : "height";
                "width" === e ? (e = a / f.width, b.width = a, b.height = f.height * e) : "height" ===
                    e && (e = c / f.height, b.height = c, b.width = f.width * e);
                d.drawImage(f, 0, 0, b.width, b.height);
                d.canvas.toBlob(function (a) {
                    g("picture", a)
                }, "image/jpeg", .5)
            }
        })
    }
}
var sendMsgBtn = document.getElementById("sendMsgBtn"),
    sendPicBtn = document.getElementById("sendPicBtn"),
    endChtBtn = document.getElementById("endChatBtn"),
    textInput = document.getElementById("textInput"),
    requestBtn = document.getElementById("requestBtn");
socket.on("userTypingNotification", function (a) {
    "started" === a.status ? a.sender !== socket.id && createNotification("typing") : "stopped" === a.status && a.sender !== socket.id && clearNotification()
});
textInput.addEventListener("keyup", function (a) {
    !1 === sent && 0 != a.target.value.length ? (sent = !0, socket.emit("userTypingNotification", {
        status: "started",
        sender: socket.id
    })) : 0 === a.target.value.length && (sent = !1, socket.emit("userTypingNotification", {
        status: "stopped",
        sender: socket.id
    }))
});
socket.on("message", function (a) {
    createMessage(a)
});
socket.on("are_you_alive", function (a) {
    socket.emit("i_am_alive")
});
socket.on("notification", function (a) {
    createNotification(a)
});
socket.on("reconnect_attempt", function (a) {
    createNotification("compLeft")
});

function jsonifySend(a, c) {
    socket.send({
        sender: socket.id,
        type: a,
        data: c
    })
}
sendMsgBtn.addEventListener("click", function () {
    0 === textInput.value.trim().length ? createNotification("emptyMsgErr") : (jsonifySend("text", textInput.value), textInput.value = "");
    sent = !1;
    socket.emit("userTypingNotification", {
        status: "stopped",
        sender: socket.id
    })
});
sendPicBtn.addEventListener("click", function () {
    takeInput(0, 400, jsonifySend)
});
endChtBtn.addEventListener("click", function () {
    resetOnBeforeUnload();
    window.confirm("End the chat?") && (socket.emit("userWantsToLeave"), window.location = "/chatpage")
});
requestBtn.addEventListener("click", function () {
    socket.emit("userWantsToShareMedia")
});

function acceptMediaReq() {
    socket.emit("partnerConfirmsMediaShare")
};