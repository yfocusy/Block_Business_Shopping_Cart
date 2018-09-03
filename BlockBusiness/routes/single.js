var Product = require('../models/products');
var Client = require('../models/clients')
var Cart = require('../models/carts');
var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
router.use(bodyParser.urlencoded({extend:false}));
router.use(bodyParser.json());


router.get('/',function(req, res, next) {
    sample_json = {
        productName:"show sample 1",
        productInfo:"this is a sample info The Cutting Edge Of Comfort And Style Since 1987 this is a sample info The Cutting Edge Of Comfort And Style Since 1987",
        productPrice:"110",
        imgPath: "/images/grid6.jpg"
    };
    // res.render('single');
    res.render('single',sample_json);


});

router.get('/showproduct', function(req, res, next) {

    console.log("Show Product user: ", req.session.user);

    // console.log("Show Product uid: ", req.session.user.uid);

    if(req.session.user == undefined)
    {
        res.redirect('/signup');
    }
    else
    {
        var pid = req.query.pid;
        console.log("pid=");
        console.log(pid);

        var logstr = JSON.stringify({url:req.path});
        console.log(logstr);

        var productName = "";
        var productInfo = "";
        var productPrice = "";
        var imgPath = "";

        Product.findOne({'_id': pid},function(err,response){
            result = response;
            if(result == null)
            {
                return res.json({success:"didn't find the product with pid"});
            }
            else
            {
                selleruid = result.selleruid;
                pid = result._id;
                productName = result.productName;
                productInfo = result.productInfo;
                productPrice = result.productPrice;
                imgPath = result.imgPath;
                productStock = result.productStock;
                sellername = result.sellername;

                console.log("db中找到了pid对应的 product=");
                console.log(productName);
                console.log(productInfo);
                console.log("selleruid = "+ selleruid);

                var product_json = {
                    selleruid:selleruid,
                    pid:pid,
                    productName:productName,
                    productInfo:productInfo,
                    productPrice:productPrice,
                    productStock:productStock,
                    sellername:sellername,
                    imgPath: imgPath,
                    u_name: req.session.user.username,
                    uid:req.session.userid.uid

                };
                res.render('single', product_json);
            }
        });

    }
});

router.post('/delete', function(req, res, next) {
    var pid = req.body.delpid;
    // var pid = req.query.pid;
    console.log("single backend pid=");
    console.log(pid);

    update_json = {$set: { 'productName':"", 'productPrice':"", 'productInfo':"" ,'imgPath':"",'selleruid':"",'pid':"",'uid':""}};



    console.log("-------------------seller删除product， cart 需要更新");

    Product.remove({'_id': pid}, function (err) {
        if (err) {
            res.send({
                err: "delete error from backend",
                msg: "false"
            });
            console.error(err);
        } else {

            // 5.4 bug == single seller删除product， cart 没有更新

            Cart.deleteMany({'pid': pid}, function (err3) {
                if (err3){
                    console.log("--------- 3. 删产品，delete cart---------cart 没有这个pid----");
                    res.send({
                        err: null,
                        msg:pid.toString()
                    });
                }else{
                    console.log("--------- 4. 删产品，delete cart------- 成功-------------");
                    res.send({
                        err: null,
                        msg: "true"
                    });
                }
            });

        }
    });
});


router.get('/edit', function(req, res, next) {

    console.log("edit session user: ", req.session.user);

    // console.log("Show Product uid: ", req.session.user.uid);

    if(req.session.user == undefined)
    {
        res.redirect('/signup');
    }
    else
    {
        var pid = req.query.pid;
        var selleruid = req.query.uid;
        console.log("pid="+pid);
        console.log("=selleruid"+selleruid);

        var logstr = JSON.stringify({url:req.path});
        console.log(logstr);

        // 查数据库：未完继续
        //数据库里边找这条数据，render 这个记录
        var productName = "";
        var productInfo = "";
        var productPrice = "";
        var imgPath = "";

        // 5.1 找到这个product。 而且sid 和 pid 符合。就引导去ejs

        Product.findOne({'_id': pid, selleruid:selleruid},function(err,response){
            result = response;
            if(result == null)
            {
                return res.json({success:"didn't find the product with pid and selleruid to EDIT"});
            }
            else
            {
                selleruid = result.selleruid;
                pid = result._id;
                productName = result.productName;
                productInfo = result.productInfo;
                productPrice = result.productPrice;
                imgPath = result.imgPath;
                productStock = parseInt(result.productStock);

                console.log("db中找到了edit pid对应的 product=");
                console.log(productName);
                console.log(productInfo);
                console.log("selleruid = "+ selleruid);

                var editproduct_json = {
                    selleruid:selleruid,
                    pid:pid,
                    productName:productName,
                    productInfo:productInfo,
                    productPrice:productPrice,
                    productStock:productStock,
                    imgPath: imgPath,
                    u_name: req.session.user.username,
                    uid:req.session.userid.uid

                };
                res.render('editproduct', editproduct_json);
            }
        });

    }
});


router.post('/addtocart', async function(req, res, next) {
    var pid = req.body.pid;
    var uid = req.body.uid;
    var selleruid = req.body.selleruid;
    console.log("/addtocart ==> uid="+uid);
    var productName = req.body.productName;
    var productInfo = req.body.productInfo;
    var productPrice = req.body.productPrice;
    var imgPath = req.body.imgPath;
    var number = parseInt(req.body.number);
    console.log("/*****2 addproduct number =" + number);
    // var pid = req.query.pid;
    console.log("single  addto cart backend pid=");
    console.log(pid);
    console.log("single  addto cart backend productName=");
    console.log(productName);
    console.log("single  addto cart backend uid=");
    console.log(uid);

    // 查询买卖双方的Hash地址 Important
    var buyer = await Client.findOne({'_id':uid})
    var seller = await Client.findOne({'_id':selleruid})

    // 减库存
    Product.findOne({'_id': pid},function(err,response){
        result = response;
        if(result ==null){
            res.send({
                err: "add to cart fail",
            });

        }
        else{// stoch enough
            stockNum = parseInt(result.productStock);
            console.log("stockNum="+stockNum);
            if(stockNum < number){
                res.send({
                    err: "Not enough items in stock",
                });
            }else{
                Cart.findOne({'pid': pid, 'uid':uid},function(err,response){
                    result = response;
                    console.log("Need to creat cart tabele ===== ");
                    if(result == null)
                    {
                        // return res.json({success:"didn't find the product with pid"});
                        var cartentity=new Cart(
                            {
                                pid:pid,
                                uid:uid,
                                selleruid:selleruid,
                                productName:productName,

                                productPrice:productPrice,
                                imgPath:imgPath,
                                number:number,
                                buyerHash:buyer.hash,
                                sellerHash:seller.hash,

                                buyerName:buyer.username,
                                sellerName:seller.username,

                            });
                        cartentity.save();
                        console.log("cartid=");
                        console.log(cartentity._id);
                        var cartid = cartentity._id;
                        if (cartid){

                            newStock = stockNum - number;
                            console.log("--------- bug number="+number);
                            console.log("newStock = "+newStock);

                            Product.update({'_id': pid}, {productStock: newStock},function(err,result){
                                if(err) {
                                    console.log(err);
                                }else{
                                    console.log('更改cart+ Product stock 成功：');

                                    res.send({
                                        // 返回cartid给 处理addto cart的js code
                                        err: null,
                                        msg:"update cart successfully"
                                    });
                                }
                            });






                            // res.send({
                            //     // 返回cartid给 处理addto cart的js code
                            //     err: null,
                            //     msg:cartid.toString()
                            // });
                        }else{
                            res.send({
                                err: "add to cart fail",
                            });
                        }


                    }
                    else
                    {
                        number_incart = parseInt(result.number);
                        console.log("----- db中找到了cart 已有的对应的 product=");
                        console.log(productName);
                        console.log("number_incart=");
                        console.log(number_incart);


                        Cart.update({'pid': pid, 'uid':uid}, {number: number_incart+number},function(err,result){
                            if(err) {
                                console.log(err);
                            }else{
                                console.log('更改cart 成功：', result);
                                newStock = stockNum - number;
                                console.log("newStock = "+stockNum);

                                Product.update({'_id': pid}, {productStock: newStock},function(err,result){
                                    if(err) {
                                        console.log(err);
                                    }else{
                                        console.log('更改cart+ Product stock 成功：', result);

                                        res.send({
                                            // 返回cartid给 处理addto cart的js code
                                            err: null,
                                            msg:"update cart successfully"
                                        });
                                    }
                                });

                                // res.send({
                                //     // 返回cartid给 处理addto cart的js code
                                //     err: null,
                                //     msg:"update cart successfully"
                                // });
                            }
                        });

                    }
                });
            }








        }


    });




    //4.28 bug 写不进去DB

    // Cart.findOne({'pid': pid, 'uid':uid},function(err,response){
    //     result = response;
    //     console.log("Need to creat cart tabele ===== ");
    //     if(result == null)
    //     {
    //         // return res.json({success:"didn't find the product with pid"});
    //         var cartentity=new Cart({pid:pid, uid:uid, selleruid:selleruid, productName:productName, productInfo:productInfo,productPrice:productPrice,imgPath:imgPath,number:number});
    //         cartentity.save();
    //         console.log("cartid=");
    //         console.log(cartentity._id);
    //         var cartid = cartentity._id;
    //         if (cartid){
    //             res.send({
    //                 // 返回cartid给 处理addto cart的js code
    //                 err: null,
    //                 msg:cartid.toString()
    //             });
    //         }else{
    //             res.send({
    //                 err: "add to cart fail",
    //             });
    //         }
    //
    //
    //     }
    //     else
    //     {
    //         number_incart = result.number;
    //         console.log("----- db中找到了cart 已有的对应的 product=");
    //         console.log(productName);
    //         console.log("number_incart=");
    //         console.log(number_incart);
    //
    //
    //         Cart.update({'pid': pid, 'uid':uid}, {number: number_incart+number},function(err,result){
    //             if(err) {
    //                 console.log(err);
    //             }else{
    //                 console.log('更改cart 成功：', result);
    //
    //                 res.send({
    //                     // 返回cartid给 处理addto cart的js code
    //                     err: null,
    //                     msg:"update cart successfully"
    //                 });
    //             }
    //         });
    //
    //     }
    // });





});



module.exports = router;
