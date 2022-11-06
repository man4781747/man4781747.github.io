
var app = new Vue({
  el: '#app',
  data: {
    loadEnd: false,

    // 當前測驗狀態
    gameStatus: "START",

    // 測驗開始相關
    // 測驗規則
    dataSet: "64",
    // 慣用手
    handSide: 'L',
    // startPassword
    startPasswordInput: "",
    startPasswordAns: "test",
    // 受試者ID
    TesterID: "",
    // 測試開始時間
    TestStartTime: "",


    // 卡組內容
    test_db: {},
    
    // 選擇後牌堆
    choseSave : [
      null,null,null,null
    ],

    // 答案正確與否
    ansResult: null,

    // 當前解答套用之規則
    nowRule: 'color',
    // 連續正確數
    successCount: 0,
    // 當前問題卡片NO.
    newQuestIndex: 0,
    // 當前卡片群組index
    groupCorrectSeqNumber: 0,

    // 動畫相關參數
    animationStatus: "DONE",
    sleepTime: 1000,


    // 最終輸出文字檔內容
    resultString: "C",
    // 測驗結果紀錄
    reslutList: [],

    // 上一次選出之答案的墓地index
    lastIndex: null,


    // 測驗完畢後密碼輸入值
    endPasswordInput: "",
    endPasswordAns: "test",

    // 當前執續反應的標準(PTP)規則
    PTP_Value: null,
    // 連續錯誤的明確反應Count數 (連續3次則會更換PTP規則Value)
    PTP_Value_Count: 0,

    googleFilePath: "",
    googleUploading: false,
  },
  computed: {
    checkStartWindowInputEnd () {
      if (this.TesterID.length === 0) {
        return "請輸入受試者ID"
      } else if (this.startPasswordInput !== this.endPasswordAns) {
        return "請輸入正確的研究員密碼"
      }
      return null 
    },
    nowQuest () {
      try {
        return this.test_db[this.dataSet][this.newQuestIndex]
      }
      catch (e) {
        return [2,"★","red"]
      }
    },
    finalResultList () {
      var isFirstUnambiguousError = true

      var PTP_Value = null
      var lastPTP_cardIndex = null

      var lastOther_PTP_cardIndex = null
      var other_PTP_Value = null
      var other_PTP_Value_Count = 0

      var returnAnsList =  JSON.parse(JSON.stringify(this.reslutList))
      for (var resultChose of returnAnsList) {
        resultChose["PerseverativeResponse"] = "-"

        // 若為回答正確
        if (resultChose["CorrectSeqNumber"] !== "-") {
          // 若為正確的明確反應，則重設PTP規則
          if (resultChose["AreUnambiguous"] === true) {
            var lastPTP_cardIndex = resultChose["CardNumber"]
            var other_PTP_Value_Count = 0
            var other_PTP_Value = null
            var lastPTP_cardIndex = resultChose["CardNumber"]
          }
          // 若為正確的非明確反應，則有可能在後續判斷中定義為p
          else {}
          // 連10題正確，錯誤規則重設
          if (resultChose["CorrectSeqNumber"] === "10") {
            var PTP_Value = null
            var lastPTP_cardIndex = null
            var lastOther_PTP_cardIndex = null
            var other_PTP_Value = null
            var other_PTP_Value_Count = 0
          }


          continue
        }
        // 若為回答錯誤
        else {
          // 若為明確反應
          if (resultChose["AreUnambiguous"] === true) {
            // 若為最初錯誤反應(unambiguous error)
            if (PTP_Value === null) {
              // unambiguous error
              // 定義當前PTP類型
              // 並記錄此刻卡片位置，以便後續判斷三明治規則用
              if (isFirstUnambiguousError & resultChose['PerseverativePrinciple']==="-") {
                resultChose["PerseverativeResponse"] = "[unambiguous error]"
                isFirstUnambiguousError = false
              }
              else {
                resultChose["PerseverativeResponse"] = "p"
              }
              PTP_Value = resultChose["CategoriesMatched"]
              lastPTP_cardIndex = resultChose["CardNumber"] - 1
            }
            // 此錯誤為明確反應，並且錯誤規則與當前錯誤規則相同
            else if (PTP_Value === resultChose["CategoriesMatched"]) {
              // 標記此項目為p
              // 並且檢查是否有三明治規則
              // 並且清除另一錯誤明確反應紀錄
              other_PTP_Value_Count = 1
              other_PTP_Value = null
              lastOther_PTP_cardIndex = null
              resultChose["PerseverativeResponse"] = 'p'
              this.checkIfSandwich(returnAnsList, lastPTP_cardIndex, resultChose["CardNumber"], PTP_Value, false)
              // 判定完三明治規則後，更新當前卡片位置，以便後續判斷三明治規則用
              lastPTP_cardIndex = resultChose["CardNumber"] - 1
            }
            // 若此次錯誤為明確反應，並且錯誤規則與當前錯誤規則不同，"但是"與上一個另一錯誤的明確反應錯誤規則相同
            else if (other_PTP_Value === resultChose["CategoriesMatched"]) {
              // 連續錯誤計數+1
              other_PTP_Value_Count += 1
              console.log('連續另一錯誤明確反應: '+other_PTP_Value_Count)
              // 若連續3次另一錯誤明確反應皆為同種錯誤
              if (other_PTP_Value_Count >= 3) {
                console.log('連續3次另一錯誤明確反應皆為同種錯誤')
                // 則連續錯誤計數歸0
                // 並且錯誤類型改變
                other_PTP_Value_Count = 0
                other_PTP_Value = null
                PTP_Value = resultChose["CategoriesMatched"]
                // 回頭檢查三明治的範圍內是否有不明確反應同屬此類
                this.checkIfSandwich(returnAnsList, lastOther_PTP_cardIndex, resultChose["CardNumber"], PTP_Value, true)
                // 判定完三明治規則後，更新當前卡片位置，以便後續判斷三明治規則用
                lastPTP_cardIndex = resultChose["CardNumber"] - 1
              }
            }
            // 若此次錯誤為明確反應，並且錯誤規則為新的類型
            else if (other_PTP_Value !== resultChose["CategoriesMatched"]) {
              // 則temp連續錯誤計數歸0
              // 並且temp錯誤類型改變
              // lastOther_PTP_cardIndex 更新為此次錯誤
              other_PTP_Value_Count = 1
              other_PTP_Value = resultChose["CategoriesMatched"]
              lastOther_PTP_cardIndex = resultChose["CardNumber"] - 1
            }
          }
        }
      }
      return returnAnsList
    },

    finalCalc_TotalNumber () {
      return this.finalResultList.length
    },
    finalCalc_TotalNumberCorrect () {
      var returnNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["CorrectSeqNumber"] !== "-") {
          returnNum += 1
        }
      }
      return returnNum
    },
    
    finalCalc_TotalNumberOfError () {
      var returnNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["CorrectSeqNumber"] === "-") {
          returnNum += 1
        }
      }
      return returnNum
    },

    finalCalc_PreseverativeResponses () {
      var returnNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["PerseverativeResponse"] === "p") {
          returnNum += 1
        }
      }
      return returnNum
    },

    finalCalc_PreseverativeErrors () {
      var returnNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["PerseverativeResponse"] === "p" & finalResultChose["CorrectSeqNumber"] === "-") {
          returnNum += 1
        }
      }
      return returnNum
    },

    finalCalc_NonpreseverativeErrors () {
      var returnNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["PerseverativeResponse"] !== "p" & finalResultChose["CorrectSeqNumber"] === "-") {
          returnNum += 1
        }
      }
      return returnNum
    },

    finalCalc_ConceptualLevelResponses () {
      var returnNum = 0
      var countCheckNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["CorrectSeqNumber"] === "-") {
          if (countCheckNum >= 3) {
            returnNum += countCheckNum
            countCheckNum = 0
          }
          else {
            countCheckNum = 0
          }
        }
        else {
          countCheckNum += 1
        }
      }
      if (countCheckNum >= 3) {
        returnNum += countCheckNum
      }
      return returnNum
    },

    finalCalc_CategoriesCompleted () {
      return this.groupCorrectSeqNumber 
    },

    finalCalc_TrialsToComplete_1st_Category () {
      if (this.finalCalc_CategoriesCompleted === 0) {
        return 0
      }
      var returnNum = 0
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["SortingPrinciple"] === "C") {
          returnNum += 1
        } else {break}
      }
      return returnNum
    },

    finalCalc_FailureToMaintainSet () {
      var returnNum = 0
      var checkIng = false
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["CorrectSeqNumber"] === 5+'') {
          checkIng = true
        }
        if (checkIng === true & finalResultChose["CorrectSeqNumber"] === 10+'') {
          checkIng = false
        }
        if (checkIng === true & finalResultChose["CorrectSeqNumber"] === "-") {
          checkIng = false
          returnNum += 1
        }
      }
      return returnNum
    },

    finalCalc_ErrorsNumberOfTrails () {
      if (this.groupCorrectSeqNumber < 3) {
        return {
          "AverageDifference": "-",
          "Table": []
        }
      }
      var returnList = []
      var nowType = "C"
      var nowTypeCount = 0
      var nowTypeErrorCount = 0
      var CategoryNumber = 1
      for (var finalResultChose of this.finalResultList) {
        if (finalResultChose["SortingPrinciple"] === nowType){
          nowTypeCount += 1
          if (finalResultChose["CorrectSeqNumber"] === "-") {
            nowTypeErrorCount += 1
          }
        }
        else {
          returnList.push(
            {
              "CategoryNumber" : CategoryNumber,
              "NumberOfTrials" : nowTypeCount,
              "Errors" : nowTypeErrorCount,
              "PercentErrors": nowTypeErrorCount/nowTypeCount,
            }
          )
          CategoryNumber += 1
          nowType = finalResultChose["SortingPrinciple"]
          nowTypeCount = 1
          nowTypeErrorCount = 0
          if (finalResultChose["CorrectSeqNumber"] === "-") {
            nowTypeErrorCount += 1
          }
        }
      }
      returnList.push(
        {
          "CategoryNumber" : CategoryNumber,
          "NumberOfTrials" : nowTypeCount,
          "Errors" : nowTypeErrorCount,
          "PercentErrors": nowTypeErrorCount/nowTypeCount,
        }
      )
      console.log(returnList)
      returnList[0]["PercentErrorsDifferenceScore"] = "0"
      var avgDiff = 0
      for (let i in [...Array(returnList.length-1).keys()]) {
        var indexNum = parseInt(i)
        returnList[indexNum+1]["PercentErrorsDifferenceScore"] = returnList[indexNum]["PercentErrors"]-returnList[indexNum+1]["PercentErrors"]
        avgDiff += returnList[indexNum+1]["PercentErrorsDifferenceScore"]
      }
      avgDiff = avgDiff/(returnList.length-1)
      return {
        "AverageDifference": avgDiff,
        "Table": returnList
      }
    },

    finalResultString () {
      var ResultString = ""
      ResultString += "WCST MODE,"+this.dataSet+"\r\n"
      ResultString += "Start Time,"+this.TestStartTime+"\r\n"
      ResultString += "Client ID,"+this.TesterID+"\r\n\r\n"

      ResultString += "Response Deck\r\n"
      ResultString += "SortingPrinciple,CorrectSeqNumber,CardNumber,ColumnSortedTo,CategoriesMatched,PerseverativePrinciple,PerseverativeResponse\r\n"
      for (var finalResultChose of this.finalResultList) {
        ResultString += finalResultChose["SortingPrinciple"]+","
        ResultString += finalResultChose["CorrectSeqNumber"]+","
        ResultString += finalResultChose["CardNumber"]+","
        ResultString += finalResultChose["ColumnSortedTo"]+","
        ResultString += finalResultChose["CategoriesMatched"]+","
        ResultString += finalResultChose["PerseverativePrinciple"]+","
        ResultString += finalResultChose["PerseverativeResponse"]+"\r\n"
      }
      ResultString += "\r\nTest Results\r\n"
      ResultString += "Trials Administered,"+this.finalCalc_TotalNumber+"\r\n"
      ResultString += "Total Correct,"+this.finalCalc_TotalNumberCorrect+"\r\n"
      
      ResultString += "Total Errors,"+this.finalCalc_TotalNumberOfError+"\r\n"
      ResultString += "%Errors,"+(this.finalCalc_TotalNumberOfError/this.finalCalc_TotalNumber*100).toFixed(0)+"%\r\n"
      
      ResultString += "Perseverative Responses,"+this.finalCalc_PreseverativeResponses+"\r\n"
      ResultString += "%Perseverative Responses,"+(this.finalCalc_PreseverativeResponses/this.finalCalc_TotalNumber*100).toFixed(0)+"%\r\n"
      
      ResultString += "Perseverative Errors,"+this.finalCalc_PreseverativeErrors+"\r\n"
      ResultString += "%Perseverative Errors,"+(this.finalCalc_PreseverativeErrors/this.finalCalc_TotalNumber*100).toFixed(0)+"%\r\n"
      
      ResultString += "Nonperseverativ Errors,"+this.finalCalc_NonpreseverativeErrors+"\r\n"
      ResultString += "%Nonperseverative Errors,"+(this.finalCalc_NonpreseverativeErrors/this.finalCalc_TotalNumber*100).toFixed(0)+"%\r\n"
      
      ResultString += "Conceptual Level Responses,"+this.finalCalc_ConceptualLevelResponses+"\r\n"
      ResultString += "%Conceptual Level Responses,"+(this.finalCalc_ConceptualLevelResponses/this.finalCalc_TotalNumber*100).toFixed(0)+"%\r\n"
      
      ResultString += "Categories Completed,"+this.finalCalc_CategoriesCompleted+"\r\n"
      ResultString += "Trials to Complete 1st Category,"+this.finalCalc_TrialsToComplete_1st_Category+"\r\n"
      ResultString += "Failure to Maintain Set,"+this.finalCalc_FailureToMaintainSet+"\r\n"
      ResultString += "Learning to Learn,"+(this.finalCalc_ErrorsNumberOfTrails["AverageDifference"]*100).toFixed(2)+"\r\n"
      
      ResultString += "\r\nLearning to Learn Score Worksheet\r\nCategory number,Number of trials,Errors,Percent errors,Percent errors difference score\r\n"
      for (let dataChose of this.finalCalc_ErrorsNumberOfTrails["Table"]) {
        ResultString += dataChose["CategoryNumber"]+","+dataChose["NumberOfTrials"]+","+dataChose["Errors"]+","+(dataChose["PercentErrors"]*100).toFixed(2)+","+(dataChose["PercentErrorsDifferenceScore"]*100).toFixed(2)+"\r\n"
      }
      ResultString += "\r\nAverage difference,"+(this.finalCalc_ErrorsNumberOfTrails["AverageDifference"]*100).toFixed(2)+"\r\n"

      return ResultString
    },
  },
  methods: {
    testStart () {
      var nowDatetime = new Date()
      this.TestStartTime = nowDatetime.format('yyyy-MM-dd_hh-mm-ss')
      this.gameStatus = 'INFO'
    },
    cardClick (S_color,I_number,S_shape) {
      var I_number = I_number
      var nowQuestSave = JSON.parse(JSON.stringify(this.nowQuest))
      var thisResult = {}
      this.lastIndex = I_number-1
      if (this.animationStatus === "ING") {
        console.log("動畫還在跑拉")
        return null
      }
      else {
        this.animationStatus = "ING"
      }
      
      var isAreUnambiguous = this.isThisChoseAreUnambiguous(
        [I_number,S_shape,S_color],
        this.nowQuest
      )

      thisResult["AreUnambiguous"] = isAreUnambiguous
      thisResult["CardNumber"] = this.newQuestIndex + 1
      thisResult["ColumnSortedTo"] = I_number
      if (this.nowRule === "color") {
        thisResult["SortingPrinciple"] = "C"
        if (this.groupCorrectSeqNumber == 0) {
          thisResult["PerseverativePrinciple"] = "-"
        }
        else {
          thisResult["PerseverativePrinciple"] = "N"
        }
        if (this.nowQuest[2] === S_color) {
          this.successCount += 1
          this.ansResult = 'Y'
          thisResult["CorrectSeqNumber"] = this.successCount+''
        }
        else {
          this.successCount = 0
          thisResult["CorrectSeqNumber"] = "-"
          this.ansResult = 'N'
        }
      }
      else if (this.nowRule === "number") {
        thisResult["SortingPrinciple"] = "N"
        thisResult["PerseverativePrinciple"] = "F"
        if (this.nowQuest[0] === I_number) {
          this.successCount += 1
          thisResult["CorrectSeqNumber"] = this.successCount+''
          this.ansResult = 'Y'
        }
        else {
          this.successCount = 0
          thisResult["CorrectSeqNumber"] = "-"
          this.ansResult = 'N'
        }
      }
      else if (this.nowRule === "shape") {
        thisResult["SortingPrinciple"] = "F"
        thisResult["PerseverativePrinciple"] = "C"
        if (this.nowQuest[1] === S_shape) {
          this.successCount += 1
          thisResult["CorrectSeqNumber"] = this.successCount+''
          this.ansResult = 'Y'
        }
        else {
          this.successCount = 0
          thisResult["CorrectSeqNumber"] = "-"
          this.ansResult = 'N'
        }
      }

      var resultString = ""
      if (this.nowQuest[2] === S_color) {
        resultString += "C"
      }
      if (this.nowQuest[1] === S_shape) {
        resultString += "F"
      }
      if (this.nowQuest[0] === I_number) {
        resultString += "N"
      }
      if (resultString===""){
        resultString = "O"
      }
      thisResult["CategoriesMatched"] = resultString

      if (this.successCount === 10) {
        if (this.nowRule === "color") {
          this.nowRule = "shape"
        }
        else if (this.nowRule === "shape") {
          this.nowRule = "number"
        }
        else if (this.nowRule === "number") {
          this.nowRule = "color"
        }
        this.groupCorrectSeqNumber += 1
        this.successCount = 0
      }
      this.reslutList.push(thisResult)

      // console.log(this.resultString)
      if (this.sleepTime !== 0) {
        var This = this
        this.updateSaveCookies()
        setTimeout(() => {
          This.newQuestIndex += 1
          if (This.newQuestIndex >= This.test_db[This.dataSet].length | This.groupCorrectSeqNumber >= 6){
            This.resultString = This.resultString.slice(0, -1)
            This.gameStatus = "END"
          }
          This.choseSave[I_number-1] = nowQuestSave
          This.animationStatus = "DONE"
          This.ansResult = null
        }, this.sleepTime)
      }
      else {
        this.newQuestIndex += 1
        if (this.newQuestIndex >= this.test_db[this.dataSet].length | this.groupCorrectSeqNumber >= 6){
          this.resultString = this.resultString.slice(0, -1)
          this.gameStatus = "END"
        }
        this.choseSave[I_number-1] = nowQuestSave
        this.animationStatus = "DONE"
        this.ansResult = null
      }
      

    },
    reStart () {
      this.newQuestIndex = 0
      this.groupCorrectSeqNumber = 0
      this.successCount = 0
      this.ansResult = 0
      this.nowRule = 'color'
      this.animationStatus = 'DONE'
      this.resultString = "C"
      this.gameStatus = "START"
      this.endPasswordInput = ""
      this.googleFilePath = ""
    },
    downloadResultFile () {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.finalResultString));
      element.setAttribute('download', 'Result.csv');
    
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    },
    uploadResultFileToGoogleDrive () {
      if (this.googleUploading === false) {
        this.googleUploading = true
        var This = this
        var urlString = encodeURIComponent(this.finalResultString)
        fetch("https://script.google.com/macros/s/AKfycbwIZkqS8soX9ic1u3QMMsTwyKvOcKpdTaVXzyMeLMev_llHrA6_djUp4M6aVQjjZFJwPw/exec?fileName="+this.TestStartTime+"_"+this.TesterID+".csv"+"&contestString="+urlString)
        .then(function(response) {
          return response.json();
        })
        .then(function(myJson) {
          if (myJson["result"] === "success") {
            This.googleFilePath = myJson["newUrl"]
          }
          else {
            alert("上傳至Google雲端錯誤，錯誤資訊:\r\n"+myJson["message"]+"\r\n如有問題請通知管理員")
          }
          This.googleUploading = false
        });
      }
      else {

      }
    },
    reStartBtnClick () {
      var isRestart = confirm("確認要重新測驗嗎? 資料將會全部清空喔!");
      if (isRestart) {
        this.reStart()
      }
    },
    isThisChoseAreUnambiguous (chosedAns, questCard) {
      var checkCount = 0
      if (chosedAns[0] === questCard[0]) {
        checkCount += 1
      }
      if (chosedAns[1] === questCard[1]) {
        checkCount += 1
      }
      if (chosedAns[2] === questCard[2]) {
        checkCount += 1
      }
      if (checkCount > 1 | checkCount === 0) {
        return false
      }
      return true
    },
    // 檢查兩個連續符合明確錯誤規則的紀錄中間是否符合三明治規則
    checkIfSandwich (inputList, startIndex, endIndex, rule, newRule) {
      console.log("檢查三明治:"+startIndex+"~"+endIndex)
      console.log("使用規則:"+rule)
      console.log("新規則切換:"+newRule)
      for (var nowIndex=parseInt(startIndex); nowIndex<parseInt(endIndex);nowIndex++) {
        // 若中間有任何不包含rule的錯誤規則，則直接判定非三明治規則，跳出
        if (inputList[nowIndex]["CategoriesMatched"].indexOf(rule) === -1) {return null}
      }
      // 若跑到這行，代表兩個符合規則之明確錯誤反應中間皆符合三明治規則，全部標記為p
      if (newRule) {
        // inputList[parseInt(startIndex)]["PerseverativeResponse"] = '- [unambiguous error]'
        inputList[parseInt(startIndex)]["PerseverativeResponse"] = '-'
        for (var nowIndex=parseInt(startIndex)+1; nowIndex<parseInt(endIndex);nowIndex++) {
          // inputList[nowIndex]["PerseverativeResponse"] = 'p [unambiguous error]'
          inputList[nowIndex]["PerseverativeResponse"] = 'p'
        }
      }
      else {
        for (var nowIndex=parseInt(startIndex); nowIndex<parseInt(endIndex);nowIndex++) {
          if (inputList[nowIndex]["PerseverativeResponse"] !== "[unambiguous error]"){
            inputList[nowIndex]["PerseverativeResponse"] = 'p'
          }
        }
      }
      return null
    },

    // 紀錄功能相關
    updateSaveCookies () {
      ResultString = this.TesterID+","+this.dataSet+","
      var returnAnsList =  JSON.parse(JSON.stringify(this.reslutList))
      for (var nowResultChose of returnAnsList) {
        ResultString += nowResultChose["ColumnSortedTo"]
      }
      ResultString += ","+this.handSide+","+this.TestStartTime
      Cookies.set("WCSTSaveData", ResultString)
    },

    loadSaveDataOnCookie () {
      this.$nextTick(() => {
        var S_saveData = Cookies.get("WCSTSaveData")
        if (S_saveData === undefined) {
          return null
        }
        if (S_saveData.length !== 0) {
          if(confirm('發現有過去的紀錄檔，需要重新讀取嗎?\r\n若取消讀取，可能導致過往紀錄消失!\r\n若要讀取請點選"確定"')) {
            this.gameStatus = "ING"
            this.$nextTick(() => {
              this.dataSet = S_saveData.split(",")[1]
              this.TesterID = S_saveData.split(",")[0]
              this.loadSaveData_CardOrder(S_saveData.split(",")[2])
              this.handSide = S_saveData.split(",")[3]
              this.TestStartTime = S_saveData.split(",")[4]
            })
          }
        } 
      })

    },
    loadSaveData_CardOrder (S_CardOrder) {
      this.sleepTime = 0
      for (S_order of S_CardOrder) {
        this.$refs['options-'+S_order].click()
      }
      this.sleepTime = 1000
    },
    copyGoogleFileUrl(){
      document.getElementById("google-file-url").select()
      document.execCommand("copy")
      alert("複製文字成功");
    }
  },
  mounted () {
    window.test = this
    this.test_db = test_db
    this.loadSaveDataOnCookie()
    window.document.body.onbeforeunload = function()
    {
      return '您尚未將編輯過的表單資料送出，請問您確定要離開網頁嗎？';
    }
    this.loadEnd = true
  },
})
