//@huntbao @mknote
//All right reserved
(function(){
    chrome = sogouExplorer;
    if(typeof MKNoteWebclipper === 'undefined'){
        MKNoteWebclipper = {};
    }
    MKNoteWebclipper.jQuery = jQuery.noConflict(true);
    if(typeof chrome.i18n === 'undefined'){
        chrome.i18n = {
            getMessage: function(key){
                return window.MKNoteWebclipper.messages[key].message;
            }
        }
    }
})();