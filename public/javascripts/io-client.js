$(document).ready(function () {
    let authCookie = document.cookie.match(/auth=([^;]+)/i)
    let authToken = authCookie ? authCookie[1] : ''
    const socket = io(window.location.host, {
        auth: {
            token: authToken
        }
    })

    $('#send-msg').click(function () {
        let msg = $('#msg').val()
        if (msg !== '') {
            socket.emit('client', msg)

            let date = new Date()
            let [hr, min] = [date.getHours(), date.getMinutes()]
            let p = $('</p>').attr('class', 'message me')
            $(p).html(`<span class='message-text text-start '>${msg}</span> <span class="message-time">${hr + ':' + min}</span>`)
            $('.messages').append(p)
            $('#msg').val('')
            $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
            $('#send-msg').blur()
        }
    })

    socket.on('server', (msg) => {
        let date = new Date()
        let [hr, min] = [date.getHours(), date.getMinutes()]
        let p = $('</p>').attr('class', 'message other')
        $(p).html(`<span class='message-text'>${msg}</span> <span class="message-time">${hr + ':' + min}</span>`)
        $('.messages').append(p)
        $('.message-area').scrollTop($('.message-area').prop('scrollHeight'))
    })

    socket.on('error', (error) => {
        console.log(error);
    })
})


