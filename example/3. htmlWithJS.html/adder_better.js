var countNum = 0

function updateCountNumber(){
    var myDiv = document.getElementById("text-div")
    myDiv.innerText = countNum
}

window.onload = function() {
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
};
