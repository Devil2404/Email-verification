const express = require('express');
const emailValidator = require("deep-email-validator")
const cors = require("cors");
const multiparty = require("multiparty");
const path = require("path");
const dns = require('dns');
const app = express();
const Verifier = require("email-verifier");
const fetch = require('node-fetch');
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cors({ origin: "*" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "../index.html")));

// app.get('*', function (req, res) {
//     res.sendFile(path.join(__dirname, "../index.html"))
// })

const disposableEmail = async (email) => {
    const url = `https://disposable.debounce.io/?email=${email}`;
    const options = { method: 'GET', headers: { accept: 'application/json' } };
    let res = await fetch(url, options);
    let data = await res.json()
    if (data.disposable === "false")
        return false
    return true
}

const mxRecords = async (email) => {
    const domain = email.split('@')[1];
    try {
        const mxRecords = await dns.promises.resolveMx(domain);
        if (mxRecords[0].exchange !== "")
            return true
        else
            return false
    } catch (error) {
        console.error(`Error resolving MX records for ${domain}:`, error);
    }
}

const smtpCheck = async (email) => {
    let verifier = new Verifier("at_Yzx1IFB6edjbrRtxDaIe3mRSnpHYW", {
        checkFormate: false,
        checkCatchAll: false,
        checkDisposable: false,
        checkFree: false,
        validateAudit: false,
        validateDNS: false,
        validateSMTP: true
    });
    verifier.verify(email, async (err, data) => {
        if (err) throw err;
        let x = await data.smtpCheck
        if (x === "false")
            return false;
        else
            return true;
    });

}

const isRoleBasedEmail = (email) => {
    const roleEmailPattern = /^(postmaster|abuse|admin|billing|support|sales)\b/i;
    return roleEmailPattern.test(email);
}

//function for email validation
const isEmailValid = async (email) => {
    let result = {}
    const { reason } = emailValidator.validate(email)
    if (reason !== "regex") {
        let smtp = await smtpCheck(email)
        result = {
            regex: { valid: true },
            disposable: { valid: await disposableEmail(email) },
            mx: { valid: await mxRecords(email) },
            roleBase: { valid: isRoleBasedEmail(email) },
            smtp: { valid: smtp }
        }
    }
    else {
        result = {
            regex: { valid: false },
            disposable: { valid: false },
            mx: { valid: false },
            roleBase: { valid: false },
            smtp: { valid: false }
        }
    }
    return result
}

//1) route for csv files email validation
app.post("/validationCsv", async (req, res) => {
    try {
        let data = req.body.data
        let results = {
            reasons: []
        }
        for (let email of data) {
            const test = await isEmailValid(email.Email);
            let result = { test, email: email.Email }
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
        let result = await isEmailValid(req.body.email);
        res.status(200).json(result)
    } catch (error) {
        console.log(error);
        res.status(500).send("internal server error")
    }
})

app.listen(port, () => {
    console.log(`Your backend run on : http://localhost:${port}`);
})