
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
    startPasswordAns: "qaz",
    // 受試者ID
    TesterID: "",
    // 受試者姓名
    TesterName: "",
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
    endPasswordAns: "qaz",

    // 當前執續反應的標準(PTP)規則
    PTP_Value: null,
    // 連續錯誤的明確反應Count數 (連續3次則會更換PTP規則Value)
    PTP_Value_Count: 0,

    googleFilePath: "",
    googleUploading: false,
    fileSaveDone: false,
  },
  computed: {
    checkStartWindowInputEnd () {
      if (this.TesterName.length === 0) {
        return "請輸入受試者姓名"
      } else if (this.TesterID.length === 0) {
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
      var returnAnsList =  JSON.parse(JSON.stringify(this.reslutList))

      
      var NowWrongRule = "-" // 當前的錯誤規則
      var PTPStack = { // 裡面紀錄的是PTP規則切換的資料
        "rule": "-",  //  當前PTP判斷依據規則
        "stack": [], //  如果PTP切換，裡面的錯誤規則都要改 (除了第一個)
        "count": 0
      }
      for (var resultChose of returnAnsList) {
        // AreUnambiguous: 是否明確反應
        // CardNumber: 卡片ID (index + 1)
        // CategoriesMatched: 此卡片歸類項目
        // ColumnSortedTo:    作答時選擇的位置
        // CorrectSeqNumber: 連續正確count數
        // PerseverativePrinciple : 上一組正確答案
        // PerseverativeResponse  : 是否記p
        // SortingPrinciple:  當前正確規則

        // NowWrongRule (new) 當前錯誤規則

        console.log("當前卡牌index: "+(parseInt(resultChose["CardNumber"])-1))
        // console.log("當前Categories_Matched: "+Categories_Matched)
        resultChose["NowWrongRule"] = NowWrongRule
        if (resultChose["CorrectSeqNumber"] === "-") {
          // 如果回答錯誤
          if (resultChose["AreUnambiguous"] === true) { // 如果回答錯誤，並且為明確反應
            // 如果回答錯誤且為明確錯誤
            if (NowWrongRule === "-") {
              // 如果回答錯誤且為明確錯誤 而且 當前的錯誤規則(NowWrongRule)==="-"
              // 代表這是整份第一個遇到的明確錯誤
              console.log("整份遇到的第一個明確錯誤")
              console.log("當前錯誤規則調整為: "+resultChose["CategoriesMatched"])
              // 首先 當前卡片的錯誤規則還不能動，要跟著上一個錯誤規則，不能當下個規則的麵包
              // resultChose["NowWrongRule"] = NowWrongRule
              resultChose["NowWrongRule"] = "[unambiguous error]"
              NowWrongRule = resultChose["CategoriesMatched"]
            }
            else if (NowWrongRule === resultChose["CategoriesMatched"]) {
              // 如果回答錯誤且為明確錯誤 而且與 當前的錯誤規則(NowWrongRule)相同
              console.log("回答錯誤且為明確錯誤 而且與 當前的錯誤規則(NowWrongRule)相同")
              console.log("重設記錄檔")
              PTPStack["rule"] = "-"
              PTPStack["stack"] = []
              PTPStack["count"] = 0
            } else if (NowWrongRule !== resultChose["CategoriesMatched"]) {
              // 如果回答錯誤且為明確錯誤 而且與 當前的錯誤規則(NowWrongRule)不不不不不不相同
              if (PTPStack["rule"] === resultChose["CategoriesMatched"]) {
                // 如果明確不同的錯誤與記錄檔相同
                console.log("明確不同的錯誤與記錄檔相同")
                console.log("計數+1")
                PTPStack["count"] += 1
                PTPStack["stack"].push(resultChose)
              }
              else {
                // 如果明確不同的錯誤與記錄檔不相同
                console.log("明確不同的錯誤與記錄檔不相同")
                console.log("錯誤與記錄檔規則改為: "+resultChose["CategoriesMatched"]+"")
                PTPStack["rule"] = resultChose["CategoriesMatched"]+""
                PTPStack["count"] = 1
                PTPStack["stack"] = []
              }
              if (PTPStack["count"] >= 3) {
                // 連續不同明確錯誤記數 >= 3
                // 改變當前錯誤規則
                console.log("連續不同明確錯誤記數 >= 3")
                NowWrongRule = PTPStack["rule"]+""
                console.log("改變當前錯誤規則變成: "+NowWrongRule)
                // 改變stack內所有的錯誤規則("NowWrongRule")
                console.log("改變stack內所有的錯誤規則('NowWrongRule')")
                var changeSwitch = true // 直到碰到第一個明確錯誤才改規則
                for (let index in PTPStack["stack"]) {
                  if (PTPStack["stack"][index]["AreUnambiguous"] === false & changeSwitch === true) {
                    console.log("還沒遇到紀錄組內的第一個明確錯誤，且此項目為不明確錯誤，不改錯誤判斷規則")
                    continue
                  } else if (PTPStack["stack"][index]["AreUnambiguous"] === true & changeSwitch === true) {
                    console.log("遇到紀錄組內的第一個明確錯誤，開始改錯誤判斷規則")
                    changeSwitch = false
                    PTPStack["stack"][index]["NowWrongRule"] = NowWrongRule
                    continue
                  }
                  // if (index === 0) {
                  //   continue
                  // }
                  console.log("index: "+(PTPStack["stack"][index]["CardNumber"]-1))
                  PTPStack["stack"][index]["NowWrongRule"] = NowWrongRule
                }
                // 清空stack
                PTPStack["rule"] = "-"
                PTPStack["stack"] = []
                PTPStack["count"] = 0
              }
            }
          }
          else { // 如果回答錯誤，並且為不明確反應
            if (resultChose["CategoriesMatched"].indexOf(PTPStack["rule"]) !== -1) { //如果這個錯誤的不明確反應包含了紀錄檔的錯誤規則
              console.log("這個錯誤的不明確反應包含了紀錄檔的錯誤規則")
              console.log("記錄檔不重設，count不+1，stack加入此卡片")
              PTPStack["stack"].push(resultChose)
            } else {
              console.log("這個錯誤的不明確反應不包含了紀錄檔的錯誤規則")
              console.log("記錄檔重設")
              PTPStack["rule"] = "-"
              PTPStack["stack"] = []
              PTPStack["count"] = 0
            }
          }
        } else {
          // 如果回答正確
          if (resultChose["AreUnambiguous"] === true) { // 如果回答正確，並且為明確反應
            console.log("回答正確，並且為明確反應")
            console.log("記錄檔重設")
            PTPStack["rule"] = "-"
            PTPStack["stack"] = []
            PTPStack["count"] = 0
          } else {// 如果回答正確，並且為明確反應
            console.log("回答正確，並且為不明確反應")
            // 要判斷紀錄檔的規則是否包含在此卡中
            if (resultChose["CategoriesMatched"].indexOf(PTPStack["rule"]) !== -1) {//如果這個正確的不明確反應包含了紀錄檔的錯誤規則
              console.log("這個正確的不明確反應包含了紀錄檔的錯誤規則")
              console.log("記錄檔不重設，count不+1，stack加入此卡片")
              PTPStack["stack"].push(resultChose)
            } else {
              console.log("這個正確的不明確反應不包含了紀錄檔的錯誤規則")
              console.log("記錄檔重設")
              PTPStack["rule"] = "-"
              PTPStack["stack"] = []
              PTPStack["count"] = 0
            }
          }

          if (resultChose["CorrectSeqNumber"] === "10") {
            // 回答正確，而且連續答對10題
            console.log("回答正確，而且連續答對10題")
            console.log("當前錯誤規則調整為: "+resultChose["SortingPrinciple"])
            NowWrongRule = resultChose["SortingPrinciple"]
            console.log("這個正確的不明確反應不包含了紀錄檔的錯誤規則")
            console.log("記錄檔重設")
            PTPStack["rule"] = "-"
            PTPStack["stack"] = []
            PTPStack["count"] = 0
          }
        }
      }
      console.log("錯誤規則配對已設定完成，開始從新掃描所有項目")
      console.log("為三明治判斷分組")
      var L_pGroup = []
      var L_pGroupTemp = []
      for (var resultChose of returnAnsList) {

        if (resultChose["NowWrongRule"] === resultChose["CategoriesMatched"]) {
          resultChose["PerseverativeResponse"] = "p"
          L_pGroupTemp.push(resultChose)
          if (L_pGroupTemp.length != 1) {
            L_pGroup.push(L_pGroupTemp)
            L_pGroupTemp = [resultChose]
          }
        }
        else {
          if (L_pGroupTemp.length != 0){
            L_pGroupTemp.push(resultChose)
          }
        }
      }
      console.log("分組完成")
      for (let groupChose of L_pGroup) {
        var allSaveCheck = true
        for (let itemChose of groupChose) {
          if (itemChose["CategoriesMatched"].indexOf(groupChose[0]["CategoriesMatched"]) === -1) {
            allSaveCheck = false
            break
          }
        }
        if (allSaveCheck) {
          for (let itemChose of groupChose) {
            itemChose["PerseverativeResponse"] = "p"
          }
        }
      }
      console.log("三明治判斷完成")
      console.log("為 PerseverativeResponse 沒值的項目填入 '-'")
      for (var resultChose of returnAnsList) {

        if (resultChose["PerseverativeResponse"] == undefined) {
          resultChose["PerseverativeResponse"] = "-"
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
      returnList[0]["PercentErrorsDifferenceScore"] = "0"
      while (returnList.length > this.groupCorrectSeqNumber) {
        returnList.pop()
      }
 

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
      ResultString += "Client Name,"+this.TesterName+"\r\n"
      ResultString += "Client ID,"+this.TesterID+"\r\n\r\n"

      ResultString += "Response Deck\r\n"
      ResultString += "SortingPrinciple,CorrectSeqNumber,CardNumber,ColumnSortedTo,CategoriesMatched,PerseverativePrinciple,PTPRule,PerseverativeResponse\r\n"
      for (var finalResultChose of this.finalResultList) {
        ResultString += finalResultChose["SortingPrinciple"]+","
        ResultString += finalResultChose["CorrectSeqNumber"]+","
        ResultString += finalResultChose["CardNumber"]+","
        ResultString += finalResultChose["ColumnSortedTo"]+","
        ResultString += finalResultChose["CategoriesMatched"]+","
        ResultString += finalResultChose["PerseverativePrinciple"]+","
        ResultString += finalResultChose["NowWrongRule"]+","
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
      // for (let i of [...Array(this.finalCalc_CategoriesCompleted).keys()]) {
      //   let dataChose = this.finalCalc_ErrorsNumberOfTrails["Table"][i]
      //   ResultString += dataChose["CategoryNumber"]+","+dataChose["NumberOfTrials"]+","+dataChose["Errors"]+","+(dataChose["PercentErrors"]*100).toFixed(2)+","+(dataChose["PercentErrorsDifferenceScore"]*100).toFixed(2)+"\r\n"
      // }
      
      for (let dataChose of this.finalCalc_ErrorsNumberOfTrails["Table"]) {
        ResultString += dataChose["CategoryNumber"]+","+dataChose["NumberOfTrials"]+","+dataChose["Errors"]+","+(dataChose["PercentErrors"]*100).toFixed(2)+","+(dataChose["PercentErrorsDifferenceScore"]*100).toFixed(2)+"\r\n"
      }
      ResultString += "\r\nAverage difference,"+(this.finalCalc_ErrorsNumberOfTrails["AverageDifference"]*100).toFixed(2)+"\r\n"

      return ResultString
    },
  },
  watch:{
    endPasswordInput: (newVal,oldVal) => {
      if (newVal === window.test.endPasswordAns) {
        console.log("OK")
        if (window.test.fileSaveDone === false) {
          window.test.fileSaveDone = true
          window.test.uploadResultFileToGoogleDrive()
          window.test.downloadResultFile()
        }
      }
    }
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
      this.choseSave = [null,null,null,null,]
      this.reslutList = []
      this.TesterID = ""
      this.fileSaveDone = false
    },
    downloadResultFile () {
      var element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,%EF%BB%BF' + encodeURIComponent(this.finalResultString));
      element.setAttribute('download', this.TestStartTime+"_"+this.TesterID+".csv");
    
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
        try {
          fetch("https://script.google.com/macros/s/AKfycbxsZtVlxbhbH7z-CQh5nH-gHo0mW8Sq0toOINBoAsK1BirHONePwplVLALkTRZMUsvF/exec?fileName="+this.TestStartTime+"_"+this.TesterID+".csv"+"&contestString="+urlString)
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
        } catch(e) {
          alert("上傳至Google雲端錯誤，\r\n如有問題請通知管理員")
          This.googleUploading = false
        }
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
    },
    checkEndPasswordInput(){
      console.log(123)
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
