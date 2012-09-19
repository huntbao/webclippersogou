//@huntbao @mknote
//All right reserved
(function(){
    chrome = sogouExplorer;
    if(typeof window.maikuNote == 'undefined'){
        window.maikuNote = {}
    }
    if(typeof chrome.i18n == 'undefined'){
        chrome.i18n = {
            getMessage: function(key){
                return window.maikuNote.messages[key].message;
            }
        }
    }
})();