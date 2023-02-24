const express = require('express');
const emailValidator = require("deep-email-validator")
const cors = require("cors");
const multiparty = require("multiparty");
const path = require("path");
const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname,"../index.html")));

app.get('*',function(req,res){
    res.sendFile(path.join(__dirname,"../index.html"))
})
//function for email validation
const isEmailValid = async (email) => {
    return emailValidator.validate(email)
}

//1) route for csv files email validation
app.post("/validationCsv", async (req, res) => {
    try {
        let data = req.body.data
        let results = {
            reasons: []
        }
        for (let email of data) {
            const { valid, reason, validators } = await isEmailValid(email.Email);
            let result = { valid, reason, validators, email: email.Email }
            results.reasons.push(result)
        }
        res.status(200).json(results)
    } catch (error) {
        console.log(error);
        res.status(500).send("internal server error")
    }

})

//2) route for single email validation
app.post("/validation", async (req, res) => {
    try {
        const { valid, reason, validators } = await isEmailValid(req.body.email);
        let result = { valid, validators, reason }
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).send("internal server error")
    }

})

app.listen(port, () => {
    console.log(`Your backend run on : http://localhost:${port}`);
})