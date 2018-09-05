// config/auth.js


// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'        : '142194479692082', // your App ID
        'clientSecret'    : '05ca64e63c0d7036cf0045f3f8eade41', // your App Secret
        'callbackURL'     : 'https://demo.brandfi.co.ke/auth/facebook/callback'
    },

    'twitterAuth' : {
        'consumerKey'        : 'rNaoWOUTS1HaP1GR8kDV5UgQx',
        'consumerSecret'     : 'BTAeOVPCk0rrL5XT4rK0w7ZOhVXCJusrY4EHCNUQtz4AYh0J7i',
        'callbackURL'        : 'https://demo.brandfi.co.ke/auth/twitter/callback'
    },
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
      'merakiAuth' : {
        'APIkey'     : '205f3df9cdb44e7b1c5f427f6bde3d61d0cdeb6c',
        'callbackURL'        : 'https://demo.brandfi.co.ke/click'
    }
};