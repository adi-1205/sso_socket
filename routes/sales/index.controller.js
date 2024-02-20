module.exports.getPlan = (req, res, next)=>{

    try {

        res.render('sales/plan',{
            isAuth: req.session?.user,
            planPage: true
        })
        
    } catch(err){
        console.log(err)
        return ReE(res, { message: 'something went wrong' }, 400)
        //res.status(400).json({message:'something went wrong'})
    }
}