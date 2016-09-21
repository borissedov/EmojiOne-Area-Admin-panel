Admin panel for Firebase
========================


Prerequisites
-------------
- [Git](http://git-scm.com/book/en/v2/Getting-Started-Installing-Git)
- [Node.js and NPM](https://nodejs.org/)
```
sudo apt-get install nodejs
sudo apt-get install npm
sudo apt-get install nodejs-legacy
```
- Serve NPM package (`sudo npm install -g serve`)

Setting up Firebase
-------------------
To run the app, you will need to set up an account with Firebase. Don't worry, it's free AND easy!

#### Get a Firebase Account
First, navigate to https://www.firebase.com/. Then you can do one of two things: you can sign up for an account with your email or, if you have a Github account, you can log in with those credentials.

#### Create an App
After you have logged in/signed  up, you will be taken to your dashboard. Go ahead and create a new app (call it whatever you want). After you click `CREATE NEW APP`, your app will appear in your dashboard.

#### Get your Firebase URL
Click `Manage App` on your newly minted Firebase app. Once you have transitioned to the new page, copy the URL from the address bar. It should look like `https://<your-app-name>.firebaseio.com/`.

#### Put the URL in the app
Now open up your code editor, navigate to `js/app.js`, and replace the `FIREBASE_URI` constant with your Firebase URL. Firebase is now ready to go!

Running the App
---------------
Now go back to your terminal, make sure you are in the `root` directory, and then run `serve`. In your browser, navigate to `http://localhost:3000`. Boom! The app is now running. Read on for a tour of the app.

Documentation
-----------

#### Firebase JavaScript API reference
https://www.firebase.com/docs/web/api/
