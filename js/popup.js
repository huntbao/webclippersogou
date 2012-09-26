//@huntbao @mknote
//All right reserved
(function($){
    window.MKNoteWebclipper.Popup = {
        baseUrl: chrome.i18n.getMessage('baseUrl'),
	init: function(){
	    var self = this;
	    self.jQuerySetUp();
	    self.noteList = $('#note-list');
	    self.mkbmExtra = $('#mkbm-extra');
            self.getUser(function(data){
		if(data === false){
		    //not login
		    self.initNotLogin();
		    return;
		}
		self.initEvents();
		self.getNoteList();
	    });
	    self.initCategories();
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
	itemTpl: '<li class="note-item" id="$0"><h3 class="title">$1</h3><span class="date">$2</span><p class="con">$3</p></li>',
        getNoteList: function(){
            var self = this,
	    itemTpl = self.itemTpl;
	    $.ajax({
		url: self.baseUrl + '/plugin/notelist',
		success: function(data){
		    console.log(data)
		    if(data.error){
			return;
		    }
		    var notes = data.notes.Data,
		    str = '';
		    for(var i = 0, l = notes.length; i < l; i++){
			if(notes[i].Encrypted) continue;
			str += self._format(itemTpl, [notes[i].NoteID, notes[i].Title, self.getDate(notes[i].UpdateTime), (notes[i].Abstract === '' ? '<em><空笔记></em>' : notes[i].Abstract)]);
		    }
		    if(str !== ''){
			self.noteList.html(str);
		    }else{
			
		    }
		},
		error: function(){
		    //todo
		}
	    });
        },
	initEvents: function(){
	    var self = this;
	    $('#username').html(self.userData.user.NickName).addClass('logined').attr('title', '您已登录麦库').attr('href', self.baseUrl);
	    $('#search-more-notes').attr('href', self.baseUrl + '/my');
	    var listWrap = $('#list-wrap'),
	    viewWrap = $('#view-wrap'),
	    createBtn = $('#create-button'),
	    viewBtn = $('#view-action'),
	    clipList = $('#clip-list').click(function(){
		clipDropList.show();
		$(document).one('click', function(e){
                    clipDropList.hide();
                });
		return false;
	    }),
	    clipDropList = clipList.find('.more').delegate('li a', 'click', function(){
		var t = $(this);
		clipDropList.hide();
		clipOptionStatus.html(t.html());
		self.clipAction(t.attr('action'));
		return false;
	    }),
	    clipOptionStatus = clipList.find('.status');
	    showEdit = function(callback){
		listWrap.hide();
		viewWrap.show().animate({left: 0}, 200, function(){
		    callback && callback();
		});
		createBtn.hide();
		viewBtn.show();
	    },
	    hideEdit = function(callback){
		listWrap.show();
		viewWrap.animate({left: 500}, 200, function(){
		    $(this).hide();
		    callback && callback();
		});
		createBtn.show();
		viewBtn.hide();
		clipList.css('visibility', 'hidden');
	    }
	    createBtn.click(function(){
		showEdit(function(){
		    self.initTags([]);
		    title.focus();
		});
	    });
	    $('#clip-note').click(function(){
		showEdit(function(){
		    clipList.css('visibility', 'visible');
		    self.initTags([]);
		    self.sendTabRequest('getarticle');
		});
	    });
	    self.tip = $('#action-tip');
	    var title = $('#titleinp'),
	    noteContent = $('#notecontent'),
	    resetEdit = function(saveBtn){
		self.displayCateName.data('cateid', '');
		saveBtn.data('noteid', '').data('sourceurl', '').data('importance', 0);
		title.val('');
		noteContent.html('');
		self.initTags([]);
	    }
	    self.noteTitle = title;
	    self.noteContent = noteContent;
	    self.saveBtn = $('#save-go-back').click(function(){
		var t = $(this);
		self.saveNote(
		    title.val(),
		    t.data('sourceurl'),
		    noteContent.html(),
		    self.tagHandlerEl.tagHandler('getSerializedTags'),
		    self.displayCateName.data('cateid'),
		    t.data('noteid'),
		    t.data('importance'),
		    function(data){
			hideEdit();
			resetEdit(t);
			self.getNoteById(data.Note.NoteID, function(data){
			    self.updateNote(data.note);
			});
		    }
		);
		return false;
	    });
	    var initNoteEdit = function(noteData){
		showEdit(function(){
		    $('#create-button').hide();
		    $('#view-action').show();
		});
		self.saveBtn.data('noteid', noteData.note.NoteID)
		.data('sourceurl', noteData.note.SourceUrl)
		.data('importance', noteData.note.Importance);
		title.val(noteData.note.Title);
		noteContent.html(noteData.note.Content);
		self.displayCateName.html(self.getCatetoryById(noteData.note.CategoryID));
		self.initTags(noteData.note.Tags);
	    }
	    self.noteList.delegate('.note-item', 'click', function(){
		self.getNoteById(this.id, function(data){
		    initNoteEdit(data);
		});
	    });
	    self.setCategories();
	},
	getNoteById: function(noteId, successCallback, failCallback){
	    var self = this;
	    $.ajax({
		url: self.baseUrl + '/plugin/notecontent?id=' + noteId,
		success: function(data){
		    if(data.error){
			//todo
			return;
		    }
		    successCallback && successCallback(data);
		},
		error: function(){
		    //todo
		}
	    });
	},
	initCategories: function(){
	    var self = this;
            self.mkbmExtra = $('#mkbm-extra');
            var category = self.mkbmExtra.find('.mkbm-category');
            self.displayCateName = category.find('.mkbm-category-show span');
            self.dropCateList = category.find('.mkbm-category-select');
	    self.displayCateNameWrap = self.displayCateName.parent();
	    self.displayCateNameWrap.data('title', self.displayCateNameWrap.attr('title'));
            self.displayCateNameWrap.click(function(e){
                self.dropCateList.show();
                $(document).one('click', function(e){
                    self.dropCateList.hide();
                });
                return false;
            });
            self.dropCateList.delegate('li', 'click', function(e){
                var t = $(this);
                self.displayCateName.html(t.html()).data('cateid', t.attr('cateid'));
            });    
	},
	setCategories: function(){
            var self = this,
	    userData = self.userData,
	    privateCategories = userData.categories.pri, 
	    publicCategories = userData.categories.pub,
	    displayName = '默认分类',
	    tStr = '<li class="mkbm-category-title">私人分类</li>',
            genStrByCates = function(cates){
                for(var i = 0, l = cates.length, cate; i < l; i++){
                    cate = cates[i];
                    if(cate.ParentID){
                        tStr += '<li class="mkbm-child-category" cateid="' + cate.NoteCategoryID + '">' + cate.DisplayName + '</li>';
                    }else{
                        tStr += '<li cateid="' + cate.NoteCategoryID + '">' + cate.DisplayName + '</li>';
                    }
                }
            }
            genStrByCates(privateCategories);
            tStr += '<li class="mkbm-category-title">公开分类</li>';
            genStrByCates(publicCategories);
            self.dropCateList.html(tStr);
	    self.displayCateNameWrap.attr('title', '');
        },
	getCatetoryById: function(cateid){
	    var self = this,
	    category = '',
	    cate = null;
	    for(var i = 0, l = self.userData.categories.pri.length; i < l; i++){
		cate = self.userData.categories.pri[i];
		if(cate.NoteCategoryID === cateid){
		    category = cate.DisplayName;
		    break;
		}
	    }
	    if(category === ''){
		for(var i = 0, l = self.userData.categories.pub.length; i < l; i++){
		    cate = self.userData.categories.pub[i];
		    if(cate.NoteCategoryID === cateid){
			category = cate.DisplayName;
			break;
		    }
		}
	    }
	    if(category === ''){
		return self.userData.categories.pri[0].DisplayName;
	    }else{
		return category;
	    }
	},
        initTags: function(tagsArr){
            var self = this,
            tags = self.mkbmExtra.find('.mkbm-tags').html('<div class="mkbm-taghandler"><ul class="mkbm-tagHandler-init mkbm-taghandlerContainer"></ul></div>'),
	    tagHandlerEl = tags.find('.mkbm-tagHandler-init'),
            tagsShowTimeout;
            tagHandlerEl.tagHandler({
                className: 'mkbm-taghandler',
                onAdd: function(){
                    tags.scrollTop(9999999);
                },
                onFocus: function(){
                    if(tags.attr('class').indexOf('mkbm-tags-expand') == -1){
                        tags.addClass('mkbm-tags-expand mkbm-focus');
                    }
                },
                onBlur: function(){
                    if(tags.attr('class').indexOf('mkbm-tags-expand') != -1){
                        tags.removeClass('mkbm-tags-expand mkbm-focus');
                    }
                },
		assignedTags: tagsArr
            });
            tags.bind('mouseenter', function(){
                tagsShowTimeout = setTimeout(function(){
                    tags.find('.tagInputField').focus();
                    tags.scrollTop(9999999);
                    tags.addClass('mkbm-tags-expand mkbm-focus');
                }, 300);
            });
            tags.bind('mouseleave', function(){
                clearTimeout(tagsShowTimeout);
                tags.find('.tagInputField').blur();
                tags.scrollTop(0);
                tags.removeClass('mkbm-tags-expand mkbm-focus');
            });
	    self.tagHandlerEl = tagHandlerEl;
        },
	clipAction: function(actionType){
	    var self = this;
	    switch(actionType){
		case 'article':
		    self.sendTabRequest('getarticle');
		    break;
		case 'page':
		    self.sendTabRequest('getpagecontent');
		    break;
		case 'select':
		    self.sendTabRequest('getselectcontent');
		    break;
		case 'pageurl':
		    self.sendTabRequest('getpageurl');
		    break;
		default:
		    break;
	    }
	},
	sendTabRequest: function(msg){
	    var self = this;
	    chrome.tabs.getSelected(null, function(tab){
                chrome.tabs.sendRequest(tab.id, {msg: msg}, function(data){
		    self.saveBtn.data('souceurl', data.sourceurl);
		    self.noteTitle.val(data.title.trim());
		    self.noteContent.html(data.content.trim());
                });
            });    
	},
	saveNote: function(title, sourceurl, notecontent, tags, categoryid, noteid, importance, successCallback, failCallback){
	    var self = this;
	    if(self.isSavingNote) return;
	    if(!title && !notecontent){
		self.notify(chrome.i18n.getMessage('CannotSaveBlankNote'));
		return;
	    }
	    var dataObj = {
		title: self.getTitleByText(title),
		sourceurl: sourceurl,
		notecontent: notecontent,
		tags: tags || '',
		categoryid: categoryid || '',
		noteid: noteid || '',
		importance: importance || 0
	    }
	    self.notify(chrome.i18n.getMessage('IsSavingNote'), false);
	    self.isSavingNote = true;
	    $.ajax({
		headers: {
		    'X-Requested-With': 'XMLHttpRequest'
		},
		type:'POST',
		url: self.baseUrl + '/note/save',
		data: JSON.stringify(dataObj),
		success: function(data){
		    if(data.error){
			if(data.error == 'notlogin'){
			    self.notify(chrome.i18n.getMessage('NotLogin'));
			}else{
			    self.notify(chrome.i18n.getMessage('SaveNoteFailed'));
			}
			failCallback && failCallback(data);
			return;
		    }
		    self.notify(chrome.i18n.getMessage('SaveNoteSuccess'), true);
		    successCallback && successCallback(data);
		    self.isSavingNote = false;
		},
		error: function(jqXHR, textStatus, errorThrown){
		    failCallback && failCallback();
		    self.notify(chrome.i18n.getMessage('SaveNoteFailed'));
		    self.isSavingNote = false;
		}
	    });    
	},
	updateNote: function(data){
	    var self = this,
	    note = $(document.getElementById(data.NoteID)),
	    firstNote = $(self.noteList.children()[0]);
	    if(note.length > 0){
		//update note
		//moveto top
		if(data.NoteID !== firstNote.attr('id')){
		    note.insertBefore(firstNote);
		}
		note.find('.title').html(data.Title).end()
		.find('.date').html(self.getDate(data.UpdateTime)).end()
		.find('.con').html((data.Abstract === '' ? '<em><空笔记></em>' : data.Abstract))
	    }else{
		//add note
		var newNote = $(self._format(self.itemTpl, [data.NoteID, data.Title, self.getDate(data.UpdateTime), (data.Abstract === '' ? '<em><空笔记></em>' : data.Abstract)]));
		if(firstNote.length > 0){
		    newNote.insertBefore(firstNote);
		}else{
		    self.noteList.append(newNote);
		}
	    }
	},
        initNotLogin: function(){
            var self = this,
            userSource = chrome.i18n.getMessage('userSource'),
            notLogin = $('.not-login');
            notLogin.find('.login').attr('href', self.baseUrl + '/account/preloginredirect?cooperator=' + userSource + '&redirectUrl=/login');
            notLogin.find('.register').attr('href', self.baseUrl + '/account/preloginredirect?cooperator=' + userSource + '&redirectUrl=/register');
            notLogin.show();
            $('#cover, #popupwrap').show();
	    $('#username').click(function(){
		return false;
	    });
        },
	getDate: function(str){
	    var ms = parseInt(str.split('(')[1].split(')')[0]),
	    date = new Date(ms),
	    pad = function(n){
		var str = n.toString();
		return str.length < 2 ? pad('0' + str) : str;
	    }
	    return date.getFullYear() + '-' + pad((date.getMonth() + 1)) + '-' + pad(date.getDate())
		   + ' ' + pad(date.getHours()) + ':' + pad(date.getMinutes());
	    
	},
	notify: function(info, autoHide){
	    var self = this;
	    clearTimeout(self.notifyTimer);
	    self.tip.css('opacity', 1).fadeOut(function(){
		$(this).html(info).fadeIn(function(){
		    if(autoHide){
			self.notifyTimer = setTimeout(function(){
			    self.tip.fadeOut();
			}, autoHide === true ? 3000 : autoHide);
		    }
		});
	    });
	},
	getTitleByText: function(txt){
	    //todo
	    var self = this,
	    finalTitle = '';
            if(txt.length <= 100) return txt;
            if(txt.length > 0){
                var t = txt.substr(0, 100), l = t.length, i = l - 1, hasSpecialChar = false;
                //9 : HT 
                //10 : LF 
                //44 : ,
                //65292 : ，
                //46 :　．
                //12290 : 。
                //59 : ;
                //65307 : ；
                while(i >= 0){
                    if(/^(9|10|44|65292|46|12290|59|65307)$/.test(t.charCodeAt(i))){
                        hasSpecialChar = true;
                        break;
                    }else{
                        i--;
                    }
                }
                hasSpecialChar ? (t = t.substr(0, i)) : '';
                i = 0;
                l = t.length;
                while(i < l){
                    if(/^(9|10)$/.test(t.charCodeAt(i))){
                        break;
                    }else{
                        finalTitle += t.charAt(i);
                        i++;
                    }
                }
            }
            finalTitle = finalTitle.trim();
	    return finalTitle.length > 0 ? finalTitle : '[未命名笔记]';
	},
	_format: function(str, arr){
            for(var i = 0, l = arr.length; i < l; i++){
                str = str.replace('$' + i, arr[i]);
            }
            return str;
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