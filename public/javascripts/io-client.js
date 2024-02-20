$(document).ready(function () {
    let authCookie = document.cookie.match(/auth=([^;]+)/i)
    let authToken = authCookie ? authCookie[1] : ''
    let usernameCookie = document.cookie.match(/username=([^;]+)/i)
    let thisUsername = usernameCookie ? decodeURI(usernameCookie[1]) : ''
    window.locals = {
        username: thisUsername
    }
    let room = window.location.href.split('/').at(-1)

    const socket = io(window.location.host, {
        auth: {
            token: authToken
        }
    })

    $('#msg').focus()

    $('#file-input-btn').click(handleFileInputClick)

    $('#send-msg').click(handleSendMsgClick)

    $('#msg').keypress(handleMsgKeypress)

    socket.emit('join room', {
        room,
        username: username
    })
    socket.on('server', (payload) => {
        updateGetMessageUI(payload)
    })
    socket.on('user joined', (payload) => {
        updateUserJoinedUI(payload.username)
        updateActiveUserUI(payload.users)
    })
    socket.on('user left', (payload) => {
        updateUserLeftUI(payload.username)
        updateActiveUserUI(payload.users)
    })
    socket.on('active users', (payload) => {
        updateActiveUserUI(payload.users)
    })
    socket.on('error', (error) => {
        handleSocketError(error)
    })
})


function handleSendMsgClick() {
    let msg = $('#msg').val()
    if (msg !== '') {
        updateSendMessageUI(msg)
        socket.emit('message', { message: msg, username: username, time: getHourMinuteObject(), room })
    }
}
function handleMsgKeypress(e) {
    if (e.key == 'Enter') {
        $('#send-msg').click()
    }
}
username

function getHourMinute() {
    let date = new Date()
    return [date.getHours(), date.getMinutes()]
}
function getHourMinuteObject() {
    let date = new Date()
    return { hrs: date.getHours(), min: date.getMinutes() }
}
function updateSendMessageUI(msg) {
    let [hr, min] = getHourMinute()
    let p = $('</p>').attr('class', 'message me')
    $(p).html(`
            <span class='message-by'>You</span> 
            <span class='message-text text-start '>${msg}</span> 
            <span class="message-time">${hr + ':' + min}</span>
            `)
    $('.messages').append(p)
    $('#msg').val('')
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateGetMessageUI(payload) {
    let p = $('</p>').attr('class', 'message other')
    $(p).html(`<span class="message-by">${capitalize(payload.username)}</span><span class='message-text'>${payload.message}</span> <span class="message-time">${payload.time.hrs + ':' + payload.time.min}</span>`)
    $('.messages').append(p)
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateUserJoinedUI(username) {
    let p = $('</p>').attr('class', 'message p-2 bg-info-subtle text-center rounded-1')
    $(p).html(`${capitalize(username)} joined the chat`)
    $('.messages').append(p)
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateUserLeftUI(username) {
    let p = $('</p>').attr('class', 'message p-2 bg-info-subtle text-center rounded-1')
    $(p).html(`${capitalize(username)} left the chat`)
    $('.messages').append(p)
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateActiveUserUI(users) {
    let onlineUsersList = $('.online-user-list .row')
    onlineUsersList.empty()
    users.forEach(user => {
        if (user != window.locals.username) {
            onlineUsersList.append(`<div class="online-user col-md-4">
            <div class="online-user-profile">
                ${user[0].toUpperCase()}</div>
                <div class="online-user-name text-center">
                    ${capitalize(user)}
                </div>
            </div>`
            )
        } else {
            onlineUsersList.prepend(`<div class="online-user col-md-4">
            <div class="online-user-profile">${window.locals.username[0].toUpperCase()}</div>
                <div class="online-user-name text-center">You
                </div>
            </div>`
            )
        }
    });
}
function handleSocketError(error) {
    console.log(error);
    $('#error').html(error.message).show()
    setTimeout(() => {
        $('#error').empty().hide()
    }, 5000)
}
function capitalize(s) {
    return s[0].toUpperCase() + s.slice(1);
}

function handleFileInputClick() {
    $('#file-input').fadeToggle()
}

