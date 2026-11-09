(function(){
"use strict";
window.DUO_SYNC={
  readDuoLog:function(file){
    return new Promise(function(resolve,reject){
      if(!file){reject(new Error("Choose your duo-log.json file first."));return}
      if(file.size>5*1024*1024){reject(new Error("That log is unusually large. Please choose the original duo-log.json file."));return}
      var reader=new FileReader();
      reader.onerror=function(){reject(new Error("The DuoLog file could not be read."))};
      reader.onload=function(){
        try{
          var data=JSON.parse(String(reader.result||""));
          if(!data||typeof data!=="object"||!Array.isArray(data.sessions))throw new Error("This is not a DuoLog file. Choose the original duo-log.json from Scriptable.");
          var offset=data.offset==null?0:Number(data.offset);
          if(!Number.isSafeInteger(offset)||offset<0)throw new Error("The DuoLog offset is invalid.");
          if(!data.sessions.every(function(session){return session&&typeof session==="object"&&((session.o==null||Number.isFinite(Number(session.o)))&&(session.c==null||Number.isFinite(Number(session.c))))}))throw new Error("The DuoLog contains an invalid session record.");
          var total=data.sessions.length+offset;
          if(!Number.isSafeInteger(total))throw new Error("The fold total is outside the supported range.");
          resolve({total:total,sessionCount:data.sessions.length,offset:offset});
        }catch(error){reject(error instanceof SyntaxError?new Error("The selected file is not valid JSON."):error)}
      };
      reader.readAsText(file);
    });
  }
};
})();