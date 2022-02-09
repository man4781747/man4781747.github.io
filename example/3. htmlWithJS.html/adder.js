var countNum = 0
updateCountNumber()
// 誰
var myBtn = document.getElementById("my-button")
test = document.createElement("div")
test.style.color=""
myBtn.appendChild(test)

myBtn.addEventListener(
    'click', // 什麼時候
    function (event) { // 做什麼
        countNum += 1
        updateCountNumber()
    }
);

function updateCountNumber(){
    var myDiv = document.getElementById("text-div")
    myDiv.innerText = countNum
}