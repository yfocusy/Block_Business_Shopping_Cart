function removeFromCart(i){
    console.log("i=");
    console.log(i);

    //1. hide page
    var pid = document.getElementById("pid"+i.toString()).innerText;
    console.log("pid=");
    console.log(pid);
    var uid = document.getElementById("uid").innerText;
    var removeNum = document.getElementById("oneItemIncartNum").innerText.valueOf();
    console.log("removeNum="+removeNum)

    console.log("uid want remove ==> uid=");
    console.log(uid);

    delFromCart_json = {pid:pid,uid:uid,removeNum:removeNum};
    //2. delete from database
    $.ajax({
        type: 'POST',
        url: '/checkout/delfromcart',
        contentType: "application/json",
        dataType: 'json',
        data: JSON.stringify(delFromCart_json),
        success: function (data) {
            if (data.msg){
                $(document).ready(function(){
                    $('.cart-header'+i.toString()).fadeOut('slow', function() {
                        $('.cart-header'+i.toString()).remove();
                    });
                });
                window.alert("delete from cart successfully.");
                window.location.href = "/checkout?uid="+uid;
            }
        },
        error: function (err) {
            console.log(err.message);
        }
    });
}

function  placeorder(cartInfo_list) {
    console.log(" cartInfo_list=");
    console.log(cartInfo_list);

    block_json = cartInfo_list;
    $.ajax({

        type: 'POST',
        url: '/checkout/placeorder',
        contentType: "application/json",
        dataType: 'json',
        //data: JSON.stringify(cartInof_json)
        data: JSON.stringify(block_json),
        success: function (data) {
            // console.log("success delete frontend!!!");
            // console.log(data.msg);
            if (data.msg){
                //
                window.alert(data.msg);

                window.location.href = "/ProfileControl";

            }else if (data.err){
                window.alert(data.err);
            }

        },
        error: function (err) {
            console.log(err.message);

        }
    });
}
