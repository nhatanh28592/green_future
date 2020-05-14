var socket ;
$(document).ready(function () {
  if (!socket) {
    socket = io();
  }
  var infoLogin = $("input[name='key']").val();
  if (infoLogin) {
    var user = '{"user_info" : "' + infoLogin + '"}';
    socket.emit('login', infoLogin);
  }

  $(".linkfeat").hover(
    function () {
        $(".textfeat").show(500);
    },
    function () {
        $(".textfeat").hide(500);
    }
  );
  // $( window ).unload(function() {
  //   socket.emit('disconnect_user', user);
  // });

  $(".money_format").each(function(){
        var money = $(this).text();
        $(this).text(money.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,') + " VND");
  });

  $("span.dropdown-product-remove").click(function(){
    var id = $(this).next().val();
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
            root.parent().remove(); 
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

$(function () {
    //window.onscroll = function() {myFunction()};
    $('.fdi-Carousel .item').each(function () {
      var next = $(this).next();
      if (!next.length) {
        next = $(this).siblings(':first');
      }
      next.children(':first-child').clone().appendTo($(this));

      if (next.next().length > 0) {
        next.next().children(':first-child').clone().appendTo($(this));
      }
      else {
        $(this).siblings(':first').children(':first-child').clone().appendTo($(this));
      }
    });

    $("input[name='search']").on('keypress', function (e) {
      if(e.which === 13){
        window.location.href = "/?search=" + $(this).val();
      }
    });

    $("button[name='search']").on('click', function (e) {
        window.location.href = "/?search=" + $("input[name='search']").val();
    });

    $("#removeClass").click(function () {
        $('#qnimate').removeClass('popup-box-on');
    });

    $('#sing_up').click(function(){
      var userName = $(this).parent().children("input.user_name").val();
      var password = $(this).parent().children("input.password").val();
      $.ajax({
            type: 'POST',
            url: "/check_singup",
            async: true,
            data:JSON.stringify({
                    user_name: userName,
                    password: password
            }),
            dataType: 'json',
            contentType: 'application/json; charset=utf-8',
            success: function (data) {  
              if(data.status == "ok") {
                document.getElementById("form_singup").submit();
              } else {
                $("div.error_sing_up", "#form_singup").text(data.status);
                $("div.error_sing_up", "#form_singup").show();
              }
            },
            error: function (xhr, ajaxOptions, thrownError) { 
              alert("error");
            }
      });
    });

    $("#create_account").click(function(){
      $("div.error_sing_up", "#form_singup").hide();
    });
});

function myFunction(sticky) {
    var header = document.getElementById("myHeader");
    var sticky = header.offsetTop;
  if (window.pageYOffset > sticky) {
    header.classList.add("sticky");
  } else {
    header.classList.remove("sticky");
  }
}

function getDateDDMMYYY() {
  var today = new Date();
  var dd = today.getDate();

  var mm = today.getMonth()+1; 
  var yyyy = today.getFullYear();
  if(dd<10) 
  {
      dd='0'+dd;
  } 

  if(mm<10) 
  {
      mm='0'+mm;
  } 

  today = dd+'/'+mm+'/'+yyyy;
  return today;
}