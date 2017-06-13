$(function ()
{
    // Correctly decide between ws:// and wss://
    var ws_scheme = window.location.protocol == "https:" ? "wss" : "ws";
    var ws_path = ws_scheme + '://' + window.location.host + "/chat/stream/";
    console.log("Connecting to " + ws_path);
    var socket = new ReconnectingWebSocket(ws_path);

    // Helpful debugging
    socket.onopen = function ()
    {
        console.log("Connected to chat socket");
    };
    socket.onclose = function ()
    {
        console.log("Disconnected from chat socket");
    }
    socket.onmessage = function (message)
    {
        // Decode the JSON
        console.log("Got websocket message " + message.data);
        var data = JSON.parse(message.data);
        // Handle errors
        if (data.error)
        {
            alert(data.error);
            return;
        }






        // Handle joining
        if (data.join)
        {
            console.log("Joining room " + data.join);
            var roomdiv = $(
                "<div class='room' id='room-" + data.join + "'>" +
                "<h2>" + data.title + "</h2>" +
                "<div class='messages'></div>" +
                "<form><input><button>Send</button></form>" +
                "</div>"
            );
            roomdiv.find("form").on("submit", function ()
            {
                socket.send(JSON.stringify(
                {
                    "command": "send",
                    "room": data.join,
                    "message": roomdiv.find("input").val()
                }));
                roomdiv.find("input").val("");
                return false;
            });
            $("#chats").append(roomdiv);
            // Handle leaving
        }
        else if (data.leave)
        {
            console.log("Leaving room " + data.leave);
            $("#room-" + data.leave).remove();
        }
        else if (data.message || data.msg_type != 0)
        {
            var msgdiv = $("#room-" + data.room + " .messages");
            var ok_msg = "";
            // msg types are defined in chat/settings.py
            // Only for demo purposes is hardcoded, in production scenarios, consider call a service.
            switch (data.msg_type) {
                case 0:
                    // Message
                    ok_msg = "<div class='message'>" +
                        "<span class='username'>" + data.username + "</span>" +
                        "<span class='body'>" + data.message + "</span>" +
                        "</div>";
                    break;
                case 1:
                    // Warning/Advice messages
                    ok_msg = "<div class='contextual-message text-warning'>" + data.message + "</div>";
                    break;
                case 2:
                    // Alert/Danger messages
                    ok_msg = "<div class='contextual-message text-danger'>" + data.message + "</div>";
                    break;
                case 3:
                    // "Muted" messages
                    ok_msg = "<div class='contextual-message text-muted'>" + data.message + "</div>";
                    break;
                case 4:
                    // User joined room
                    ok_msg = "<div class='contextual-message text-muted'>" + data.username + " joined the room!" + "</div>";
                    break;
                case 5:
                    // User left room
                    ok_msg = "<div class='contextual-message text-muted'>" + data.username + " left the room!" + "</div>";
                    break;
                default:
                    console.log("Unsupported message type!");
                    return;
            }
            msgdiv.append(ok_msg);
            msgdiv.scrollTop(msgdiv.prop("scrollHeight"));
        }
        else
        {
            console.log("Cannot handle message!");
        }
    }


    inRoom = function (roomId)
    {
        return $("#room-" + roomId).length > 0;
    };
    // Room join/leave
    $("li.room-link").click(function ()
    {
        roomId = $(this).attr("data-room-id");
        if (inRoom(roomId))
        {
            // Leave room
            $(this).removeClass("joined");
            socket.send(JSON.stringify(
            {
                "command": "leave",  // determines which handler will be used (see chat/routing.py)
                "room": roomId
            }));
        }
        else
        {
            // Join room
            $(this).addClass("joined");
            socket.send(JSON.stringify(
            {
                "command": "join",
                "room": roomId
            }));
        }
    });
});
