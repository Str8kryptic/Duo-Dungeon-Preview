(function(){
"use strict";
// Step-log reader retained for future import flows. No fold/session counting.
window.DUO_SYNC={
  readStepLog:function(file){
    return new Promise(function(resolve,reject){
      if(!file){reject(new Error("Choose a Duo Dungeon step log first."));return}
      if(file.size>5*1024*1024){reject(new Error("That step log is unusually large."));return}
      var reader=new FileReader();
      reader.onerror=function(){reject(new Error("The step log could not be read."))};
      reader.onload=function(){
        try{
          var data=JSON.parse(String(reader.result||""));
          var steps=Number(data&&data.steps),date=String(data&&data.date||"");
          if(!data||typeof data!=="object"||!Number.isSafeInteger(steps)||steps<0||steps>100000||!/^\\d{4}-\\d{2}-\\d{2}$/.test(date))throw new Error("This is not a valid Duo Dungeon daily step log.");
          resolve({steps:steps,date:date});
        }catch(error){reject(error instanceof SyntaxError?new Error("The selected step log is not valid JSON."):error)}
      };
      reader.readAsText(file);
    });
  }
};
})();