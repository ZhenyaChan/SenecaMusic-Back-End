const express = require('express');
const cors = require("cors");
const jwt = require('jsonwebtoken');
const passport = require("passport");
const passportJWT = require("passport-jwt");
const dotenv = require("dotenv");

dotenv.config();

const userService = require("./user-service.js");

const app = express();

const HTTP_PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(cors());

var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;

var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme("jwt");
jwtOptions.secretOrKey = process.env.JWT_SECRET;

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    console.log('payload received', jwt_payload);
    if (jwt_payload) {
        next(null, { 
            _id: jwt_payload._id, 
            userName: jwt_payload.userName
        }); 
    } else {
        next(null, false);
    }
});

passport.use(strategy);

app.use(passport.initialize());

/* TODO Add Your Routes Here */
app.post("/api/user/register", (req, res) => {
    userService.registerUser(req.body).then(msg => {
        res.json({"message": msg});
    }).catch(err => {
        res.status(422).json({"message": err});
    });
});

app.post("/api/user/login", (req, res) => {
    userService.checkUser(req.body).then(user => {
        let tokenPayload = {
            _id: user._id,
            userName: user.userName
        };
        let JWTtoken = jwt.sign(tokenPayload, jwtOptions.secretOrKey);
        res.json({"message": `user: ${user.userName} logged in!`, "token": JWTtoken});
    }).catch(err => {
        res.status(422).json({"message": err});
    });
});

app.get("/api/user/favourites", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.getFavourites(req.user._id).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.json({"error": err});
    });
});

app.put("/api/user/favourites/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.addFavourite(req.user._id, req.params.id).then((data) => {
        res.json(data);
    }).catch((err) => {
        res.json({"error": err});
    });
});

app.delete("/api/user/favourites/:id", passport.authenticate('jwt', {session: false}), (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id).then((data) => {
        res.status(200).json(data);
    }).catch((err) => {
        res.json({"error": err});
    });
});


userService.connect()
.then(() => {
    app.listen(HTTP_PORT, () => { console.log("API listening on: " + HTTP_PORT) });
})
.catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
});