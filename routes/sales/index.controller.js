const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

module.exports.getPlan = async (req, res, next) => {

    try {

        // const customers = await stripe.customers.list()
        // console.log(customers);

        const token = await stripe.tokens.create({
            card: {
                number: '4242424242424242',
                exp_month: '5',
                exp_year: '2024',
                cvc: '314',
            },
        });
        

        res.render('sales/plan', {
            isAuth: req.session?.user,
            planPage: true
        })

    } catch (err) {
        console.log(err)
        return ReE(res, { message: 'something went wrong' }, 400)
        //res.status(400).json({message:'something went wrong'})
    }
}