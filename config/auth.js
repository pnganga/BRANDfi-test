// config/auth.js


// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : 'xxxxxxxxxxxxxxxxxx', // your App ID
        'clientSecret'    : 'xxxxxxxxxxxxxxxxxx', // your App Secret
        'callbackURL'     : 'https://localhost:3000/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'xxxxxxxxxxxxxxxxxx',
        'consumerSecret'     : 'xxxxxxxxxxxxxxxxxx',
        'callbackURL'        : 'https://uourserver:8181/auth/twitter/callback'
    }
    // },

    // 'linkedinAuth' : {
    //     'consumerKey'        : 'xxxxxxxxxxxxxxxxxx',
    //     'consumerSecret'     : 'xxxxxxxxxxxxxxxxxx',
    //     'callbackURL'        : 'https://localhost:3000/auth/linkedin/callback'
    // },

    // 'googleAuth' : {
    //     'clientID'         : 'xxxxxxxxxxxxxxxxxx',
    //     'clientSecret'     : 'xxxxxxxxxxxxxxxxxx',
    //     'callbackURL'      : 'https://localhost:3000/auth/google/callback'
    // }

};
