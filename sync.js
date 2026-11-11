(function(){
"use strict";
// Daily step-log reader retained for future import flows.
window.DUO_SYNC={
  readStepLog:function(file){
    return new Promise(function(resolve,reject){
      if(!file){reject(new Error("The System cannot read an invisible scroll. Choose a Duo Dungeon step log first."));return}
      if(file.size>5*1024*1024){reject(new Error("That step log is a tome, not a report. Choose a file smaller than 5 MB."));return}
      var reader=new FileReader();
      reader.onerror=function(){reject(new Error("The System tried to read that scroll and got nowhere. Check the file and try again."))};
      reader.onload=function(){
        try{
          var data=JSON.parse(String(reader.result||""));
          var steps=Number(data&&data.steps),date=String(data&&data.date||"");
          if(!data||typeof data!=="object"||!Number.isSafeInteger(steps)||steps<0||steps>100000||!/^\\d{4}-\\d{2}-\\d{2}$/.test(date))throw new Error("That scroll is not a valid daily step report. Choose a Duo Dungeon step log with today's steps and date.");
          resolve({steps:steps,date:date});
        }catch(error){reject(error instanceof SyntaxError?new Error("That scroll is written in a language the System cannot parse. Choose a valid exported step log."):error)}
      };
      reader.readAsText(file);
    });
  }
};
})();