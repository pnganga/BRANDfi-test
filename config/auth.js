// config/auth.js


// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '142194479692082', // your App ID
        'clientSecret'    : '05ca64e63c0d7036cf0045f3f8eade41', // your App Secret
        'callbackURL'     : 'https://demo.brandfi.co.ke/auth/facebook/callback'
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
