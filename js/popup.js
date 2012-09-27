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
			window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
			self.getUser(function(data){
				$('#list-wrap').show();
				$('#loading-tip').remove();
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
						self.noteList.html('<p style="text-align:center">暂无笔记</p>');
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
				if(t.data('noteid')){
					//eidt
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
				}else{
					//clip note
					self.getPageContent();
				}
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
		getPageContent: function(){
			console.log('start saveing image....')
			var self = this,
			content = self.noteContent.html(),
			imgs = self.noteContent.find('img'),
			needReplaceImgs = [],
			filteredImg = {},
			filteredImgTitles = [],
			title = self.noteTitle.val(),
			sourceurl = self.saveBtn.data('sourceurl'),
			tags = self.tagHandlerEl.tagHandler('getSerializedTags'),
			categoryId = self.displayCateName.data('cateid'),
			isToSave = function(url){
				var suffix = url.substr(url.length - 4);
				return /^\.(gif|jpg|png)$/.test(suffix);
			}
			for(var i = 0, img, l = imgs.length, src; i < l; i++){
				img = imgs[i];
				src = img.src;
				if(!isToSave(src)) continue;
				if(filteredImg[src]) continue;
				filteredImg[src] = 1;
				filteredImgTitles.push(img.title || img.alt || '');
				needReplaceImgs.push(img);
			}
			if(needReplaceImgs.length === 0){
				//no imgs, just save note
				self.saveNote(title, sourceurl, content, tags, categoryId);
				return;
			}
			self.saveImgs({
			   imgs: imgs,
			   imgTitles: filteredImgTitles,
			   title: title,
			   sourceurl: sourceurl,
			   tags: tags,
			   categoryId: categoryId
			}, function(uploadedImageData, serializeSucceedImgIndexByOrder, noteId){
				var realIndex, d;
				for(var i = 0, l = needReplaceImgs.length; i < l; i++){
					realIndex = serializeSucceedImgIndexByOrder[i];
					if(realIndex){
						d = uploadedImageData[realIndex];
						needReplaceImgs[i].src = d.Url;
						delete serializeSucceedImgIndexByOrder[i];
					}
				}
				self.saveNote(title, sourceurl, content, tags, categoryId, noteId);
			}, function(){
				//all images upload failed or serialize failed, just save the page
				self.saveNote(title, sourceurl, content, tags, categoryId);
			});
			
		},
		saveImgs: function(msg, successCallback, failCallback){
			var self = this,
            content = '',
            imgs = msg.imgs,
            titles = msg.imgTitles,
            saveNormalNote = function(){
                for(var i = 0, l = imgs.length; i < l; i++){
                    content += '<img src="' + imgs[i].src + '" title="' + titles[i] + '" alt="' + titles[i] + '"><br />';
                }
                self.saveNote(msg.title, msg.sourceurl, content, msg.tags, msg.categoryId);
            }
			self.notify(chrome.i18n.getMessage('isRetrievingRemoteImgTip'));
			var totalImgNum = imgs.length,
			serializeSucceedImgNum = 0,
			serializeFailedImgNum = 0,
			serializeSucceedImgIndex = [],
			serializeSucceedImgIndexByOrder = {},
			files = {},
			removeFiles = function(){
				for(var idx in files){
					self.removeFile(files[idx].name, files[idx].size);
				}
			},
			checkComplete = function(){
				if(serializeSucceedImgNum + serializeFailedImgNum == totalImgNum){
					if(serializeFailedImgNum == totalImgNum){
						//all images retrieve failed
						if(failCallback){
							//is replace images in page content
							failCallback(true);
						}else{
							self.notify(chrome.i18n.getMessage('RetrieveImagesFailed'));
							saveNormalNote();
						}
						return false;
					}
					for(var i = 0, l = serializeSucceedImgIndex.length; i < l; i++){
						serializeSucceedImgIndexByOrder[serializeSucceedImgIndex[i]] = i.toString();
					}
					self.notify(chrome.i18n.getMessage('isUploadingImagesTip'));
					$.ajax({
						url: self.baseUrl + "/attachment/savemany/",
						type: "POST",
						data: formData,
						processData: false,
						contentType: false,
						success: function(data){
							if(data.error){
								//todo: server error, pending note...
								console.log('Internal error: ');
								console.log(data.error);
								if(failCallback){
									failCallback(true);
								}
								removeFiles();
								return;
							}
							if(successCallback){
								//is replace images in page content
								successCallback(data, serializeSucceedImgIndexByOrder, data[0].NoteID);
							}else{
								var d, 
								noteId = data[0].NoteID,
								realIndex;
								for(var i = 0, l = totalImgNum; i < l; i++){
									realIndex = serializeSucceedImgIndexByOrder[i];
									if(realIndex){
										d = data[realIndex];
										content += '<img src="' + d.Url + '" title="' + titles[i] + '" alt="' + titles[i] + '"><br />';
										delete serializeSucceedImgIndexByOrder[i];
									}else{
										content += '<img src="' + imgs[i] + '" title="' + titles[i] + '" alt="' + titles[i] + '"><br />';
									}
								}
								self.saveNote(msg.title, msg.sourceurl, content, msg.tags, '', noteId);
							}
							removeFiles();
						},
						error: function(jqXHR, textStatus, errorThrown){
							console.log('xhr error: ')
							console.log(textStatus)
							removeFiles();
							self.notify(chrome.i18n.getMessage('UploadImagesFailed'));
						}
					});
				}
				return false;
			},
			formData = new FormData();
			formData.append('type', 'Embedded');
			formData.append('categoryId', msg.categoryId || '');
			formData.append('id', msg.id || '');
			for(var i = 0, l = totalImgNum; i < l; i++){
				self.getImageFile(imgs[i], titles[i], i, function(file, idx){
					serializeSucceedImgNum++;
					serializeSucceedImgIndex.push(idx);
					formData.append('file' + idx, file);
					files[idx] = file;
					checkComplete();
				}, function(idx){
					serializeFailedImgNum++;
					checkComplete();
				});
			}
		},
		getImageFile: function(image, fileName, index, successCallback){
			console.log(image)
			var self = this,
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d');
            canvas.width = image.width;
            canvas.height = image.height;
            if(fileName.indexOf('.') == -1){
                fileName += '.png';//default png format
            }
            var ext = fileName.split('.')[1];
            ctx.drawImage(image, 0, 0);
            //var file = canvas.mozGetAsFile(fileName, 'image/' + ext);
            //successCallback(file, index);
			try{
			var blog = self.dataURItoBlob(canvas.toDataURL('image/' + ext, 0.5));}catch(e){
				console.log(e)
			}
			console.log(blob)
			
			//window.requestFileSystem(TEMPORARY, this.response.byteLength, function(fs){
				//self.writeBlobAndSendFile(fs, blob, fileName, successCallback, errorCallback, imgIndex);
			//}, self.onFileError);
		},
		dataURItoBlob:function(dataURI){
			var binary = atob(dataURI.split(',')[1]);
			console.log(binary)
			var array = [];
			for(var i = 0; i < binary.length; i++) {
				array.push(binary.charCodeAt(i));
			}
			console.log(array)
			try{
				var blog = new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
			}catch(e){
				console.log(e)
			}
			
			return;
		},
		downloadImage: function(url, imgIndex, successCallback, errorCallback){
            var self = this;
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.responseType = 'arraybuffer';
            xhr.onload = function(e){
                if (this.status == 200){
                    var suffix = url.split('.');
                    console.log(Blob)
					var blob = new WebKitBlobBuilder([this.response], {type: 'image/' + suffix[suffix.length - 1]});
					console.log(blob)
                    var parts = url.split('/'),
                    fileName = parts[parts.length - 1];
					
                    window.requestFileSystem(TEMPORARY, this.response.byteLength, function(fs){
                        self.writeBlobAndSendFile(fs, blob, fileName, successCallback, errorCallback, imgIndex);
                    }, self.onFileError);
                }
            }
            xhr.onerror = function(){
                console.log('retrieve remote image xhr onerror')
                errorCallback && errorCallback(imgIndex);
            }
            xhr.onabort = function(){
                console.log('retrieve remote image xhr onabort')
                errorCallback && errorCallback(imgIndex);
            }
            xhr.send(null);
        },
		writeBlobAndSendFile: function(fs, blob, fileName, successCallback, errorCallback, imgIndex){
            var self = this;
            fs.root.getFile(fileName, {create: true}, function(fileEntry){
                fileEntry.createWriter(function(fileWriter){
                    fileWriter.onwrite = function(e){
                        console.log('Write completed.');
                        fileEntry.file(function(file){
                            successCallback(file, imgIndex);
                        });
                    };
                    fileWriter.onerror = function(e){
                        console.log('Write failed: ' + e.toString());
                    };
                    fileWriter.write(blob);
                }, self.onFileError);
            }, self.onFileError);
        },
		removeFile: function(fileName, fileSize){
            var self = this;
            window.requestFileSystem(TEMPORARY, fileSize, function(fs){
                fs.root.getFile(fileName, {}, function(fileEntry){
                    fileEntry.remove(function() {
                        console.log('File ' + fileName + ' removed.');
                    }, self.onFileError);
                }, self.onFileError);
            }, self.onFileError);
        },
		onFileError: function(err){
            for(var p in FileError){
                if(FileError[p] == err.code){
                    console.log('Error code: ' + err.code + 'Error info: ' + p);
                    break;
                }
            }
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
			self.notify(chrome.i18n.getMessage('GettingContent'), 10000);
			chrome.tabs.getSelected(null, function(tab){
				chrome.tabs.sendRequest(tab.id, {msg: msg}, function(data){
					self.notify('');
					if(data.content === false || data.content === ''){
						self.notify(chrome.i18n.getMessage('GetContentFailed'), true);
					}else{
						self.saveBtn.data('souceurl', data.sourceurl);
						self.noteTitle.val(data.title.trim());
						self.noteContent.html(data.content.trim());
					}
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
				if(info === ''){
					$(this).html('');
					return;
				}
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