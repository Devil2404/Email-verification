const uploadButton = document.getElementById("uploadButton")
const uploadFile = document.getElementById("uploadFile")
const verifyButton = document.getElementById("verify")
const singleEmail = document.getElementById("singleEmail")
const singleResult = document.getElementById("singleResult")
const doubleEmail = document.getElementById("doubleEmail")
const downloadButton = document.getElementById("download")
let t = true
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
const stringgenerator = (result) => {
    const { disposable, mx, smtp, regex, typo } = result.validators
    if (!smtp.valid && "reason" in smtp && smtp.reason === "Timeout") {
        t = false
    }
    let str = `
    ${smtp.reason === "Timeout" ? "Valid Email" : "Not valid Email"}
    <br/>
    ${smtp.reason === "Timeout" ? "" : `Reason : ${result.reason}`}
    <li>Email structure ${!regex.valid ? '<img src="icons8-close.svg" alt="">' : '<img src="icons8-verified-account-32.png" alt="">'}</li>
    <li>Disposable ${!disposable.valid ? '<img src="icons8-close.svg" alt="">' : '<img src="icons8-verified-account-32.png" alt="">'}</li>
    <li>Typo ${!typo.valid ? '<img src="icons8-close.svg" alt="">' : '<img src="icons8-verified-account-32.png" alt="">'}</li>
    <li>MX Records${!mx.valid ? '<img src="icons8-close.svg" alt="">' : '<img src="icons8-verified-account-32.png" alt="">'}</li>
    <li>SMTP Connection ${t ? '<img src="icons8-close.svg" alt="">' : '<img src="icons8-verified-account-32.png" alt="">'}</li>  
    `
    return str
}

// for showing result on page
const emailResult = (result, id) => {
    if (id === "s") {
        let str = stringgenerator(result)
        singleResult.innerHTML = str;
    }
    if (id === "d") {
        let str = ""
        let i = 1;
        for (let reason of result.reasons) {
            const { smtp } = reason.validators
            str += `<ul>${i})  ${reason.email}  <br/>`
            str += stringgenerator(reason)
            str += `</ul>`
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