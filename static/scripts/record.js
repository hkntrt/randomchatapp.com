var soundBlob, recordBtn = document.getElementById("recordBtn"),
    sendRcrBtn = document.getElementById("sendRecordBtn");
sendRcrBtn.disabled = !0;
var recordBtnState = "record";

function sleep(b) {
    return new Promise(function (a) {
        return setTimeout(a, b)
    })
}
if (navigator.mediaDevices) {
    var changeColor = function () {
            recordBtn.style.backgroundColor = "rgb(50, 152, 220)" === recordBtn.style.backgroundColor ? "red" : "rgb(50, 152, 220)"
        },
        constraints = {
            audio: !0
        },
        chunks = [],
        checker = !0,
        counter = 9,
        id;
    navigator.mediaDevices.getUserMedia(constraints).then(function (b) {
        var a = new MediaRecorder(b);
        a.audioBitsPerSecond = 6E3;
        recordBtn.addEventListener("click", function () {
            "record" === recordBtnState ? "inactive" === a.state && (a.start(), changeColor(), id = setInterval(function () {
                recordBtn.querySelector("img").src =
                    "static/img/stop.png";
                changeColor();
                0 == counter && (a.stop(), clearInterval(id), counter = 10);
                counter--
            }, 1E3), recordBtnState = "stop") : "stop" === recordBtnState && "recording" === a.state && (a.stop(), recordBtn.querySelector("img").src = "static/img/record.png", clearInterval(id), counter = 9)
        });
        a.onstop = function (a) {
            recordBtn.disabled = !0;
            a = document.createElement("audio");
            a.setAttribute("controls", "");
            a.style.width = "15em";
            a.controls = !0;
            a = new Blob(chunks, {
                type: "audio/ogg; codecs=opus"
            });
            chunks = [];
            soundBlob = a;
            recordBtnState =
                "record";
            recordBtn.querySelector("img").src = "static/img/record.png";
            recordBtn.style.backgroundColor = "rgb(50, 152, 220)";
            setTimeout(function () {
                recordBtn.disabled = !1
            }, 2E3);
            sendRcrBtn.disabled = !1
        };
        a.ondataavailable = function (a) {
            chunks.push(a.data)
        }
    })["catch"](function (b) {
        console.log(b)
    })
}
sendRcrBtn.addEventListener("click", function () {
    jsonifySend("sound", soundBlob);
    sendRcrBtn.disabled = !0
});