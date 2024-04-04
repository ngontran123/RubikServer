import * as express from 'express'
import {user,room_user,user_room_detail,rubik_info,image_detail,role} from '../models/user_model';
import checkingDuplicateUserNameOrEmail from '../config/checking';
import {token_checking,email_token_checking} from '../config/checkingToken';
import {username,password,registerUrl,loginUrl,registerServerUrl} from './gmail_account';
import { DateTime } from 'luxon';
import mongoose from 'mongoose';
var router = express.Router();
var config=require('../config/auth');
var jwt=require('jsonwebtoken');
var nodemailer=require('nodemailer');
/* GET home page. */
const bcrypt=require('bcrypt');
const crypto=require('crypto');
const uuid=require('uuid');
const cheerio=require('cheerio');
var axios= require('axios');
const Cube= require('cubejs');
const transportEmail=nodemailer.createTransport({
    service:'gmail',
    auth:{
      user:username,
      pass:password
    }
  });

const hbs=require('nodemailer-express-handlebars');
const path=require('path');
const handlebarsOption={
    viewEngine :{
        partialsDir: path.resolve('../sudokusv/src/views/'),
        defaultLayout: false,
    },
    viewPath:path.resolve('../sudokusv/src/views/')
};

transportEmail.use('compile',hbs(handlebarsOption));
 router.post('/verify',checkingDuplicateUserNameOrEmail,function(req,res,next){
    var new_user=req.body;
    let email_payload=
    {
      username:new_user.username,
      email:new_user.email
    };

    let email_token=jwt.sign(email_payload,config.secret,{expiresIn:300});
    console.log(email_token);
    console.log('verify:'+new_user.username+' '+new_user.password+' '+new_user.gender+' '+new_user.email);    
    const emailContentConfig={
        from:'huynhkiengquan@gmail.com',
        template:'email_template',
        to:new_user.email,
        subject:'Email verification',
        context:{
            username:new_user.username,
            link:`${registerServerUrl}?username=${new_user.username}&password=${encodeURIComponent(new_user.password)}&gender=${new_user.gender}&email=${new_user.email}&token=${encodeURIComponent(email_token)}`
        }
       };
       transportEmail.sendMail(emailContentConfig,(error,info)=>{
        if(error)
        {  
           throw Error(error);
        }
        console.log("Send mail successfully:"+info);
       });
       res.status(200).send({'message':'Vui lòng vào email của bạn để xác thực tài khoản.'});
 });



const colorToFace=(color:string)=>
{
 try
 { 
  var res='';
  switch(color)
  {
    case 'whitesmoke':res='U';break;
    case 'orange':res='L';break;
    case 'green': res='F';break;
    case 'red':res='R';break;
    case 'blue':res='B';break;
    case 'yellow':res='D';break;
  }
  return res;
 }
 catch(err)
 {
  return err;
 }
}

const convertRubikAnno=(colors:string[])=>
{
  try
  { 
    var res='';
     for(let color in colors)
     {
       var convert_color=colorToFace(color);
       if(convert_color!='')
       {
        res+=convert_color;
       }
     }
     return res;
     
  } 
  catch(error)
  {
    return error.message;
  }
};

router.post('/register',email_token_checking,function(req, res, next) {
   const new_user={
    username:'',
    password:'',
    gender:'',
    email:'',
    avatar:'',
    created_date:'',
    display_name:'',
    motto:''
   };
   new_user.username=req.query.username;
   new_user.password=bcrypt.hashSync(req.query.password,8);
   new_user.gender=req.query.gender;
   new_user.email=req.query.email;
   new_user.avatar='https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png';
   new_user.created_date=DateTime.now().toLocaleString(DateTime.DATE_FULL);
   new_user.display_name=req.query.username;
   console.log('register:'+new_user.username+' '+new_user.password+' '+new_user.gender+' '+new_user.email);
   if(new_user.username==='' || new_user.password===''||new_user.gender===''||new_user.email==='')
   {
    res.redirect(301,`${loginUrl}?email=${new_user.email}`);
   }
   else{
   const register_user=new user(new_user);
   try{
    register_user.save((err,doc)=>{
        if(err)
        {
            return console.error(err);
        }
        res.redirect(301,`${loginUrl}?email=${new_user.email}`);
    });
    console.log(new_user);
   }
   catch(error)
   {
    res.status(404).json({message:error});
   }
}
}
);

router.get('/login',function(req,res,next){
    try{
        var email=req.query.email;
        user.findOne({email:email}).exec((err,user_valid)=>{
         if(err)
         {
            throw err
         }
         if(user_valid)
         {
            res.status(201).send({message:"Đã đăng ký thành công"});
         }
         else{
            res.status(409).send({message:"Đăng ký thất bại."});
         }
        });
    }
    catch(error)
    {
    res.status(404).json({message:error});
    }
});

router.get('/add-account',token_checking,function(req,res,next){
  try{
    res.status(200).send({status:true,message:'Get page successfully.'});
  }
  catch(error)
  {
  res.status(401).send({status:false,message:error.message});
  }
});

  

router.post('/add-account',async function(req,res,next)
{
try
{  
  var username=req.body.username;
  var password=bcrypt.hashSync(req.body.password,8);
  var gender=req.body.gender;
  var email=req.body.email;
  var avatar_url=req.body.avatar;
  var role_id=req.body.role_id;
  
  var check_exist=await user.find({$or:[{username:username},{email:email}]}).exec((err,data)=>{
   if(err)
   {
    throw err;
   }

   if(data[0].username==username)
   {
     return res.status(401).send({status:false,message:'This username existed in the system.'});
   }
   else
   {
   return res.status(401).send({status:false,message:'This email existed in the system.'});
   }
  });

  var account_obj=
  {
  username:username,
  password:password,
  gender:gender,
  email:email,
  avatar:avatar_url,
  created_date:new Date().toLocaleString(),
  role_id:role_id
  }
  var account=new user(account_obj);
  account.save((err,data)=>{
   if(err)
   {
    throw(err);
   } 
  return res.status(200).send({status:true,message:'Add account successfuly',data:data});
  });
}
catch(err)
{
  console.log('There is error while adding new account');
  return res.status(401).send({stauts:false,message:err.message});
}
});

router.post('/login',function (req,res,next){
 try{
   console.log("Username here is:"+req.body.username);
  //   var user_object=
  //   {
  //    username:'helloman123',
  //    password:'$2b$08$w1sjTXM8kcjfDxaBPRJtP.8a.CMKZzqpGQE9LRhjPhV/L3BRIThC2',
  //    email:'helloman123@gmail.com',
  //    gender:'male',
  //    avatar:'https://gw.alipayobjects.com/zos/rmsportal/BiazfanxmamNRoxxVxka.png',
  //    created_date:new Date().toLocaleString(),
  //    role_id:0
  //   };
  //   var role_ob=
  //   {
  //    role_type:'Admin'
  //   };
  //   var role_user=
  //   {
  //     role_type:'User'
  //   };
  //   var create_role_admin=new role(role_ob);
  //   var create_role_user= new role(role_user);
  //   create_role_admin.save((err,data)=>{
  //     if(err)
  //     {
  //       throw err;
  //     }
  //   });
   
  //   create_role_user.save((err,data)=>{
  //  if(err)
  //  {
  //   throw err;
  //  }
  //   });
  //   var create_user=new user(user_object);
  //   create_user.save((err,data)=>{
  //     if(err)
  //     {
  //       throw err;
  //     }
  //   });
    
    user.findOne({username:req.body.username}).exec((err,userr)=>{
        if(err)
        {    
            console.log("Error while fetching user");
            return;
        }
        if(!userr)
        {  return res.status(401).send({message:"Username do not exist"});
        }
    var passwordIsValid=bcrypt.compareSync(req.body.password,userr.password);
    if(!passwordIsValid)
    {  
        return res.status(401).send({message:"Password is invalid"});
    }
    const jwt_payload=
    {
        user_id:userr.id,
        username:userr.username
    }
    var token=jwt.sign(jwt_payload,config.secret,{expiresIn:'1h'});
    req.session.token=token;
    return res.status(200).send({message:"Đăng nhập thành công",token:req.session.token,data:userr});
    })
  }
  catch(err)
  {
    res.status(401).send({status:false,message:err.message});
  }
});



router.post('/auth/verify',function(req,res,next){
    try{
    let token=req.body.token;
    let decoded_token=jwt.verify(token,config.secret);
    console.log(decoded_token);
    user.findOne({username:decoded_token.username}).exec((err,userr)=>{
   if(err)
   {
    throw err;
   }
   if(userr)
   {
    res.status(200).send({message:userr});
   }
   else{
    res.send({message:'Invalid'});
   }
    });
}
catch(error)
{
    console.log('There is '+error+' during the process.');
}
});

router.get('/join',token_checking,function(req,res,next)
{
    return res.status(200).send({user:''});
});

router.get('/hall',token_checking,function(req,res,next){
  return res.status(200).send({user:''});
});

router.get('/level',token_checking,function(req,res,next){
 return res.status(200).send();
});

router.get('/user_profile/:username',token_checking,function(req,res,next)
{
     try
     {
      var user_name=req.params.username;
      if(user_name.trim()!="" && user_name!=null)
      {
        user.findOne({username:user_name}).exec((err,user)=>{
          if(err)
          {
            console.log("error:"+err);
            throw err;
          }
         if(!user)
         {
            res.status(404).send({message:'Không tìm thấy user này'});
         }
        else{
            res.status(200).send({message:'OK'});
        }
        });
      }
     }
     catch(error)
     {
        throw error;
     }
     
});


 router.get('/profile/:username',token_checking,function(req,res,next){
     try
     {
      var username=req.params.username;
      res.status(200).send({status:true,message:`Get profile ${username} successfully.`});
     }
     catch(error)
     {
      res.status(401).send({status:false,message:error.message});
     }
 });

const delay=ms=>new Promise(rs=>setTimeout(rs,ms));

const get_statistic_by_level=async(username:string,level:string)=>
{
try
{
 var username=username; 
    var user_exist=await user.findOne({username:username});
    var user_id=user_exist._id;
    var list_res=[];
    var room_handle=await room_user.aggregate([
      {
          $group:{
            _id:"$_id",
            "level_push":{$push:"$level_id"}
          }
      },
      {
         $match:
         {
             "level_push":
             {
              //$all:[getIdGameLevel(level)]
             }
         }
      }
    ]).exec((err,db)=>{
      if(err)
      {
        throw(err);
      }
      var num=db.length;
      if(num>0)
      { 
        var rooms=[];
        for(let i=0;i<num;i++)
        {
         rooms.push(db[i]._id);
        }
        var count_win=user_room_detail.countDocuments({
          status:"Win",
          user_id:user_id,
          room_id:{$in:rooms},
        },(err,count)=>{
          var num_lose=rooms.length-count;
          list_res.push(count,num_lose);
          return list_res;
        });
      }
      else
      {
       list_res.push(0,0);
       return list_res;
      }
    });
    while(list_res.length==0)
    {
      await delay(100);
    }
    return list_res;
}
catch(err)
{
  console.log(err);
}
}

router.get('/statistics/:username',token_checking,async function(req,res,next)
{
  try
  {
   var username=req.params.username;
   console.log(username);
   var list_easy=await get_statistic_by_level(username,'Easy');
   var list_medium=await get_statistic_by_level(username,'Medium');
   var list_hard=await get_statistic_by_level(username,'Hard');
   var list_extreme=await get_statistic_by_level(username,'Extreme');
   console.log('Easy'+" "+list_easy);
   console.log('Medium'+" "+list_medium);
   console.log('Hard'+" "+list_hard);
   console.log('Extreme'+" "+list_extreme);

   res.status(200).send({easy_win:list_easy[0],easy_lose:list_easy[1],medium_win:list_medium[0],medium_lose:list_medium[1],hard_win:list_hard[0],hard_lose:list_hard[1],extreme_win:list_extreme[0],extreme_lose:list_extreme[1]});
  }
  catch(err)
  {
    console.log("Statistic error:"+err);
  }
});

router.post('/auth',token_checking,function(req,res,next){
   res.status(200).send({message:'OK'});
});

router.put('/user_detail/:username',token_checking,async function(req,res,next)
{
 try{
    var data=req.body;
    console.log("motto:"+data.motto);
    console.log("display_name:"+data.display_name);
    if(username.trim()!="" && username!=null)
    {  
    await user.updateOne(
        {username:data.username},
        {$set:{display_name:data.display_name,
            motto:data.motto,
            avatar:data.avatar,
            gender:data.gender}}
    );
    user.findOne({username:data.username}).exec((err,user)=>
    {  if(user)
        {
     res.status(200).send({message:user});  
        }
    });
}
 }
 catch(err)
 {  res.status(404).send({message:"Cập nhật dữ liệu thất bại:"+err.toString()});
    throw err;
 }
});

router.post('/user_detail/:username',token_checking,function(req,res,next)
{
  try
  { 
    var token=uuid.v4();    
    var current_time=Date.now();
    var expire=(current_time/1000)+2400;
    var signature=crypto.createHmac('sha1','private_/h5OYTyHT+iEuJ9X4d4SXbe6w4E=').update(token+expire).digest('hex');
    res.set({
        "Access-Control-Allow-Origin" : "*"
    });
    res.status(200).send({token:token,expire:expire,signature:signature});
  }
  catch(err)
  {
    throw err;
  }
});
router.get('/user_detail/:username',token_checking,function(req,res,next)
{
 try
 {  
    var user_name=req.params.username;
    if(user_name.trim()!="" && user_name!=null)
      {
        user.findOne({username:user_name}).exec((err,user)=>{
          if(err)
          {
            console.log("error:"+err);
            throw err;
          }
         if(!user)
        {
            res.status(404).send({message:'Không tìm thấy user này'});
        }
        else
        {
            res.status(200).send({message:'OK'});
        }
        });
      }
 }
 catch(err)
 {
   console.log("error:"+err);
 }
});


router.get('/about',token_checking,function(req,res,next)
{
  try
  {
    res.status(200).send({status:true,message:'Request success'});
  }
  catch(err)
  {
    console.log('Error loading About page:'+err);
  }
});


var downloadImageFromUrl=async(url:string,outputDir:string)=>
{
  try
  { 
  var response = await axios.get(url,{responseType: 'text'});
  const html = response.data;
  var $=cheerio.load(html);
  console.log($.html());
  var imageUrl:string[]=[];
  $('img').each(async(index,ele)=>
  {
      const src=$(ele).attr('src');
      if(src)
      {
        imageUrl.push(src);
      }
  })
  }
  catch(error)
  {
    console.log("download image error:"+error.message);
  }
  return imageUrl;
}

router.get('/get-rubik',token_checking,async function(req,res,next)
{
 try
 {
   await rubik_info.find({}).exec((err,element)=>{
    if(err)
    {
      throw err;
    }
    res.status(200).send({status:true,list:element,message:'Lay danh sach rubik thanh cong'});
   });
 }
 catch(err)
 { res.status(401).send({status:false,list:[],message:err.message});
   console.log('Get ruibk list error:'+err.message);
 }
});

router.get('/product-details/:id',token_checking,async function(req,res,next){
 try
 {
  var rubik_id=req.params.id;

  console.log("did here");
  console.log("rubik_id here is:"+rubik_id);
  await rubik_info.findOne({name:rubik_id}).exec((err,ele)=>
  {
   if(err)
   {
    throw err;
   }
   console.log("data here is:"+ele);
   res.status(200).send({status:true,message:'Lay du lieu rubik thanh cong.',data:ele});
  });
 }
 catch(error)
 {
  res.status(401).send({status:false,message:error.message});
  console.log("Get rubik by id error:"+error.message);
 }
});


router.get('/rubik-solve/:name',token_checking,async function(req,res,next)
{
  try
  {
  var rubik_name=req.params.name;
  res.status(200).send({status:true,message:`Token is valid for ${rubik_name} page.`});
  }
  catch(err)
  {
    res.status(401).send({status:false,message:err.message});
  }
  
});


router.post('/product',token_checking,async function(req,res,next)
{
  try{ 
  var rubik_name=req.body.productname;
  var rubik_description=req.body.description;
  var avatar_url=req.body.url;
  var rubik_feature=req.body.feature;

  var check_exist=await rubik_info.find({name:rubik_name}).exec((err,data)=>{

    if(err)
    {
      throw err;
    }
    res.status(401).send({status:false,message:'This product name already existed in the system.'});
  });

  var rubik_ob=
  {
     name:rubik_name,
     description:rubik_description,
     avatar:avatar_url,
     feature:rubik_feature
  };
  var product=new rubik_info(rubik_ob);
  product.save((err,data)=>
  {
     if(err)
     {
      throw err;
     }
     res.status(200).send({status:true,message:'Add product successfully',data:data});
  });
} 
catch(err)
{ 
  res.status(401).send({status:false,message:err.message});
  console.log('There is error while creating the product:'+err.message);
}
});

router.get('/product',token_checking,function(req,res,next){
    try
    {
   res.status(200).send({status:true,message:'Load Add-Product page success'});
    }
    catch(error)
    {
      console.log('Error loading add-product page.');
    }
});

router.get('/download_img',async function(req,res,next)
{
  try
  {
  console.log('This api has been called');
  const url='https://rubiks.com/en-US/products/';
  var imageList=await downloadImageFromUrl(url,'');
  console.log("The size of image list is:"+imageList.length);
  if(imageList!=null)
  {
    imageList.forEach((val,idx)=>
    { 
    });
  }
  else
  {
    console.log('The Image List is null');
  }
  }
  catch(error)
  {
    console.log('get img error:'+error.message);
  }
});

module.exports = router;