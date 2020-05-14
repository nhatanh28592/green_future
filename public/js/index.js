$(document).ready(function(){
	$("button[name='add_cart']").click(function(){
		var checkAdd = false;
		var productId = $("input[name='product_id']").val();
		var dataInfoProduct = "";
		var price = parseInt($("input[name='price']").val());
		var name = $("input[name='product_name']").val();
		var mainFile = $("input[name='main_file']").val();
		$("input[name='input_number_product']").each(function(){
			var data = $(this).val();
			if (data != "" && data != "0") {
				checkAdd = true;
				var number = parseInt(data);
					dataInfoProduct += '{"number":"' + number + '", "color":"' + $(this).next().val() + '", "name":"' + name  +'", "main_file":"' + mainFile +'", "price":"' +  price +'"},';
			}
		});
		if (checkAdd) {
			$.ajax({
		        type: 'POST',
		        url: "/add_product_to_cart",
		        async: true,
		        data:JSON.stringify({
		                product_id: productId,
		                product_info: JSON.parse("[" + dataInfoProduct.substring(0, dataInfoProduct.length -1) + "]")
		        }),
		        dataType: 'json',
		        contentType: 'application/json; charset=utf-8',
		        success: function (data) {  
		         	$(".product_add_cart").text("[" + data.product_total + "]");
             		$(".product_add_cart").parent().parent().parent().removeClass("disabled");
		         	swal({
						 title: "Thông báo",
						 text: "1 sản phẩm đã được thêm thành công vào giỏ hàng, click vào giỏ hàng để xem chi tiết",
						 type: "success",
						 confirmButtonText: "close"
					}); 
		         	$("div.alert-success").show().fadeOut(10000);
		        },
		        error: function (xhr, ajaxOptions, thrownError) { 
		        	alert("error");
		        }
			});
		}else {
			swal({
			 title: "Thông báo",
			 text: "Vui lòng nhập số lượng sản phẩm !",
			 type: "error",
			 confirmButtonText: "close"
			}); 
		}
	});
	$(".money").each(function(){
        var money = $(this).text();
        $(this).text(money.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,'));
    });

	$(".open_modal").click(function(){
		var productId = $(this).next().val();
		$.ajax({
            type: 'POST',
            url: "/product_details",
            async: true,
            data:JSON.stringify({
                    product_id: productId
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
             	var productInfo = data.product.info_product;;
             	var color = productInfo.color;
             	$("h3.name").html('');
             	$("h3.name").append(productInfo.name);

				$("div.description").html('');
             	$("div.description").append(productInfo.description);

				$("strong.money").html('');
             	$("strong.money").append(productInfo.price.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + " Đ");
             	$("#mainView").html('');
             	$("#mainView").append(
             		'<a href="" title="' + productInfo.name + '">' + 
						'<img class="view_main_image" id="imageView" src="upload/' + productInfo.main_file + '" style="width:100%" alt="' + productInfo.name + '"/> ' +
		            '</a>');
             	var htmlFile = '';
             	for (var i = 0; i < data.product.file.length; i++) {
             		var file = data.product.file[i];
             		htmlFile += '<span class="view_image"> <img style="width:20%" src="upload/' + file.fileName + '" alt=""/></span>'
             	}
             	$("div.file_name").html('');
             	$("div.file_name").append(htmlFile);
             	//$('#gallery a').lightBox();

             	$("div.color_modal").html('');

         		$("div.color_modal").append('<div>Số lượng: <input type="number" name="input_number_product" class="" value="0" min="0"></div>');

             	$("div.input_type_hidden").html('');
             	$("div.input_type_hidden").append('<input type="hidden" name="product_id" value="' +  data.product._id + '">');
             	$("div.input_type_hidden").append('<input type="hidden" name="price" value="' +  productInfo.price + '">');
             	$("div.input_type_hidden").append('<input type="hidden" name="product_name" value="' +  productInfo.name + '">');
             	$("div.input_type_hidden").append('<input type="hidden" name="main_file" value="' +  productInfo.main_file + '">');

		   		$(".view_image").click(function(){
		   			$("#imageView").attr("src", $(this).children().attr("src"));
		   		});
            },
            error: function (xhr, ajaxOptions, thrownError) { 
            	alert("Da co loi xay ra");
            }
    	});
	});
});

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
}