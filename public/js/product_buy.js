$(document).ready(function(){
	$("#mobile").keypress(function (e) {
     //if the letter is not digit then display error and don't type anything
     if (e.which != 8 && e.which != 0 && (e.which < 48 || e.which > 57)) {
        //display error message
        $("#errmsg_mobile").html("Vui lòng chỉ nhập số !").show().fadeOut(3000);
        return false;
    }
   });
  $("button.btn-delete").click(function(){
    var id = $(this).parent().next().val();
    var root = $(this);
    $.ajax({
          type: 'POST',
          url: "/delete_product_from_cart",
          async: true,
          data:JSON.stringify({
                  id: id
          }),
          dataType: 'json',
          contentType: 'application/json; charset=utf-8',
          success: function (data) {  
            swal({
               title: "Thông báo",
               text: "Xóa sản phẩm thành công !",
               type: "success",
               confirmButtonText: "close"
            });
            root.parent().parent().remove(); 
            if (data.total == 0) {
              window.location.href = "/";
            }
          },
          error: function (xhr, ajaxOptions, thrownError) { 
            alert("error");
            return false;
          }
    });
  });
});