$(document).ready(function () {

    const ROOM_LIST_LIMIT = 5

    $('#show-password').click(togglePassword)
    $('#login-btn').click(handleLoginBtnClick)
    $('#register-btn').click(handleRegisterBtnClick)
    $('#open-create-room-form-btn').click(handleOpenRoomBtnClick)
    $('#create-room-btn').click(handleCreateRoomBtnClick)
    $(document).on('click', '.copy-access-code', handleCopyAccessCodeClick)
    $(document).on('click', '.remove-room-btns', handleRemoveRoomBtnClick)
    $(document).on('click', '.pagination a', handlePaginationLinkClick)
    paginationController();

})

function togglePassword() {
    if ($('#password').attr('type') == 'password') {
        $('#password').attr('type', 'text')
        $(this).text('hide')
    } else {
        $('#password').attr('type', 'password')
        $(this).text('show')
    }

}
async function handleLoginBtnClick() {
    try {
        $('#loading').css('display', 'inline-block')
        let formData = getFormData('email', 'password')

        if (!validateLogin()) return
        let data = await ajx('/auth/login', { formData })
        if (data.success) {
            window.location.href = '/'
        }
    } catch (err) {
        console.log(err);
        let { responseJSON: res } = err
        if (err.status == 400) {
            flashError('#form-help', res.message)
        }
    } finally {
        $('#loading').hide()
    }
}
async function handleRegisterBtnClick() {
    try {
        $('#loading').css('display', 'inline-block')
        let formData = getFormData('username', 'email', 'password')

        if (!validateRegistartion()) return
        $('#form-help').hide()
        let data = await ajx('/auth/register', { formData })
        if (data.success) {
            window.location.href = '/auth/login'
        }
    } catch (err) {
        console.log(err);
        let { responseJSON: res } = err
        if (err.status == 400) {
            flashError('#form-help', res.message)
        }
    } finally {
        $('#loading').hide()
    }
}
async function handleCreateRoomBtnClick() {
    try {
        let name = $('#create-room-name-inp').val()
        if (name !== '') {
            const data = await ajx('/chats/rooms', { formData: { name } })
            if (data.success) {
                $('#create-room-name-inp').val('')
                disposableMessage('.room-name-success', data.message)
            }
            let updateData = await ajx('/chats/rooms', { method: 'get' })
            let result = $(updateData).prop('outerHTML')
            $('#room-list').replaceWith(result)
            paginationController($(result).data('count'))
        } else {
            console.log('else');
            disposableMessage('.room-name-error', 'Room name can not be empty')
            console.log('else 2');
        }
    } catch (err) {
        console.log(err);
        let { responseJSON: res } = err
        if (err.status == 400) {
            disposableMessage('.room-name-error', res.message)
        }
    }
}
function handleCopyAccessCodeClick() {
    let code = $(this).data('text')
    navigator.clipboard.writeText(code)
    $(this).find('span').text('copied')
    setTimeout(() => {
        $(this).find('span').text('copy')
    }, 3000)
}
function handleOpenRoomBtnClick() {
    $('.create-room-form').fadeToggle()
    let icon = $(this).children()
    if (icon.data('arrow') == 'down') {
        $(this).children().removeClass('fa-angle-down')
        $(this).children().addClass('fa-angle-up')
        icon.data('arrow', 'up')
    } else {
        setTimeout(() => {
            $(this).children().removeClass('fa-angle-up')
            $(this).children().addClass('fa-angle-down')
            icon.data('arrow', 'down')
        }, 400)
    }
}
async function handlePaginationLinkClick(e) {
    e.preventDefault()
    try {
        let data = await ajx($(this)[0].href, { method: 'get' })
        let result = $(data).prop('outerHTML')
        $('#room-list').replaceWith(result)
        window.history.replaceState(null, null, $(this)[0].href)
        paginationController($(result).data('count'))
    } catch (err) {
        console.log(err);
    }
}
async function handleRemoveRoomBtnClick(e) {
    let access = $(this).data('access-code')
    try {
        const sure = confirm(`Are you sure? \nremoving room will result in deletion of chats!`)
        if (sure) {
            let data = await ajx(window.location.href, { method: 'delete', formData: { access } })
            $(this).closest('tr').remove()
            let count = $('#room-list').data('count')
            if ($('tr').length - 1 == 0) {
                console.log('triiger');
                let url = new URLHandler(window.location.href)
                if (url.hasParam('page')) {
                    url.setParam('page', +url.getParam('page') - 1)
                    window.history.pushState(null, null, url.href)
                }
                let updateData = await ajx(url.href, { method: 'get' })
                let result = $(updateData).prop('outerHTML')
                $('#room-list').replaceWith(result)
                paginationController($(result).data('count'))
            }
        }
    } catch (err) {
        console.log(err);
    }
}
const ajx = (url, { ...opt }) => {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: url,
            type: opt.method ? opt.method : 'post',
            data: JSON.stringify(opt.formData),
            contentType: 'application/json',
            success: (data) => {
                if (opt.cb) {
                    opt.cb()
                }
                resolve(data)
            },
            error: (err) => {
                console.log(err);
                reject(err)
                if (err.status == 500)
                    flashError('#error', 'Something went wrong, try again after sometime :(', true)
            }
        });
    })
}
const getFormData = (...fields) => {
    let formData = {}
    for (field of fields)
        formData[field] = $(`#${field}`).val()

    return formData
}
const validateRegistartion = () => {
    let email = $('#email').val()
    let username = $('#username').val()
    let password = $('#password').val()

    if (!username || !validator.isLength(username, { min: 3, max: 20 }) || !/^[a-zA-Z0-9_]*$/.test(username)) {
        flashError('#form-help', `username should be <li>3-20 chars long</li> should only contain<li>uppercase</li> <li>lowercase</li> <li>digit</li> <li>_(underscore)</li>`)
        return false
    }
    if (!email || !validator.isEmail(email)) {
        flashError('#form-help', 'email should be <li>non empty</li> <li>valid email address</li>')
        return false
    }
    if (!password || !password.length >= 8 || !validator.isStrongPassword(password)) {
        flashError('#form-help', 'password should be <li>min 8 chars long</li><li>contain atleast 1 uppercase</li> <li>contain atleast 1 lowercase</li> <li>contain atleast 1 digit</li> <li>contain atleast 1 symbol</li>')
        return false
    }

    return true
}
const validateLogin = () => {
    let email = $('#email').val()
    let password = $('#password').val()


    if (!email || !validator.isEmail(email)) {
        flashError('#form-help', 'email should be <li>non empty</li> <li>valid email address</li>')
        return false
    }
    if (!password) {
        flashError('#form-help', 'password should be non empty')
        return false
    }

    return true
}
const disposableMessage = (elem, msg) => {
    $(elem).html(msg).show()
    $(document).on('keypress.create-room mousedown.create-room', () => {
        $(elem).html('').hide()
        $(document).off('keypress.create-room mousedown.create-room')
    })
}
const flashError = (elem, err, hide = false) => {
    $(elem).html(err).show()
    if (hide) {
        setTimeout(() => {
            $(elem).html('').hide()
        }, 5000)
    }
}
class URLHandler {
    constructor(href) {
        this.href = href;
        const url = new URL(href);
        this.pathname = url.pathname
        this.params = Object.fromEntries(url.searchParams.entries());
    }

    hasParam(paramName) {
        return paramName in this.params;
    }

    getParam(paramName) {
        return this.params[paramName];
    }

    setParam(paramName, paramValue) {
        this.params[paramName] = paramValue;
        this.updateHref();
    }

    deleteParam(paramName) {
        delete this.params[paramName];
        this.updateHref();
        return this.href
    }

    updateHref() {
        const searchParams = new URLSearchParams(this.params);
        const newHref = (searchParams.size
            ?
            this.href.split("?")[0] + "?" + searchParams.toString() + "&"
            :
            this.href.split("?")[0] + "?" + searchParams.toString()
        )
        this.href = newHref;
    }
}
function paginationController(totalCount = false) {
    let url = new URLHandler(window.location.href)
    let currentPage = url.getParam('page') || 1
    if (url.pathname.match(/\/chats\/rooms\/?/i)) {
        let count = totalCount || $('#room-list').data('count')
        var paginator = pagination.create('search', {
            prelink: url.deleteParam('page'),
            current: currentPage,
            rowsPerPage: url.getParam('limit') || 5,
            totalResult: count
        });
        let pageData = paginator.getPaginationData()
        let pageHtml = `<ul class="pagination justify-content-center">`
        pageHtml += `<li class="page-item ${pageData.previous ? '' : 'disabled'}">
                <a class="page-link" href="${pageData.previous ? pageData.prelink + 'page=' + pageData.previous : '#'}">Previous</a>
            </li>`
        for (n of pageData.range) {
            pageHtml += `<li class="page-item ${n == pageData.current ? 'active' : ''}">
            <a class="page-link " 
            href="${pageData.prelink + 'page=' + n} ">
            ${n}
            </a>
            </li>`
        }
        pageHtml += `<li class="page-item ${pageData.next ? '' : 'disabled'}">
                <a class="page-link" href="${pageData.next ? pageData.prelink + 'page=' + pageData.next : '#'}">Next</a>
            </li>`

        $('#pagination-area').html('').html(pageHtml)
    }
}