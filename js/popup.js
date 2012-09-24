//@huntbao @mknote
//All right reserved
(function($){
    window.MKNoteWebclipper.Popup = {
        baseUrl: chrome.i18n.getMessage('baseUrl'),
	init: function(){
	    var self = this;
	    self.jQuerySetUp();
            self.getUser(function(data){
		if(data === false){
		    //not login
		    self.initNotLogin();
		    return;
		}
		self.getNoteList();
	    });
	},
        getUser: function(callback){
            var self = this;
            if(self.userData){
                callback(self.userData);
                return;
            }
	    $.ajax({
		url: self.baseUrl + '/plugin/clipperdata',
		success: function(data){
		    console.log(data)
		    if(data.error){
			//not login
			callback(false);
			return;
		    }
		    self.userData = data;
		    callback(data);
		},
		error: function(){
		    callback(false);
		}
	    });
        },
        getNoteList: function(){
            var self = this;
	    $.ajax({
		url: self.baseUrl + '/plugin/notelist',
		success: function(data){
		    console.log(data)
		    
		},
		error: function(){
		    //todo
		}
	    });
        },
        initNotLogin: function(){
            var self = this,
            userSource = chrome.i18n.getMessage('userSource'),
            notLogin = $('.not-login');
            notLogin.find('.login').attr('href', self.baseUrl + '/account/preloginredirect?cooperator=' + userSource + '&redirectUrl=/login');
            notLogin.find('.register').attr('href', self.baseUrl + '/account/preloginredirect?cooperator=' + userSource + '&redirectUrl=/register');
            notLogin.show();
            $('#cover, #popupwrap').show();
        },
        jQuerySetUp:function(){
            $.ajaxSetup({
                dataType: 'text',
                cache: false,
                dataFilter: function(data){
                    data = $.parseJSON(data.substr(9));//remove 'while(1);'
                    return data.success ? data.data : {error: data.error};
                }
            });
        }
    }
    $(function(){
	window.MKNoteWebclipper.Popup.init();
    });
})(MKNoteWebclipper.jQuery);