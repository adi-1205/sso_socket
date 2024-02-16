module.exports.getIndex = async (req, res, next) => {

    try {
        res.render('index', {
            isAuth: req.session?.user,
            homePage:true
        })
    } catch (err) {
        console.log(err)
        ReE(res, { message: 'something went wrong' }, 400)
    }
}