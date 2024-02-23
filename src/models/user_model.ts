import mongoose from "mongoose";
var autoIncrement=require('mongoose-auto-increment');
const {Schema}=mongoose;
const userSchema=new Schema({
    _id:{type:Number,required:false},
    username:{type:String,required:true},
    password:{type:String,require:true},
    gender:{type:String,required:true},
    email:{type:String,required:true},
    avatar:{type:String,required:true},
    created_date:{type:String,required:true},
});
autoIncrement.initialize(mongoose.connection);
userSchema.plugin(autoIncrement.plugin,'user');
const user=mongoose.model('user',userSchema,'User');

const questionLevelSchema=new Schema({
    _id:{type:Number,required:false},
    level:{type:String,required:true}
});

questionLevelSchema.plugin(autoIncrement.plugin,'question')

const roomSchema=new Schema({
    _id:{type:String,required:false},
    room_name:{type:String,required:true},
    created_date:{type:String,required:true},
    level_id:{type:Number,required:true},
    score:{type:String,required:true}
})

const userRoomDetailSchema=new Schema({
    _id:{type:Number,required:false}, 
    room_id:{type:Number,required:true},
    user_id:{type:Number,required:true},
    status:{type:String,required:true}
});

const rubikInfoSchema = new Schema({
    _id:{type:Number,required:false},
    name:{type:String,require:true},
    description:{type:String,require:true},
    avatar:{type:String,require:true},
    feature:{type:String,require:true}
})

const detailImageSchema = new Schema({
 _id:{type:Number,require:false},
 rubik_id:{type:Number,require:true},
 _url:{type:String,require:true},
});

const singleBoardDetailSchema=new Schema({
_id:{type:Number,required:false},
user_id:{type:Number,required:true},
level_id:{type:Number,require:true},
time_complete:{type:String,require:true}
});

const question_level=mongoose.model('question',questionLevelSchema,'QuestionLevel');

roomSchema.plugin(autoIncrement.plugin,'room');

userRoomDetailSchema.plugin(autoIncrement.plugin,'userRoomDetail');

singleBoardDetailSchema.plugin(autoIncrement.plugin,'singleBoardDetail');

rubikInfoSchema.plugin(autoIncrement.plugin,'rubikInfo');
detailImageSchema.plugin(autoIncrement.plugin,'detailImage');



const room_user=mongoose.model('room',roomSchema,'Room');

const user_room_detail=mongoose.model('userRoomDetail',userRoomDetailSchema,'UserRoomDetail');

const single_board_detail=mongoose.model('singleBoardDetail',singleBoardDetailSchema,'SingleBoardDetail');

const rubik_info=mongoose.model('rubikInfo',rubikInfoSchema,'RubikInfo');

const image_detail=mongoose.model('detailImage',detailImageSchema,'DetailImage');

export {user,question_level,room_user,user_room_detail,single_board_detail,rubik_info,image_detail};

