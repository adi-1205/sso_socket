$(document).ready(function () {

    let MESSAGES_PAGE = 2

    let userCookie = document.cookie.match(/user=([^;]+)/i)
    let userInfoString = userCookie ? decodeURIComponent(userCookie[1]) : '{}'
    let userInfo = JSON.parse(userInfoString)
    let room = window.location.href.split('/').at(-1)
    window.locals = {
        username: userInfo.username,
        user_id: userInfo.uid,
        room: room
    }

    const socket = io(window.location.host)

    $('#msg').focus()

    $('#file-input-btn').click(handleFileInputClick)

    $('#send-msg').click(function (e) { handleSendMsgClick(e, socket, room) })

    $('#msg').keypress(handleMsgKeypress)

    $('.message-area').scroll(function () {
        if ($(this).scrollTop() < 30) {
            socket.emit('get extra messages', { page: MESSAGES_PAGE, room })
            MESSAGES_PAGE += 1
        }
    })

    $(document)
        .on('mousedown', '.me .message-text', function (e) { handleUserMessageMouseDown(this, socket) })
        .on('mouseup', '.me', handleUserMessageMouseUp)

    socket.emit('join room', {
        room
    })
    socket.on('sent message id', (msg, chat_id) => {
        updateSendMessageUI(msg, chat_id)
    })
    socket.on('server', (payload) => {
        updateGetMessageUI(payload)
        socket.emit('mark seen', [payload.chat_id])
    })
    socket.on('server image', (payload) => {
        updateGetImageMessageUI(payload)
    })
    socket.on('user joined', (payload) => {
        updateUserJoinedUI(payload.username)
        updateActiveUserUI({ users: payload.users })
    })
    socket.on('user left', (payload) => {
        updateUserLeftUI(payload.username)
        updateActiveUserUI({ users: payload.users })
    })
    socket.on('active users', (payload) => {
        updateActiveUserUI({ users: payload.users })
    })
    socket.on('preveious chats', (payload) => {
        updatePreviousChatsUI(payload, scroll = true, socket)
    })
    socket.on('retrieve preveious chats', (payload) => {
        updatePreviousChatsUI(payload)
    })
    socket.on('seen by users', (seenByUsers) => {
        console.log(seenByUsers);
        $('#tooltip .unames').empty()
        for (let { seen, username } of seenByUsers) {
            if (username === false) continue
            if (seen) {
                $('#tooltip .unames').prepend(`<div class="uname">${capitalize(username)}</div>`)
            } else {
                $('#tooltip .unames').append(`<div class="uname not-seen">${username}</div>`)
            }
        }
    })
    socket.on('error', (error) => {
        handleSocketError(error)
    })
})

function updatePreviousChatsUI(chats, scroll = false, socket) {
    let chat_ids = []
    for (let chat of chats) {
        if (chat.username == 'You') {
            let p = $('</p>').attr('class', 'message me')
            $(p).html(`
            <span class='message-by'>You</span> 
            <span class='message-text text-start' data-id=${chat.id}>${chat.message}</span> 
            <span class="message-time">${chat.time.hrs + ':' + chat.time.mins}</span>
            `)
            $('.messages').prepend(p)
        } else {
            let p = $('</p>').attr('class', 'message other')
            $(p).html(`
            <span class='message-by'>${chat.username}</span> 
            <span class='message-text text-start '>${chat.message}</span> 
            <span class="message-time">${chat.time.hrs + ':' + chat.time.mins}</span>
            `)
            $('.messages').prepend(p)
            chat_ids.push(chat.id)
        }
    }
    socket.emit('mark seen', chat_ids)
    if (scroll)
        $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}

function handleUserMessageMouseDown(elem, socket) {
    socket.emit('get seen by', $(elem).data('id'), window.locals.room)
    $('.for-tool-tip-space').removeClass('col-md-9')
    $('.for-tool-tip-space').addClass('col-md-6')
    $('#tooltip').fadeIn()
}

function handleUserMessageMouseUp() {
    $('#tooltip').hide()
    $('.for-tool-tip-space').removeClass('col-md-6')
    $('.for-tool-tip-space').addClass('col-md-9')
}

function handleSendMsgClick(e, socket, room) {
    let msg = $('#msg').val()
    if (!$('#file-input').hasClass('hidden')) {
        let reader = new FileReader()
        reader.addEventListener('load', () => {
            let imgDataUrl = reader.result
            socket.emit('message image', { message: imgDataUrl, username: window.locals.username, time: getHourMinuteObject(), room })
            updateSendImageMessageUI(imgDataUrl)
        }, false)
        let file = $('#file-input')[0].files[0];
        if (file && /\.(jpe?g|png|gif)$/i.test(file.name)) {
            if (file.size > 1024 * 1024 * 8) {
                return handleSocketError({ message: 'File size shoulb be less then 8MB' })
            }
            reader.readAsDataURL(file);
        }
        return
    }
    if (msg !== '') {
        // updateSendMessageUI(msg)
        socket.emit('message', { message: msg, username: window.locals.username, time: getHourMinuteObject(), room })
    }
}

function handleMsgKeypress(e) {
    if (e.key == 'Enter') {
        $('#send-msg').click()
    }
}

function getHourMinute() {
    let date = new Date()
    return [date.getHours(), date.getMinutes()]
}
function getHourMinuteObject() {
    let date = new Date()
    return { hrs: date.getHours(), min: date.getMinutes() }
}
function updateSendMessageUI(msg, chat_id) {
    let [hr, min] = getHourMinute()
    let p = $('</p>').attr('class', 'message me')
    $(p).html(`
            <span class='message-by'>You</span> 
            <span class='message-text text-start' data-id=${chat_id}>${msg}</span> 
            <span class="message-time">${hr + ':' + min}</span>
            `)
    $('.messages').append(p)
    $('#msg').val('')
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateSendImageMessageUI(imgDataUrl) {
    let [hr, min] = getHourMinute()
    let p = $('</p>').attr('class', 'message me')
    $(p).html(`
            <span class='message-by'>You</span> 
            <span class="text-start message-text">
                <img class="img-fluid" src="${imgDataUrl}" alt="">
            </span>
            <span class="message-time">${hr + ':' + min}</span>
            `)
    $('.messages').append(p)
    $('#msg').val('')
    $('#file-input').val('')
    $('#file-input').fadeOut()
    $('#file-input').toggleClass('hidden')
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateGetMessageUI(payload) {
    let p = $('</p>').attr('class', 'message other')
    $(p).html(`<span class="message-by">${capitalize(payload.username)}</span><span class='message-text'>${payload.message}</span> <span class="message-time">${payload.time.hrs + ':' + payload.time.min}</span>`)
    $('.messages').append(p)
    $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
}
function updateGetImageMessageUI(payload) {
    let p = $('</p>').attr('class', 'message other')
    $(p).html(`<span class="message-by">${capitalize(payload.username)}</span><span class="text-start message-text"><img class="img-fluid" src="${payload.message}" alt=""></span> <span class="message-time">${payload.time.hrs + ':' + payload.time.min}</span>`)
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
function updateActiveUserUI({ users }) {
    let onlineUsersList = $('.online-user-list .row')
    onlineUsersList.empty()
    let user_id = window.locals.user_id
    users.forEach(user => {
        if (user.user_id != user_id) {
            onlineUsersList.append(`<div class="online-user col-md-4">
            <div class="online-user-profile">
                ${user.username[0].toUpperCase()}</div>
                <div class="online-user-name text-center">
                    ${capitalize(user.username)}
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
    $('#file-input').toggleClass('hidden')
}

