const uploadButton = document.getElementById("uploadButton")
const uploadFile = document.getElementById("uploadFile")
const verifyButton = document.getElementById("verify")
const singleEmail = document.getElementById("singleEmail")
const singleResult = document.getElementById("singleResult")
const doubleEmail = document.getElementById("doubleEmail")
const downloadButton = document.getElementById("download")
let csv = {
    fields: ["Emails", "valid"],
    data: []
};

// event listner for file upload and convert csv to json 
uploadButton.addEventListener("click", () => {
    if (uploadFile.files.length === 0) {
        alert("Please select a file")
    }
    else {
        Papa.parse(uploadFile.files[0],
            {
                download: true,
                header: true,
                skipEmptyLines: true,
                complete: function (results) {
                    sendCsvEmail(results)
                }
            })
        alert("Your file is succefully uploaded")
        uploadFile.value = ""
    }
})

//event listner for single email 
verifyButton.addEventListener("click", () => {
    if (singleEmail.value.length === 0) {
        alert("Please enter a email")
    }
    else {
        alert("your email is verified in few minutes")
        let result = {
            email: singleEmail.value
        }
        singleEmail.value = ""
        sendEmail(result)
    }
})


// sending emails to backend for validation from csv file
const sendCsvEmail = (mail) => {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/validationCsv")
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = () => {
        emailResult(JSON.parse(xhr.response), "d")
    }
    xhr.send(JSON.stringify(mail));
    alert("Your csv file is sent to Backend")
}

//sending eamil to backend for verification
const sendEmail = (mail) => {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", "http://localhost:5000/validation")
    xhr.setRequestHeader('content-type', 'application/json');
    xhr.onload = () => {
        emailResult(JSON.parse(xhr.response), "s")
    }
    xhr.send(JSON.stringify(mail));
}

//innerHtml generate
const stringgenerator = (id, result) => {
    const { disposable, mx, smtp, regex, typo } = result.validators
    let str = `
    ${smtp.reason === "Timeout" ? "Valid Email" : "Not valid Email"}
    <br/>
    Reason : ${result.reason}
    <li style="color:${!regex.valid ? "red" : "green"}">Regex : ${regex.valid}</li>
    <li style="color:${!disposable.valid ? "red" : "green"}">Disposable : ${disposable.valid}</li>
    <li style="color:${!typo.valid ? "red" : "green"}">Typo : ${typo.valid}</li>
    <li style="color:${!mx.valid ? "red" : "green"}">mx : ${mx.valid}</li>
    <li style="color:${!smtp.valid ? "red" : "green"}">SMTP : ${smtp.valid} <br/>
    Reason is ${smtp.reason}.
    </li>  
    `
    return str
}

// for showing result on page
const emailResult = (result, id) => {
    if (id === "s") {
        if (result.reason === "smtp") {
            let str = stringgenerator("t", result)
            console.log(result)
            singleResult.innerHTML = str;
        }
        else {
            let str = stringgenerator("f", result)
            console.log(result)
            singleResult.innerHTML = str;
        }
    }
    if (id === "d") {
        let str = ""
        let i = 1;
        for (let reason of result.reasons) {
            console.log(reason)
            const { disposable, mx, smtp, regex, typo } = reason.validators
            str += `
            <ul>
            ${i})  ${reason.email}
            <br/>
            ${smtp.reason === "Timeout" ? "Valid Email" : "Not valid Email"}
            <br/>
            Reason : ${reason.reason}
            <li style="color:${!regex.valid ? "red" : "green"}">Regex : ${regex.valid}</li>
            <li style="color:${!disposable.valid ? "red" : "green"}">Disposable : ${disposable.valid}</li>
            <li style="color:${!typo.valid ? "red" : "green"}">Typo : ${typo.valid}</li>
            <li style="color:${!mx.valid ? "red" : "green"}">mx : ${mx.valid}</li>
            <li style="color:${!smtp.valid ? "red" : "green"}">SMTP : ${smtp.valid} <br/>
            Reason is ${smtp.reason.errno || smtp.reason}.
            </li> 
            </ul>
            `
            i++;
            csv.data.push(
                [reason.email, smtp.reason === "Timeout" ? "Valid Email" : "Not valid Email"]
            )
        }
        alert("Now you can also download csv files")
        doubleEmail.innerHTML = str
    }
}

// for download
function download(content, filename) {
    var hiddenElement = document.createElement('a');
    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(content);
    hiddenElement.target = '_blank';
    hiddenElement.download = filename;
    hiddenElement.click();
}

//for json to csv
const jsonToCsv = () => {
    var jsonCsv = Papa.unparse(csv)
    download(jsonCsv, "Data.csv")
}

downloadButton.addEventListener("click", () => {
    jsonToCsv()
})