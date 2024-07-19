const log4j=require('log4js');
const path = require('path');

const getLogFileName=()=>{
const currentDateTime=new Date().toISOString().slice(0,10);
return path.join(process.cwd(),`/src/log/app_log_${currentDateTime}.log`)
};

log4j.configure({
    appenders:{
        logFile:{
            type:'dateFile',
            filename:getLogFileName(),
            pattern:'.yyyy-MM-dd',
            keepFileExt:true,
            alwaysIncludePattern:true,
            flag:'w',
            layout:{
                type:'basic'
            },
        }
    },
    categories:{
        default:{
            appenders:['logFile'],
            level:'info'
        }
    }
});

const logger=log4j.getLogger();

module.exports=logger;