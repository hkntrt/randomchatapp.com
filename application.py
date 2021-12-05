from flask import Flask, render_template, request, session, send_file, make_response, send_from_directory, redirect, url_for
from flask_socketio import SocketIO, send, emit, join_room, leave_room
from datetime import datetime
from os import path
from os import environ
from flask_sqlalchemy import SQLAlchemy
import smtplib
import uuid
import time

app = Flask(__name__)
app.config["SECRET_KEY"] = "********"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + \
    environ["HOME"] + "/site.db"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
socketio = SocketIO(app)
db = SQLAlchemy(app)


class Message(db.Model):
    id = db.Column(db.Integer,  primary_key=True)
    chat_id = db.Column(db.String(), nullable=False)
    ip_addr = db.Column(db.String(), nullable=False)
    message = db.Column(db.String(), nullable=False)
    date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


if path.exists("///" + environ["HOME"] + "/site.db") == False:
    db.create_all()

list_of_msgs = []


def commit_to_db():
    #add messsages to db only if there are more than 200 due to performance reasons.
    global list_of_msgs
    if len(list_of_msgs) >= 200:
        for i in list_of_msgs:
            db.session.add(i)
        db.session.commit()
        list_of_msgs = []


@app.route('/')
@app.route("/home")
def index():
    return render_template("home.html", title="randomchatapp.com")


@app.route("/chatpage")
def chatpage():
    response = make_response(render_template(
        "prechat.html", title="Chat Rules-randomchatapp.com"))
    response.set_cookie("pcpv", "true")
    return response


@app.route("/chat")
def chat():
    pcpv = request.cookies.get("pcpv")
    if pcpv == "true":
        response = make_response(render_template(
            "chat.html", title="Chat-randomchatapp.com"))
        response.set_cookie("pcpv", "false")
        return response
    else:
        return redirect(url_for("chatpage"))


@app.route("/blog")
def blog():
    return render_template("blog.html", title="Blog-randomchatapp.com")


@app.route("/about")
def about():
    return render_template("about.html", title="About-randomchatapp.com")


@app.route("/contact")
def contact():
    return render_template("contact.html", title="Contact-randomchatapp.com")


@app.route("/contactdata",  methods=["POST"])
def contactdata():
    #smtp login needs an email account, that's the cheapest solution.
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
            smtp.login("***********@gmail.com", "********")
            subject = "subject: " + \
                request.form["subject"] + " sender: " + request.form["email"]
            body = request.form["message"]
            msg = f"Subject: {subject}\n\n{body}"
            smtp.sendmail("****************@gmail.com",
                          "**********@gmail.com", msg)
        return render_template("messagesent.html", title="Successful")
    except Exception as e:
        return render_template("messagefailed.html", title="Try again")


@app.route("/offline")
def offline():
    return render_template("offline.html", title="Offline-randomchatapp.com")


@app.route("/privacy")
def privacy():
    return render_template("privacy.html", title="Privacy-randomchatapp.com")


@app.errorhandler(404)
def page_not_found(e):
    return render_template('404.html'), 404


@app.route("/service-worker.js")
def sw():
    response = make_response(
        send_from_directory("static", filename="service-worker.js"))
    response.headers["Content-Type"] = "application/javascript"
    return response


@app.route("/.well-known/assetlinks.json")
def assetlink():
    response = make_response(
        send_from_directory("static", filename="assetlinks.json"))
    return response


class Room:
    def __init__(self, room_id):
        self.room_id = room_id
        self.users = []
        self.is_room_marked_for_deletion = False
        self.is_media_share_enabled = False

    def add_user(self, user_id):
        if self.number_of_users < 2:
            self.users.append(user_id)
            session["room"] = self.room_id
            join_room(self.room_id)
            self.send_notification("greet", request.sid)
        if self.number_of_users == 2:
            self.send_notification("matched", session["room"])

    @property
    def number_of_users(self):
        return len(self.users)

    def remove_user(self, user_id):
        self.users.remove(user_id)

    def find_partner_id(self, user_id):
        if len(self.users) == 2:
            if self.users[0] == user_id:
                return self.users[1]
            else:
                return self.users[0]

    def send_notification(self, notiType, target):
        emit("notification", notiType, room=target)

    def disconnect_user(self, sid):
        try:
            self.send_notification("compLeft", self.find_partner_id(sid))
            self.send_notification("ended", sid)
            leave_room(sid)
            leave_room(self.find_partner_id(sid))
        except Exception as e:
            pass

    def enable_media_share(self):
        self.send_notification("perAcq", self.room_id)
        self.is_media_share_enabled = True


class Rooms:
    def __init__(self):
        self.rooms = {}

    def create_room(self):
        room_id = uuid.uuid4().hex
        self.rooms[room_id] = Room(room_id)
        return self.rooms[room_id]

    def is_room_alive(self, room_id):
        if room_id in self.rooms:
            return True
        return False

    def find_room(self):
        """ find a waiting room or create one and return it"""
        for room_id in self.rooms:
            if self.rooms[room_id].number_of_users == 1:
                return self.rooms[room_id]
        return self.create_room()

    def add_user_to_a_room(self, sid):
        self.find_room().add_user(sid)

    def ask_media_share(self, room_id, user_id):
        self.rooms[room_id].send_notification(
            "accReq", self.rooms[room_id].find_partner_id(user_id))

    def enable_media_share(self, room_id):
        self.rooms[room_id].send_notification("perAcq", room_id)
        self.rooms[room_id].is_media_share_enabled = True

    def disconnect(self, room_id, sid):
        try:
            self.rooms[room_id].disconnect_user(sid)
            del self.rooms[room_id]
        except Exception as e:
            pass


reception = Rooms()


@socketio.on("message")
def message(data):
    global list_of_msgs
    if data["type"] == "picture" or data["type"] == "sound":
        if reception.rooms[session["room"]].is_media_share_enabled:
            send(data, room=session["room"])
        else:
            reception.rooms[session["room"]].send_notification(
                "perErr", request.sid)
    elif data["type"] == "text":
        msg = Message(chat_id=str(session["room"]), ip_addr=str(
            request.remote_addr), message=str(data["data"]))
        list_of_msgs.append(msg)
        send(data, room=session["room"])


@socketio.on("userWantsToShareMedia")
def userWantsToShareMedia():
    reception.ask_media_share(session["room"], request.sid)


@socketio.on("userTypingNotification")
def userTypingNotification(data):
    emit("userTypingNotification", data, room=session["room"])


@socketio.on("partnerConfirmsMediaShare")
def partnerConfirmsMediaShare():
    reception.enable_media_share(session["room"])


@socketio.on("userWantsToLeave")
def userWantsToLeave():
    disconnect()


@socketio.on("connect")
def connect():
    reception.add_user_to_a_room(request.sid)


@socketio.on("disconnect")
def disconnect():
    reception.disconnect(session["room"], request.sid)
    commit_to_db()
