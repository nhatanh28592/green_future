$(document).ready(function(){
    $("button.type").click(function(){
        $("div.btn-add").hide();
        $("div.map").hide();
        $("#map_setting").hide();
        $("button.add").attr('data-target','#modalProduct');
        $.ajax({
            type: 'POST',
            url: "/get_all_type",
            async: true,
            data:JSON.stringify({
                id: null
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
                renderType(data);
            },
            error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
                return false;
            }
        });
    });

    $("button.product").click(function(){
        $("div.map").hide();
        $("div.btn-add").show();
        $("#map_setting").hide();
        $("button.add").attr('data-target','#modalProduct');
        $.ajax({
            type: 'POST',
            url: "/admin_product",
            async: true,
            data:JSON.stringify({
                id: null
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
                renderTableProduct(data.data);
            },
            error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
                return false;
            }
        });
    });

    $("button.product_booking").click(function(){
        $("#map_setting").show();
        $("div.btn-add").hide();
        $("div#map").hide();
        $.ajax({
            type: 'POST',
            url: "/admin_product_booking",
            async: true,
            data:JSON.stringify({
                id: null
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
                renderTableProductBooking(data.data);
            },
            error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
                return false;
            }
        });
    });

    $("button.user").click(function(){
        $("div.map").hide();
        $("#map_setting").hide();
        $("div.btn-add").hide();
        $.ajax({
            type: 'POST',
            url: "/admin_user",
            async: true,
            data:JSON.stringify({
                id: null
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
                renderTableUser(data.data);
            },
            error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
                return false;
            }
        });
    });

    $("div.data").on("click", "button.btn_edit", function() {
        var productId = $(this).next().val();
        $.ajax({
            type: 'POST',
            url: "/product_info_edit",
            async: true,
            data:JSON.stringify({
                productId: productId
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
                var productData = data.product;
                var typeData = data.type_data;
                var typeMainData = data.type_main_data;
                var htmlType = "";
                var htmlTypeMain = "";
                var htmlColor = "";

                for (var i = 0; i < typeData.length; i++) {
                    var type = typeData[i];
                    htmlType += '<option value="' + type._id + '">' + type.name + '</option>';
                }

                for (var i = 0; i < typeMainData.length; i++) {
                    var typeMain = typeMainData[i];
                    htmlTypeMain += '<option value="' + typeMain._id + '">' + typeMain.name + '</option>';
                }

                for (var i = 0; i < productData.info_product.color.length; i++) {
                    var color = productData.info_product.color[i];
                    htmlColor += '<input type="color" value="' + color + '" class="form-control" name="color"><button class="btn btn-danger">Delete</button>';
                }

                $("select[name='type']", "#modalProductEdit").empty();
                $("select[name='type']", "#modalProductEdit").append(htmlType);
                $("select[name='type']", "#modalProductEdit").val(data.type);

                $("select[name='type_main']", "#modalProductEdit").empty();
                $("select[name='type_main']", "#modalProductEdit").append(htmlTypeMain);
                $("select[name='type_main']", "#modalProductEdit").val(data.type_main);

                $("div.color", "#modalProductEdit").empty();
                $("div.color", "#modalProductEdit").append(htmlColor);

                $("input[name='name']", "#modalProductEdit").val(productData.info_product.name);
                $("input[name='price']", "#modalProductEdit").val(productData.info_product.price);
                $("input[name='description']", "#modalProductEdit").val(productData.info_product.description);

                $("input[name='product_id']", "#modalProductEdit").val(productData._id);

            },
            error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
                return false;
            }
        });
    });

    $("div.data").on("change", "select#type_main_add", function() {
        var typeMain = $(this).val();
        $.ajax({
          type: 'POST',
          url: "/get_type_by_type_main",
          async: true,
          data:JSON.stringify({
            type_main: typeMain
          }),
          dataType: 'json',
          contentType: 'application/json; charset=utf-8',
          success: function (data) {  
            var html = "";
            for (var i= 0; i < data.data.length; i++) {
              var type = data.data[i];
              html += '<option value="' + type._id + '">' + type.name + '</option>'
            }
            $("input[name='type_main_id']").val(data.type_main_id);
            $("select#type_add").empty();
            $("select#type_add").append(html);
          },
          error: function (xhr, ajaxOptions, thrownError) { 
            alert("error");
          }
        });
    });

    $("button.save_type_main").click(function() {
        var name = $("input[name='type_main_name']").val();
        if(name) {
            $.ajax({
              type: 'POST',
              url: "/add_type_main",
              async: true,
              data:JSON.stringify({
                name: name
              }),
              dataType: 'json',
              contentType: 'application/json; charset=utf-8',
              success: function (data) {  
                var html = '<option value="' + data._id + '">' + data.name + '</option>';
                $("select#type_main_add").append(html);
                $("select#type_main_add").val(data._id);
                $("input[name='type_main_name']").val('');
                $("input[name='type_main_id']").val(data._id);
                $("select#type_add").empty();
                swal({
                   title: "Thông báo",
                   text: "Thêm Dòng Sản Phẩm Thành Công",
                   type: "success",
                   confirmButtonText: "close"
                });
              },
              error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
              }
            });
        } else {
            swal({
             title: "Thông báo",
             text: "Vui lòng nhập tên Dòng Sản Phẩm !",
             type: "error",
             confirmButtonText: "close"
            }); 
        }
    });

    $("button.save_type").click(function() {
        var typeMain = $("input[name='type_main_id']").val();
        var name = $("input[name='type_name']").val();
        if (name) {
            $.ajax({
              type: 'POST',
              url: "/add_type",
              async: true,
              data:JSON.stringify({
                type_main: typeMain,
                name: name
              }),
              dataType: 'json',
              contentType: 'application/json; charset=utf-8',
              success: function (data) {  
                var html = '<option value="' + data._id + '">' + data.name + '</option>';
                $("select#type_add").append(html);
                $("input[name='type_name']").val('');
                swal({
                   title: "Thông báo",
                   text: "Thêm Loại Sản Phẩm Thành Công",
                   type: "success",
                   confirmButtonText: "close"
                });
              },
              error: function (xhr, ajaxOptions, thrownError) { 
                alert("error");
              }
            });
        } else {
            swal({
             title: "Thông báo",
             text: "Vui lòng nhập tên Loại Sản Phẩm !",
             type: "error",
             confirmButtonText: "close"
            });
        }
    });

    $("div.data").on("click", "button.btn_delivery", function() {
        $("input[name='product_booking_id']").val($(this).next().val());
    });

    $("button.delivery_success").click(function(){
        var id = $(this).next().val();
        $.ajax({
          type: 'POST',
          url: "/delivery_update",
          async: true,
          data:JSON.stringify({
            id: id
          }),
          dataType: 'json',
          contentType: 'application/json; charset=utf-8',
          success: function (data) { 
            $("button.close_delivery_modal").click(); 
            swal({
               title: "Thông báo",
               text: "Chỉnh sửa tình trạng đơn hàng thành công!",
               type: "success",
               confirmButtonText: "close"
            });
            $("button.product_booking").click();
          },
          error: function (xhr, ajaxOptions, thrownError) { 
            alert("error");
          }
        });
    });
});

function renderTableProduct(data) {
    var htmlTbStart = "";
    htmlTbStart += '<table class="table table-striped" style=""><thead><tr><th style="width:4%">Id</th><th style="width:38%">Tên sản phẩm</th><th style="width:38%">Hình ảnh</th><th style="width:10%"></th><th style="width:10%"></th></thead><tbody class="">';

    var htmlTbBody = "";
    for (var i = 0; i < data.length; i++) {
        var product = data[i];
        htmlTbBody += '<tr>';
        htmlTbBody += '<td>' + product._id + '</td>';
        htmlTbBody += '<td>' + product.info_product.name + '</td>';
        htmlTbBody += '<td><img src="upload/'+ product.info_product.main_file + '" width="50px" height="50px"></td>';
        htmlTbBody += '<td class="text-center"><button type="button" data-toggle="modal" data-target="#modalProductEdit" class="btn_edit btn btn-info"><span class="glyphicon glyphicon-edit"></span></button><input type="hidden" name="product_id" value="' + product._id + '"></td>';
        htmlTbBody += '<td class="text-center"><button type="button" class="btn btn-danger"><span class="glyphicon glyphicon-trash"></span></button></td>';
        htmlTbBody += '</tr>';
    }

    var htmlTbEnd = "";
    htmlTbEnd += '</tbody></table>';
    $("div.data").empty();
    $("div.data").append(htmlTbStart + htmlTbBody + htmlTbEnd);
}

function renderTableProductBooking(data) {
    var htmlTbStart = "";
    htmlTbStart += '<table class="table table-striped" style=""><thead><tr><th style="width:5%">Id</th><th style="width:70%">Thông tin đơn hàng</th><th style="width:20%">Tình Trạng</th><th style="width:5%"><span class="glyphicon glyphicon-map-marker"></span></th></thead><tbody class="">';

    var htmlTbBody = "";
    for (var i = 0; i < data.length; i++) {
        var productBooking = data[i];
        var date = "";
        var deliveryFlag = productBooking.info_personal.delivery_flag;
        if (productBooking.info_booking.length > 0) {
            var info = productBooking.info_booking[0].product_info[0];
            date = info.date;
        }
        var totalPrice = 0;
        htmlTbBody += '<tr>';
        htmlTbBody += '<td>' + productBooking._id + '</td>';
        htmlTbBody += '<td>';
        htmlTbBody += '<label style="color:red">NGÀY ĐẶT HÀNG: </label> ' + date + '<br>';
        htmlTbBody += '<label>THÔNG TIN KHÁCH HÀNG: </label> <br><label>Tên: </label> ' + productBooking.info_personal.name + '<br>';
        htmlTbBody += '<label>Email: </label> ' + productBooking.info_personal.email + '<br>';
        htmlTbBody += '<label>SDT: </label> ' + productBooking.info_personal.mobile + '<br>';
        htmlTbBody += '<label>Địa chỉ: </label> ' + productBooking.info_personal.address ;
        htmlTbBody += '<br><label style="color:red">ĐƠN HÀNG: </label> ' ;
        for (var j = 0; j < productBooking.info_booking.length; j++) {
            productBookingInfo = productBooking.info_booking[j];
            for (var k = 0; k < productBookingInfo.product_info.length; k++) {
                var productInfo = productBookingInfo.product_info[k];
                var totalItem = parseInt(productInfo.price)*parseInt(productInfo.number);
                totalPrice += totalItem;
                htmlTbBody += '<div class="card">';
                htmlTbBody += '<img src="upload/' + productInfo.main_file + '" width="50px" height="50px" style="padding: 2px;">';
                htmlTbBody += '<div style="margin-left:53px;"> <label>Tên sản phẩm: </label> ' + productInfo.name + '<br>';
                htmlTbBody += '<label>Số lượng: </label> ' + productInfo.number + '<br>';
                htmlTbBody += '<label>Giá: </label> ' + productInfo.price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + ' VND <br>';
                htmlTbBody += '<label>Thành tiền: </label><span style="color:red" > ' + totalItem.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + ' VND</span></div></div>';
                if(k != (productBookingInfo.product_info.length -1)) {
                    htmlTbBody += '<br>';
                }
            }
        }
        htmlTbBody += '<br><label>TỔNG CỘNG: </label><span style="color:red" > ' + totalPrice.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + ' VND</span>';
        htmlTbBody += '</td>';
        htmlTbBody += '<td>';
        if (deliveryFlag == "0") {
            htmlTbBody += '<span style="color: green">Chưa giao hàng</span> <button type="button" data-toggle="modal" data-target="#deliveryUpdate" class="btn_delivery btn btn-info"><span class="glyphicon glyphicon-cog"></span></button> <input type="hidden" value="' +  productBooking._id + '">';
        } else {
            htmlTbBody += '<span style="color: red;text-decoration: line-through;">Đã giao hàng</span>';
        }
        htmlTbBody += '</td>';
        htmlTbBody += '<td class="text-center"><label class="checkbox-inline"><input type="checkbox" class="map_point" value="' + productBooking.info_personal.address + '"></label></td>';
        htmlTbBody += '</tr>';
    }

    var htmlTbEnd = "";
    htmlTbEnd += '</tbody></table>';
    $("div.data").empty();
    $("div.data").append(htmlTbStart + htmlTbBody + htmlTbEnd);
}

function renderTableUser(data) {
    var htmlTbStart = "";
    htmlTbStart += '<table class="table table-striped" style=""><thead><tr><th style="width:10%">Hình ảnh</th><th style="width:38%">User name</th><th style="width:38%">Loại đăng ký</th><th style="width:10%"></th><th style="width:10%"></th></thead><tbody class="">';

    var htmlTbBody = "";
    for (var i = 0; i < data.length; i++) {
        var user = data[i];
        htmlTbBody += '<tr>';
        if (user.facebook_id) {
            htmlTbBody += '<td><img src="http://graph.facebook.com/' + user.facebook_id + '/picture?type=normal" width="50px" height="50px" style="padding: 2px;border-radius:50%;"></td>';
        } else {
            htmlTbBody += '<td><img src="' + user.picture + '" width="50px" height="50px" style="padding: 2px;border-radius:50%;"></td>';
        }
        htmlTbBody += '<td>' + user.user_name + '</td>';
        if(user.facebook_id) {
            htmlTbBody += '<td><img src="themes/images/facebook_logo.png" width="50px" height="50px" style="padding: 2px;border-radius:50%;"></td>';
        } else {
            if(user.google_id) {
                htmlTbBody += '<td><img src="themes/images/google_logo.png" width="50px" height="50px" style="padding: 2px;border-radius:50%;"></td>';
            } else {
                htmlTbBody += '<td><img src="themes/images/user_logo.png" width="50px" height="50px" style="padding: 2px;border-radius:50%;"></td>';
            }
        }
        htmlTbBody += '<td class="text-center"><button type="button" class="btn btn-info"><span class="glyphicon glyphicon-edit"></span></button></td>';
        htmlTbBody += '<td class="text-center"><button type="button" class="btn btn-danger"><span class="glyphicon glyphicon-trash"></span></button></td>';
        htmlTbBody += '</tr>';
    }

    var htmlTbEnd = "";
    htmlTbEnd += '</tbody></table>';
    $("div.data").empty();
    $("div.data").append(htmlTbStart + htmlTbBody + htmlTbEnd);
}

function renderType(data) {
    var html = '';
    var typeMain = data.type_main;
    var typeMainId = 0;
    if (typeMain[0]) {
        typeMainId = typeMain[0]._id;
    }
    $("input[name='type_main_id']").val(typeMainId);
    html += '<label>Dòng Sản Phẩm: </label><select class="form-control" id="type_main_add" name="type_main_add">';
    for (var i = 0; i < typeMain.length; i++) {
        var item = typeMain[i];
        html += '<option value="' + item._id + '">' + item.name+ '</option>';
    }                   
    html += '</select><button class="btn btn-success add_type_main" data-toggle="modal" data-target="#add_type_main_modal"><span class="glyphicon glyphicon-plus"></span> Thêm</button><br><br>';
    var type = data.type;
    html += '<label>Loại Sản Phẩm: </label><select class="form-control" id="type_add" name="type_add">';
    for (var i = 0; i < type.length; i++) {
        var item = type[i];
        if (typeMainId == item.type_main) {
            html += '<option value="' + item._id + '">' + item.name+ '</option>';
        }
    }
    html += '</select><button class="btn btn-success add_type" data-toggle="modal" data-target="#add_type_modal"><span class="glyphicon glyphicon-plus"></span> Thêm</button><br>';
    html += '<br><label style="color:blue">Ví Dụ: </label><br>';
    html += '<span><p style="color:red">Dòng Sản Phẩm: <p>Thiết Bị Điện</span>';
    html += '<span><p style="color:red">Loại Sản Phẩm: <p>Dây Điện, Đèn điện, ...</span>';
    $("div.data").empty();
    $("div.data").append(html);
}