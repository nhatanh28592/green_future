$(function () {
	var socket = io();
	$("input[name='message']").on('keypress', function (e) {
	    if(e.which === 13){
	    	var key_1 = $("input[name='key']").val();
			var key_2 = $("input.key_2_active").val();
			var time = new Date().toLocaleString();
			var msg = '{"key":"'+ key_1 + '_' + key_2 + '", "message": "' + $(this).val() + '", "time":"' + time + '"}';
	      	socket.emit('message', msg);
	      	$(this).val('');
	      	return false;
	    }
	});

	socket.on('message', function(msg){
		var key_1 = $("input[name='key']").val();
		var key_2 = $("input.key_2_active").val();
		var urlPictureUser = $("input[name='url_picture_user']").val();
	  	var urlPictureActive = $("input.url_picture_active").val();
		var key_12 = key_1 + "_" + key_2;
		var key_21 = key_2 + "_" + key_1;
		var msgObj = JSON.parse(msg);
		if(msg.indexOf(key_12) != -1) {
			$('div.direct-chat-msg').append(
				'<div class="direct-chat-info clearfix">'+
					'<span class="direct-chat-name-right pull-right">userName</span>'+
				'</div>'+
				'<img alt="message user image" src="' + urlPictureUser + '" class="direct-chat-img pull-right">'+
				'<div class="direct-chat-text direct-chat-text-right">'+ msgObj.message +'</div>' +
				'<div class="direct-chat-info clearfix">' + 
					'<span class="direct-chat-timestamp pull-right">' + msgObj.time + '</span>'+
				'</div>'
			);
			bottomScrollBar();
		} else {
			if (msg.indexOf(key_21) != -1) {
				$('div.direct-chat-msg').append(
					'<div class="direct-chat-info clearfix">' + 
						'<span class="direct-chat-name-left pull-left">userName</span>' +
	 				'</div>' +
	  				'<img alt="message user image" src="' + urlPictureActive + '" class="direct-chat-img pull-left" >' +
	  				'<div class="direct-chat-text direct-chat-text-left">' + msgObj.message + '</div>' +
	  				'<div class="direct-chat-info clearfix">' +
						'<span class="direct-chat-timestamp pull-right">' + msgObj.time + '</span>' +
	  				'</div>'
				);
				bottomScrollBar();
			}
		}
	});

    $("#addClass").click(function () { 
    	if($("input[name='user']").val()) {
    		refreshListChat();
    	} else {
    		$('#modal_login').modal('show');
    	}
    });

	$('div').delegate( ".popup-head-list-chat", "click", function() {
		$('#qnimate').addClass('popup-box-on');
		$('div.direct-chat-msg').empty();
		$('div.direct-chat-msg').append('<div class="loader"></div>');
		var imgUrl = $(this).children("div.popup-head-left-list-chat").children().attr("src");
		var userName = $(this).children("div.popup-head-left-list-chat").text();
		$("div.popup-head-left img").attr("src", imgUrl);
		$("span.user_name").text(userName + " ");
		//Check online
		if ($(this).children(".popup-head-right-list-chat").length) {
			$("span.user_name").append('<i class="fa fa-circle pull-right" style="color:rgb(66, 183, 42);font-size: x-small;"></i>');
		}
		$(".url_picture_active").removeClass("url_picture_active");
		$(this).children("input[name='url_picture']").addClass("url_picture_active");
		$(".key_2_active").removeClass("key_2_active");
		$(this).children("input[name='key_2']").addClass("key_2_active");

		var key_1 = $("input[name='key']").val();
		var key_2 = $(this).children("input[name='key_2']").val();
		$.ajax({
		type: 'POST',
		url: "/open_chat",
		async: true,
		data:JSON.stringify({
	        key_1: key_1,
	        key_2: key_2
		}),
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		success: function (data) { 
			var urlPictureUser = $("input[name='url_picture_user']").val();
		  	var urlPictureActive = $("input.url_picture_active").val();
		  	var keyUser = $("input[name='key']").val();
		  	$('div.direct-chat-msg').empty();
		  	for (var i = 0; i < data.list_message.length; i++) {
		  		var msg = data.list_message[i];
		  		if(msg.key.startsWith(keyUser)) {
			  		$('div.direct-chat-msg').append(
						'<div class="direct-chat-info clearfix">'+
							'<span class="direct-chat-name-right pull-right">userName</span>'+
						'</div>'+
						'<img alt="message user image" src="' + urlPictureUser + '" class="direct-chat-img pull-right">'+
						'<div class="direct-chat-text direct-chat-text-right">'+ msg.message +'</div>' +
						'<div class="direct-chat-info clearfix">' + 
							'<span class="direct-chat-timestamp pull-right">' + msg.time + '</span>'+
						'</div>'
					);
					bottomScrollBar();
		  		} else {
	  				$('div.direct-chat-msg').append(
						'<div class="direct-chat-info clearfix">' + 
							'<span class="direct-chat-name-left pull-left">userName</span>' +
		 				'</div>' +
		  				'<img alt="message user image" src="' + urlPictureActive + '" class="direct-chat-img pull-left" >' +
		  				'<div class="direct-chat-text direct-chat-text-left">' + msg.message + '</div>' +
		  				'<div class="direct-chat-info clearfix">' +
							'<span class="direct-chat-timestamp pull-right">' + msg.time + '</span>' +
		  				'</div>'
					);
					bottomScrollBar();
		  		}
		  	}
		},
		error: function (xhr, ajaxOptions, thrownError) { 
		  alert("error");
		}
		});
	});
});

function bottomScrollBar() {
	var objDiv = document.getElementById("popup-messages");
	objDiv.scrollTop = objDiv.scrollHeight;
}

function refreshListChat() {
	$("div#listChat").addClass('popup-box-on');
	$("div#listChat").empty();
	$("div#listChat").append('<div class="loader_list_chat"></div>');
    $.ajax({
		type: 'POST',
		url: "/list_chat",
		async: true,
		data:JSON.stringify({
	        key: "list_user"
		}),
		dataType: 'json',
		contentType: 'application/json; charset=utf-8',
		success: function (data) { 
			$("div#listChat").empty();
			var pictureUrl = "";
			for (var i = 0; i < data.list_user.length; i++) {
				var key = $("input[name='key']").val();
				var user = data.list_user[i];
				var user_id = "";
				if (user.user_name != key && user.facebook_id != key && user.google_id != key) {
					var html = '';
					html += '<div class="popup-head-list-chat">';
					if (user.facebook_id) {
						user_id = user.facebook_id;
						html += '<input type="hidden" name="key_2" value="' + user.facebook_id +'">';
						html += '<input type="hidden" name="url_picture" value="http://graph.facebook.com/' + user.facebook_id + '/picture?type=normal">';
						pictureUrl = 'http://graph.facebook.com/' + user.facebook_id + '/picture?type=normal';
					} else {
						pictureUrl = user.picture;
						html += '<input type="hidden" name="url_picture" value="' + user.picture + '">';
						if(user.google_id) {
							user_id = user.google_id;
							html += '<input type="hidden" name="key_2" value="' + user.google_id +'">';
						} else {
							user_id = user.user_name;
							html += '<input type="hidden" name="key_2" value="' + user.user_name +'">';
						}
					}

					if (pictureUrl) {
						html += '<div class="popup-head-left-list-chat pull-left" title="' + user.user_name +'"><img src="' + pictureUrl + '" alt="iamgurdeeposahan"> ' + user.user_name +'</div>';
					} else {
						html += '<div class="popup-head-left-list-chat pull-left" title="' + user.user_name +'"><img src="themes/img/user_default.jpg" alt="iamgurdeeposahan"> ' + user.user_name +'</div>';
					}
					if (data.list_user_on.includes(user_id)) {
						html += '<div class="popup-head-right-list-chat pull-right"><i class="fa fa-circle pull-right" style="color:rgb(66, 183, 42);font-size: x-small;"></i></div> </div>';
					} else {
						// Set time online
					}
					$("div#listChat").append(html);
				}
			}
		},
		error: function (xhr, ajaxOptions, thrownError) { 
		  alert("error");
		}
	});
}