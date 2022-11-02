
var app = new Vue({
  el: '#app',
  data: {
    gameStatus: "START",
    dataSet: "64",
    test_db: {},

    ansResult: null,
    nowRule: 'color',
    successCount: 0,
    newQuestIndex: 0,
    groupSuccessCount: 0,
    animationStatus: "DONE",
    resultString: "C"
  },
  computed: {
    nowQuest () {
      try {
        return this.test_db[this.dataSet][this.newQuestIndex]
      }
      catch (e) {
        return [2,"★","red"]
      }
    },
  },
  methods: {
    cardClick (S_color,I_number,S_shape) {
      if (this.animationStatus === "ING") {
        console.log("動畫還在跑拉")
        return null
      }
      else {
        this.animationStatus = "ING"
      }
      if (this.nowRule === "color") {
        if (this.nowQuest[2] === S_color) {
          this.successCount += 1
          this.ansResult = 'Y'
          this.resultString += (this.successCount+'').padStart(2, '0')
        }
        else {
          this.successCount = 0
          this.resultString += "__"
          this.ansResult = 'N'
        }
      }
      else if (this.nowRule === "number") {
        if (this.nowQuest[0] === I_number) {
          this.successCount += 1
          this.resultString += (this.successCount+'').padStart(2, '0')
          this.ansResult = 'Y'
        }
        else {
          this.successCount = 0
          this.resultString += "__"
          this.ansResult = 'N'
        }
      }
      else if (this.nowRule === "shape") {
        if (this.nowQuest[1] === S_shape) {
          this.successCount += 1
          this.resultString += (this.successCount+'').padStart(2, '0')
          this.ansResult = 'Y'
        }
        else {
          this.successCount = 0
          this.resultString += "__"
          this.ansResult = 'N'
        }
      }

      if (this.nowQuest[2] === S_color) {
        this.resultString += "C"
      }
      else {
        this.resultString += "/"
      }
      if (this.nowQuest[1] === S_shape) {
        this.resultString += "F"
      }
      else {
        this.resultString += "/"
      }
      if (this.nowQuest[0] === I_number) {
        this.resultString += "N"
      }
      else {
        this.resultString += "/"
      }
      this.resultString += "O"
      this.resultString += "\r\n"
      if (this.successCount === 10) {
        if (this.nowRule === "color") {
          this.nowRule = "shape"
          this.resultString += "F"
        }
        else if (this.nowRule === "shape") {
          this.nowRule = "number"
          this.resultString += "N"
        }
        else if (this.nowRule === "number") {
          this.nowRule = "color"
          this.resultString += "C"
        }
        this.groupSuccessCount += 1
        this.successCount = 0
      }
      else {
        this.resultString += " "
      }
      // console.log(this.resultString)
      var This = this
      setTimeout(() => {
        This.newQuestIndex += 1
        if (This.newQuestIndex >= This.test_db[This.dataSet].length | This.groupSuccessCount >= 6){
          This.resultString = This.resultString.slice(0, -1)
          This.gameStatus = "END"
        }
        This.animationStatus = "DONE"
        This.ansResult = null
      }, 1000)
      

    },
    reStart () {
      this.newQuestIndex = 0
      this.groupSuccessCount = 0
      this.successCount = 0
      this.ansResult = 0
      this.nowRule = 'number'
      this.animationStatus = 'DONE'
      this.resultString = "C"
      this.gameStatus = "START"
    },
    downloadResultFile () {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.resultString));
      element.setAttribute('download', 'Result.txt');
    
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    reStartBtnClick () {
      var isRestart = confirm("確認要重新測驗嗎? 資料將會全部清空喔!");
      if (isRestart) {
        this.reStart()
      }
    }
  },
  mounted () {
    this.test_db = test_db
    window.document.body.onbeforeunload = function()
    {
      return '您尚未將編輯過的表單資料送出，請問您確定要離開網頁嗎？';
    }
  },
})
