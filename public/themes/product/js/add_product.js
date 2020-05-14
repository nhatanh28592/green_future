$(document).ready(function(){
 	$("#add_color").click(function() {
 		$("#color").append('<input type="color" class="form-control" name="color">');
 	});
  $("button.add_color").click(function() {
    $("div.color").append('<input type="color" class="form-control" name="color" >');
  });

 	$("select#type_main").change(function(){
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
        $("select#type").empty();
        $("select#type").append(html);
      },
      error: function (xhr, ajaxOptions, thrownError) { 
      	alert("error");
      }
    });
 	});


  $("select[name='type_main']").change(function(){
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
        $("select[name='type']").empty();
        $("select[name='type']").append(html);
      },
      error: function (xhr, ajaxOptions, thrownError) { 
        alert("error");
      }
    });
  });

});